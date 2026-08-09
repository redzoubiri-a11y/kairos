const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');
const realtime = require('../websocket/realtime');
const notificationService = require('./notification.service');

const MISSION_INCLUDE = {
  client: { select: { id: true, fullName: true, phone: true, email: true } },
  truck: { select: { id: true, plateNumber: true, type: true, volumeM3: true, capacityKg: true, photoUrl: true } },
  trip: { select: { id: true, originCity: true, destinationCity: true, departureAt: true } },
  transporter: {
    select: {
      id: true,
      companyName: true,
      city: true,
      user: { select: { id: true, fullName: true, phone: true } },
    },
  },
};

const ALLOWED_TRANSITIONS = {
  PENDING: ['ACCEPTED', 'REJECTED', 'CANCELLED'],
  ACCEPTED: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
  REJECTED: [],
  COMPLETED: [],
  CANCELLED: [],
};

const STATUS_LABELS = {
  PENDING: 'en attente',
  ACCEPTED: 'acceptee',
  REJECTED: 'refusee',
  IN_PROGRESS: 'en cours',
  COMPLETED: 'terminee',
  CANCELLED: 'annulee',
};

const TRANSPORTER_ACTIONS = ['ACCEPTED', 'REJECTED', 'IN_PROGRESS', 'COMPLETED'];
const CLIENT_ACTIONS = ['CANCELLED'];

async function create(clientUser, data) {
  const transporter = await prisma.transporterProfile.findUnique({
    where: { id: data.transporterId },
    include: { user: { select: { id: true } } },
  });
  if (!transporter) throw ApiError.notFound('Transporteur introuvable');
  if (transporter.verificationStatus !== 'VERIFIED') {
    throw ApiError.badRequest("Ce transporteur n'est pas verifie");
  }
  if (transporter.userId === clientUser.id) {
    throw ApiError.badRequest('Vous ne pouvez pas vous envoyer une mission a vous-meme');
  }

  if (data.truckId) {
    const truck = await prisma.truck.findUnique({ where: { id: data.truckId } });
    if (!truck || truck.transporterId !== transporter.id) {
      throw ApiError.badRequest("Ce camion n'appartient pas au transporteur cible");
    }
    if (data.volumeM3 > truck.volumeM3) throw ApiError.badRequest('Volume superieur a la capacite du camion');
    if (data.weightKg > truck.capacityKg) throw ApiError.badRequest('Poids superieur a la charge utile du camion');
  }

  if (data.tripId) {
    const trip = await prisma.trip.findUnique({ where: { id: data.tripId } });
    if (!trip || trip.transporterId !== transporter.id) {
      throw ApiError.badRequest("Ce trajet n'appartient pas au transporteur cible");
    }
    if (data.volumeM3 > trip.freeVolumeM3) throw ApiError.badRequest('Volume superieur au volume libre du trajet');
    if (data.weightKg > trip.freeWeightKg) throw ApiError.badRequest('Poids superieur a la charge libre du trajet');
  }

  const mission = await prisma.mission.create({
    data: { ...data, clientId: clientUser.id },
    include: MISSION_INCLUDE,
  });

  realtime.emitToUser(transporter.userId, 'mission:new', mission);
  await notificationService.push({
    userId: transporter.userId,
    type: 'MISSION_CREATED',
    title: 'Nouvelle demande de mission',
    body: `${clientUser.fullName} — ${mission.pickupCity} → ${mission.dropoffCity} (${mission.volumeM3} m3)`,
    data: { missionId: mission.id },
  });

  return mission;
}

async function list(user, filters = {}) {
  const { status, role, page = 1, limit = 20 } = filters;

  const where = { ...(status ? { status } : {}) };

  if (user.role === 'ADMIN' && role === 'all') {
    // no scoping
  } else if (user.role === 'TRANSPORTER' && role !== 'client') {
    if (!user.transporter) throw ApiError.forbidden('Profil transporteur manquant');
    where.transporterId = user.transporter.id;
  } else {
    where.clientId = user.id;
  }

  const [total, items] = await prisma.$transaction([
    prisma.mission.count({ where }),
    prisma.mission.findMany({
      where,
      include: MISSION_INCLUDE,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return { items, total, page, limit, pages: Math.ceil(total / limit) || 1 };
}

async function getAccessible(user, missionId) {
  const mission = await prisma.mission.findUnique({
    where: { id: missionId },
    include: { ...MISSION_INCLUDE, transporter: { include: { user: { select: { id: true } } } } },
  });
  if (!mission) throw ApiError.notFound('Mission introuvable');

  const isClient = mission.clientId === user.id;
  const isTransporter = mission.transporter.userId === user.id;
  if (!isClient && !isTransporter && user.role !== 'ADMIN') {
    throw ApiError.forbidden("Vous n'avez pas acces a cette mission");
  }

  return { mission, isClient, isTransporter };
}

async function updateStatus(user, missionId, status, reason) {
  const { mission, isClient, isTransporter } = await getAccessible(user, missionId);

  if (!ALLOWED_TRANSITIONS[mission.status]?.includes(status)) {
    throw ApiError.badRequest(`Transition impossible: ${mission.status} → ${status}`);
  }

  if (user.role !== 'ADMIN') {
    if (isTransporter && !TRANSPORTER_ACTIONS.includes(status)) {
      throw ApiError.forbidden('Action non autorisee pour un transporteur');
    }
    if (isClient && !CLIENT_ACTIONS.includes(status)) {
      throw ApiError.forbidden('Un client peut uniquement annuler la mission');
    }
  }

  const updated = await prisma.$transaction(async (tx) => {
    const next = await tx.mission.update({
      where: { id: missionId },
      data: {
        status,
        statusReason: reason ?? null,
        ...(status === 'ACCEPTED' ? { acceptedAt: new Date() } : {}),
        ...(status === 'COMPLETED' ? { completedAt: new Date() } : {}),
      },
      include: MISSION_INCLUDE,
    });

    // Accepting consumes the declared free capacity of the trip.
    if (status === 'ACCEPTED' && next.tripId) {
      await tx.trip.update({
        where: { id: next.tripId },
        data: {
          freeVolumeM3: { decrement: next.volumeM3 },
          freeWeightKg: { decrement: next.weightKg },
        },
      });
    }

    // Cancelling after acceptance gives that capacity back.
    if (status === 'CANCELLED' && mission.status !== 'PENDING' && next.tripId) {
      await tx.trip.update({
        where: { id: next.tripId },
        data: {
          freeVolumeM3: { increment: next.volumeM3 },
          freeWeightKg: { increment: next.weightKg },
        },
      });
    }

    return next;
  });

  const counterpartUserId = isClient ? updated.transporter.user.id : updated.clientId;
  const notificationType =
    status === 'ACCEPTED' ? 'MISSION_ACCEPTED' : status === 'REJECTED' ? 'MISSION_REJECTED' : 'MISSION_STATUS';

  realtime.emitToUser(counterpartUserId, 'mission:updated', updated);
  realtime.emitToMission(updated.id, 'mission:updated', updated);
  await notificationService.push({
    userId: counterpartUserId,
    type: notificationType,
    title: `Mission ${STATUS_LABELS[status]}`,
    body: `${updated.pickupCity} → ${updated.dropoffCity}${reason ? ` — ${reason}` : ''}`,
    data: { missionId: updated.id, status },
  });

  return updated;
}

module.exports = { create, list, getAccessible, updateStatus, MISSION_INCLUDE };
