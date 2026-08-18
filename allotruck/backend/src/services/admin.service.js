const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');
const realtime = require('../websocket/realtime');
const notificationService = require('./notification.service');
const documentService = require('./document.service');

const TRANSPORTER_INCLUDE = {
  user: { select: { id: true, fullName: true, email: true, phone: true, createdAt: true } },
  documents: { orderBy: { createdAt: 'desc' } },
  _count: { select: { trucks: true, trips: true, missions: true } },
};

async function listTransporters({ status, search, page = 1, limit = 20 } = {}) {
  const where = {
    ...(status ? { verificationStatus: status } : {}),
    ...(search
      ? {
          OR: [
            { companyName: { contains: search, mode: 'insensitive' } },
            { city: { contains: search, mode: 'insensitive' } },
            { user: { email: { contains: search, mode: 'insensitive' } } },
          ],
        }
      : {}),
  };

  const [total, items] = await prisma.$transaction([
    prisma.transporterProfile.count({ where }),
    prisma.transporterProfile.findMany({
      where,
      include: TRANSPORTER_INCLUDE,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return {
    items: items.map(documentService.decorateProfile),
    total,
    page,
    limit,
    pages: Math.ceil(total / limit) || 1,
  };
}

async function verifyTransporter(transporterId, { status, reason }) {
  const profile = await prisma.transporterProfile.findUnique({ where: { id: transporterId } });
  if (!profile) throw ApiError.notFound('Transporteur introuvable');

  if (status === 'REJECTED' && !reason) {
    throw ApiError.badRequest('Un motif est requis pour un refus');
  }

  const updated = await prisma.transporterProfile.update({
    where: { id: transporterId },
    data: {
      verificationStatus: status,
      rejectionReason: status === 'REJECTED' ? reason : null,
      verifiedAt: status === 'VERIFIED' ? new Date() : null,
    },
    include: TRANSPORTER_INCLUDE,
  });

  // A rejected or pending transporter must disappear from the client map.
  if (status !== 'VERIFIED') {
    await prisma.truck.updateMany({ where: { transporterId }, data: { isAvailable: false } });
  }

  realtime.emitToUser(updated.userId, 'transporter:verification', {
    status,
    reason: updated.rejectionReason,
  });
  await notificationService.push({
    userId: updated.userId,
    type: status === 'VERIFIED' ? 'ACCOUNT_VERIFIED' : 'ACCOUNT_REJECTED',
    title: status === 'VERIFIED' ? 'Compte verifie' : 'Dossier refuse',
    body:
      status === 'VERIFIED'
        ? 'Vos documents ont ete valides, vous pouvez declarer vos trajets.'
        : `Motif: ${reason}`,
    data: { transporterId },
  });

  return documentService.decorateProfile(updated);
}

async function stats() {
  const [
    users,
    clients,
    transporters,
    pendingTransporters,
    verifiedTransporters,
    trucks,
    availableTrucks,
    trips,
    activeTrips,
    missions,
    missionsByStatus,
  ] = await prisma.$transaction([
    prisma.user.count(),
    prisma.user.count({ where: { role: 'CLIENT' } }),
    prisma.user.count({ where: { role: 'TRANSPORTER' } }),
    prisma.transporterProfile.count({ where: { verificationStatus: 'PENDING' } }),
    prisma.transporterProfile.count({ where: { verificationStatus: 'VERIFIED' } }),
    prisma.truck.count(),
    prisma.truck.count({ where: { isAvailable: true } }),
    prisma.trip.count(),
    prisma.trip.count({ where: { status: { in: ['SCHEDULED', 'IN_PROGRESS'] } } }),
    prisma.mission.count(),
    prisma.mission.groupBy({ by: ['status'], _count: { _all: true } }),
  ]);

  const completed = missionsByStatus.find((m) => m.status === 'COMPLETED')?._count._all ?? 0;

  return {
    users: { total: users, clients, transporters },
    transporters: { pending: pendingTransporters, verified: verifiedTransporters },
    trucks: { total: trucks, available: availableTrucks },
    trips: { total: trips, active: activeTrips },
    missions: {
      total: missions,
      byStatus: Object.fromEntries(missionsByStatus.map((m) => [m.status, m._count._all])),
      completionRate: missions ? Number(((completed / missions) * 100).toFixed(1)) : 0,
    },
  };
}

async function listUsers({ role, search, page = 1, limit = 20 } = {}) {
  const where = {
    ...(role ? { role } : {}),
    ...(search
      ? {
          OR: [
            { fullName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const [total, items] = await prisma.$transaction([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return { items, total, page, limit, pages: Math.ceil(total / limit) || 1 };
}

async function setUserActive(actorId, userId, isActive) {
  // Le back-office grise deja le bouton, mais un bouton grise n'est pas une
  // regle : l'API l'acceptait. Un administrateur qui se desactivait lui-meme
  // etait ensuite refuse par requireAuth, donc incapable de revenir en arriere.
  // Comme il ne peut desactiver que d'autres comptes, il reste toujours au
  // moins un administrateur actif : celui qui agit.
  if (!isActive && userId === actorId) {
    throw ApiError.badRequest(
      'Vous ne pouvez pas desactiver votre propre compte : plus personne ne pourrait le reactiver'
    );
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { isActive },
    select: { id: true, email: true, fullName: true, role: true, isActive: true },
  });
  return user;
}

async function getTransporter(transporterId) {
  const profile = await prisma.transporterProfile.findUnique({
    where: { id: transporterId },
    include: TRANSPORTER_INCLUDE,
  });
  if (!profile) throw ApiError.notFound('Transporteur introuvable');
  return documentService.decorateProfile(profile);
}

module.exports = {
  listTransporters,
  getTransporter,
  verifyTransporter,
  stats,
  listUsers,
  setUserActive,
};
