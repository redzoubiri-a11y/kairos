const prisma = require('../config/prisma');
const realtime = require('../websocket/realtime');

async function push({ userId, type, title, body, data }) {
  const notification = await prisma.notification.create({
    data: { userId, type, title, body, data: data ?? undefined },
  });
  realtime.emitToUser(userId, 'notification:new', notification);
  return notification;
}

function list(userId, { unreadOnly = false, take = 50 } = {}) {
  return prisma.notification.findMany({
    where: { userId, ...(unreadOnly ? { readAt: null } : {}) },
    orderBy: { createdAt: 'desc' },
    take,
  });
}

async function markAllRead(userId) {
  const { count } = await prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
  return { updated: count };
}

module.exports = { push, list, markAllRead };
