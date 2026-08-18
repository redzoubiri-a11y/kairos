const prisma = require('../config/prisma');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');
const realtime = require('../websocket/realtime');
const { distanceKm, boundingBox } = require('../utils/geo');
const transporterService = require('./transporter.service');

const TRUCK_INCLUDE = {
  transporter: {
    select: {
      id: true,
      companyName: true,
      city: true,
      verificationStatus: true,
      user: { select: { id: true, fullName: true, phone: true } },
    },
  },
};

async function create(userId, data) {
  const profile = await transporterService.getMine(userId);
  return prisma.truck.create({
    data: {
      ...data,
      transporterId: profile.id,
      // Une position declaree a l'inscription est datee comme une autre : sans
      // cela elle n'aurait pas d'age et echapperait a la fenetre de fraicheur.
      ...(data.latitude !== undefined && data.longitude !== undefined
        ? { lastPositionAt: new Date() }
        : {}),
    },
    include: TRUCK_INCLUDE,
  });
}

// Meme regle que listAvailable, expose au transporteur : il doit pouvoir
// constater que son camion a disparu de la carte, sans avoir a deviner le delai.
function isPositionFresh(lastPositionAt, minutes = env.truckPositionTtlMinutes) {
  if (!lastPositionAt) return false;
  return Date.now() - new Date(lastPositionAt).getTime() <= minutes * 60_000;
}

async function listMine(userId) {
  const profile = await transporterService.getMine(userId);
  const trucks = await prisma.truck.findMany({
    where: { transporterId: profile.id },
    orderBy: { createdAt: 'desc' },
    include: TRUCK_INCLUDE,
  });

  return trucks.map((truck) => ({
    ...truck,
    visibleOnMap:
      truck.isAvailable &&
      truck.latitude !== null &&
      truck.longitude !== null &&
      truck.transporter.verificationStatus === 'VERIFIED' &&
      isPositionFresh(truck.lastPositionAt),
  }));
}

async function assertOwned(userId, truckId) {
  const profile = await transporterService.getMine(userId);
  const truck = await prisma.truck.findUnique({ where: { id: truckId } });
  if (!truck) throw ApiError.notFound('Camion introuvable');
  if (truck.transporterId !== profile.id) throw ApiError.forbidden('Ce camion ne vous appartient pas');
  return truck;
}

async function update(userId, truckId, data) {
  await assertOwned(userId, truckId);
  return prisma.truck.update({ where: { id: truckId }, data, include: TRUCK_INCLUDE });
}

async function updatePosition(userId, truckId, { latitude, longitude, isAvailable }) {
  await assertOwned(userId, truckId);

  const truck = await prisma.truck.update({
    where: { id: truckId },
    data: {
      latitude,
      longitude,
      lastPositionAt: new Date(),
      ...(isAvailable === undefined ? {} : { isAvailable }),
    },
    include: TRUCK_INCLUDE,
  });

  // Clients watching the map get the pin moved without polling.
  realtime.broadcast('truck:position', {
    truckId: truck.id,
    latitude: truck.latitude,
    longitude: truck.longitude,
    isAvailable: truck.isAvailable,
    lastPositionAt: truck.lastPositionAt,
  });

  return truck;
}

async function remove(userId, truckId) {
  await assertOwned(userId, truckId);
  await prisma.truck.delete({ where: { id: truckId } });
  return { success: true };
}

async function listAvailable(filters = {}) {
  const {
    minVolumeM3,
    minCapacityKg,
    type,
    city,
    latitude,
    longitude,
    radiusKm = 50,
    freshWithinMinutes,
  } = filters;

  // Le coeur de la promesse du produit : une position figee ne vaut pas une
  // disponibilite. Sans cette fenetre, un camion apercu une fois il y a trois
  // semaines restait affiche comme disponible, a une position qu'il a quittee
  // depuis longtemps.
  const freshness = freshWithinMinutes ?? env.truckPositionTtlMinutes;
  const positionSince = new Date(Date.now() - freshness * 60_000);

  const where = {
    isAvailable: true,
    latitude: { not: null },
    longitude: { not: null },
    lastPositionAt: { gte: positionSince },
    transporter: { verificationStatus: 'VERIFIED' },
    ...(minVolumeM3 ? { volumeM3: { gte: minVolumeM3 } } : {}),
    ...(minCapacityKg ? { capacityKg: { gte: minCapacityKg } } : {}),
    ...(type ? { type } : {}),
    ...(city ? { transporter: { verificationStatus: 'VERIFIED', city: { contains: city, mode: 'insensitive' } } } : {}),
  };

  if (latitude !== undefined && longitude !== undefined) {
    const box = boundingBox(latitude, longitude, radiusKm);
    where.latitude = { gte: box.minLat, lte: box.maxLat };
    where.longitude = { gte: box.minLng, lte: box.maxLng };
  }

  const trucks = await prisma.truck.findMany({
    where,
    include: TRUCK_INCLUDE,
    take: 200,
    orderBy: { lastPositionAt: 'desc' },
  });

  if (latitude === undefined || longitude === undefined) return trucks;

  // The bounding box is a square; refine it to a real circle.
  return trucks
    .map((t) => ({ ...t, distanceKm: Number(distanceKm(latitude, longitude, t.latitude, t.longitude).toFixed(2)) }))
    .filter((t) => t.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

async function getById(truckId) {
  const truck = await prisma.truck.findUnique({
    where: { id: truckId },
    include: {
      ...TRUCK_INCLUDE,
      trips: {
        where: { status: { in: ['SCHEDULED', 'IN_PROGRESS'] } },
        orderBy: { departureAt: 'asc' },
        take: 5,
      },
    },
  });
  if (!truck) throw ApiError.notFound('Camion introuvable');
  return truck;
}

module.exports = { create, listMine, update, updatePosition, remove, listAvailable, getById };
