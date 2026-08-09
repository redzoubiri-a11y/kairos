const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');
const { isExpoPushToken } = require('./push.service');

// Un appareil peut changer de main : le jeton est unique, donc l'enregistrer a
// nouveau le rattache simplement au compte courant plutot que d'echouer.
async function register(userId, { token, platform, deviceName }) {
  if (!isExpoPushToken(token)) {
    throw ApiError.badRequest('Jeton de notification invalide');
  }

  return prisma.deviceToken.upsert({
    where: { token },
    create: { userId, token, platform, deviceName },
    update: { userId, platform, deviceName, lastUsedAt: new Date() },
    select: { id: true, platform: true, deviceName: true, createdAt: true, lastUsedAt: true },
  });
}

// La deconnexion ne doit plus rien envoyer a cet appareil.
async function unregister(userId, token) {
  const { count } = await prisma.deviceToken.deleteMany({ where: { token, userId } });
  return { removed: count };
}

function list(userId) {
  return prisma.deviceToken.findMany({
    where: { userId },
    select: { id: true, platform: true, deviceName: true, createdAt: true, lastUsedAt: true },
    orderBy: { lastUsedAt: 'desc' },
  });
}

module.exports = { register, unregister, list };
