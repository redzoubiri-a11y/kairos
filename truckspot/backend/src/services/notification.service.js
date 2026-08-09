const prisma = require('../config/prisma');
const realtime = require('../websocket/realtime');
const pushService = require('./push.service');

async function push({ userId, type, title, body, data }) {
  const notification = await prisma.notification.create({
    data: { userId, type, title, body, data: data ?? undefined },
  });

  // Application ouverte : la websocket suffit et arrive instantanement.
  realtime.emitToUser(userId, 'notification:new', notification);

  // Application fermee ou en arriere-plan : la notification systeme prend le
  // relais. Detachee, pour ne pas faire dependre la reponse HTTP d'un appel a
  // un service tiers.
  pushService.sendToUserDetached(userId, {
    title,
    body,
    data: { ...(data ?? {}), notificationId: notification.id, type },
  });

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
