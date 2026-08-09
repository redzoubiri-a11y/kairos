const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');
const { distanceKm, boundingBox } = require('../utils/geo');
const transporterService = require('./transporter.service');

const TRIP_INCLUDE = {
  truck: { select: { id: true, plateNumber: true, type: true, volumeM3: true, capacityKg: true, photoUrl: true } },
  transporter: {
    select: {
      id: true,
      companyName: true,
      city: true,
      verificationStatus: true,
      user: { select: { id: true, fullName: true, phone: true } },
    },
  },
  _count: { select: { missions: true } },
};

async function create(userId, data) {
  const profile = await transporterService.getMine(userId);

  const truck = await prisma.truck.findUnique({ where: { id: data.truckId } });
  if (!truck) throw ApiError.notFound('Camion introuvable');
  if (truck.transporterId !== profile.id) throw ApiError.forbidden('Ce camion ne vous appartient pas');

  if (data.freeVolumeM3 > truck.volumeM3) {
    throw ApiError.badRequest('Le volume libre depasse le volume total du camion');
  }
  if (data.freeWeightKg > truck.capacityKg) {
    throw ApiError.badRequest('La charge libre depasse la capacite du camion');
  }
  if (data.arrivalAt && data.arrivalAt <= data.departureAt) {
    throw ApiError.badRequest("L'arrivee doit etre posterieure au depart");
  }

  const trip = await prisma.trip.create({
    data: { ...data, transporterId: profile.id },
    include: TRIP_INCLUDE,
  });

  // Declaring a trip puts the truck back on the map at its origin.
  await prisma.truck.update({
    where: { id: truck.id },
    data: {
      isAvailable: true,
      latitude: data.originLat,
      longitude: data.originLng,
      lastPositionAt: new Date(),
    },
  });

  return trip;
}

async function list(filters = {}, currentUser = null) {
  const {
    status,
    originCity,
    destinationCity,
    minFreeVolumeM3,
    minFreeWeightKg,
    goodsType,
    departureFrom,
    departureTo,
    latitude,
    longitude,
    radiusKm = 100,
    mine,
    adminView = false,
    page = 1,
    limit = 20,
  } = filters;

  const where = {
    ...(status ? { status } : { status: { in: ['SCHEDULED', 'IN_PROGRESS'] } }),
    ...(originCity ? { originCity: { contains: originCity, mode: 'insensitive' } } : {}),
    ...(destinationCity ? { destinationCity: { contains: destinationCity, mode: 'insensitive' } } : {}),
    ...(minFreeVolumeM3 ? { freeVolumeM3: { gte: minFreeVolumeM3 } } : {}),
    ...(minFreeWeightKg ? { freeWeightKg: { gte: minFreeWeightKg } } : {}),
    ...(goodsType ? { goodsTypes: { has: goodsType } } : {}),
    ...(departureFrom || departureTo
      ? {
          departureAt: {
            ...(departureFrom ? { gte: departureFrom } : {}),
            ...(departureTo ? { lte: departureTo } : {}),
          },
        }
      : {}),
  };

  if (adminView) {
    // Admins see every trip, including those of unverified transporters.
    if (!status) delete where.status;
  } else if (mine && currentUser) {
    const profile = await transporterService.getMine(currentUser.id);
    where.transporterId = profile.id;
    if (!status) delete where.status;
  } else {
    where.transporter = { verificationStatus: 'VERIFIED' };
  }

  if (latitude !== undefined && longitude !== undefined) {
    const box = boundingBox(latitude, longitude, radiusKm);
    where.originLat = { gte: box.minLat, lte: box.maxLat };
    where.originLng = { gte: box.minLng, lte: box.maxLng };
  }

  const [total, rows] = await prisma.$transaction([
    prisma.trip.count({ where }),
    prisma.trip.findMany({
      where,
      include: TRIP_INCLUDE,
      orderBy: { departureAt: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  const items =
    latitude === undefined || longitude === undefined
      ? rows
      : rows
          .map((t) => ({
            ...t,
            distanceKm: Number(distanceKm(latitude, longitude, t.originLat, t.originLng).toFixed(2)),
          }))
          .filter((t) => t.distanceKm <= radiusKm)
          .sort((a, b) => a.distanceKm - b.distanceKm);

  return { items, total, page, limit, pages: Math.ceil(total / limit) || 1 };
}

async function getById(tripId) {
  const trip = await prisma.trip.findUnique({ where: { id: tripId }, include: TRIP_INCLUDE });
  if (!trip) throw ApiError.notFound('Trajet introuvable');
  return trip;
}

async function assertOwned(userId, tripId) {
  const profile = await transporterService.getMine(userId);
  const trip = await prisma.trip.findUnique({ where: { id: tripId } });
  if (!trip) throw ApiError.notFound('Trajet introuvable');
  if (trip.transporterId !== profile.id) throw ApiError.forbidden("Ce trajet n'est pas le votre");
  return trip;
}

async function update(userId, tripId, data) {
  await assertOwned(userId, tripId);
  return prisma.trip.update({ where: { id: tripId }, data, include: TRIP_INCLUDE });
}

async function remove(userId, tripId) {
  await assertOwned(userId, tripId);
  await prisma.trip.update({ where: { id: tripId }, data: { status: 'CANCELLED' } });
  return { success: true };
}

module.exports = { create, list, getById, update, remove };
