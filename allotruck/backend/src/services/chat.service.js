const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');
const realtime = require('../websocket/realtime');
const missionService = require('./mission.service');
const notificationService = require('./notification.service');

const MESSAGE_INCLUDE = {
  sender: { select: { id: true, fullName: true, role: true } },
};

async function send(user, { missionId, content }) {
  const { mission, isClient } = await missionService.getAccessible(user, missionId);

  if (['REJECTED', 'CANCELLED'].includes(mission.status)) {
    throw ApiError.badRequest('La conversation est fermee pour cette mission');
  }

  const message = await prisma.chatMessage.create({
    data: { missionId, senderId: user.id, content },
    include: MESSAGE_INCLUDE,
  });

  realtime.emitToMission(missionId, 'chat:message', message);

  // Separate event on the personal channel: a recipient already in the mission
  // room would otherwise render the same message twice.
  const recipientId = isClient ? mission.transporter.user.id : mission.clientId;
  realtime.emitToUser(recipientId, 'chat:inbox', message);
  await notificationService.push({
    userId: recipientId,
    type: 'CHAT_MESSAGE',
    title: `Message de ${user.fullName}`,
    body: content.slice(0, 120),
    data: { missionId, messageId: message.id },
  });

  return message;
}

async function history(user, missionId, { before, limit = 50 } = {}) {
  await missionService.getAccessible(user, missionId);

  const messages = await prisma.chatMessage.findMany({
    where: { missionId, ...(before ? { createdAt: { lt: before } } : {}) },
    include: MESSAGE_INCLUDE,
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  // Newest-first for pagination, oldest-first for rendering.
  return messages.reverse();
}

async function markRead(user, missionId) {
  await missionService.getAccessible(user, missionId);
  const { count } = await prisma.chatMessage.updateMany({
    where: { missionId, senderId: { not: user.id }, readAt: null },
    data: { readAt: new Date() },
  });
  if (count > 0) realtime.emitToMission(missionId, 'chat:read', { missionId, readerId: user.id });
  return { updated: count };
}

module.exports = { send, history, markRead };
