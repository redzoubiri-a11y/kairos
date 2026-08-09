const { z } = require('zod');

const ROLES = ['CLIENT', 'TRANSPORTER', 'ADMIN'];
const TRUCK_TYPES = ['FOURGON', 'PLATEAU', 'BENNE', 'FRIGO', 'CITERNE', 'PORTE_CHAR', 'SEMI_REMORQUE'];
const TRIP_STATUS = ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
const MISSION_STATUS = ['PENDING', 'ACCEPTED', 'REJECTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
const DOCUMENT_TYPES = ['RC', 'PATENTE', 'CARTE_GRISE', 'ID_CARD'];

const uuid = z.string().uuid('Identifiant invalide');
const lat = z.coerce.number().min(-90).max(90);
const lng = z.coerce.number().min(-180).max(180);

// z.coerce.boolean() turns the string "false" into true — accept both shapes explicitly.
const booleanish = z.union([z.boolean(), z.enum(['true', 'false']).transform((v) => v === 'true')]);

const pagination = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
};

const companySchema = z.object({
  companyName: z.string().min(2).max(120),
  city: z.string().min(2).max(80),
  address: z.string().max(200).optional(),
  rcNumber: z.string().max(60).optional(),
  nifNumber: z.string().max(60).optional(),
});

const auth = {
  signup: z
    .object({
      email: z.string().email('Email invalide'),
      password: z.string().min(8, 'Au moins 8 caracteres'),
      fullName: z.string().min(2).max(120),
      phone: z
        .string()
        .regex(/^[0-9+\s-]{8,20}$/, 'Numero de telephone invalide')
        .optional(),
      // ADMIN accounts are provisioned by the seed script, never by signup.
      role: z.enum(['CLIENT', 'TRANSPORTER']).default('CLIENT'),
      company: companySchema.optional(),
    })
    .strict(),

  login: z
    .object({
      email: z.string().email('Email invalide'),
      password: z.string().min(1, 'Mot de passe requis'),
    })
    .strict(),

  updateProfile: z
    .object({
      fullName: z.string().min(2).max(120).optional(),
      phone: z.string().regex(/^[0-9+\s-]{8,20}$/).optional(),
    })
    .strict(),

  changePassword: z
    .object({
      currentPassword: z.string().min(1),
      newPassword: z.string().min(8, 'Au moins 8 caracteres'),
    })
    .strict(),
};

const transporter = {
  create: companySchema.strict(),
  update: companySchema.partial().strict(),
  uploadDocs: z
    .object({
      // Sent as a repeated multipart field, aligned with the files array.
      types: z.union([z.enum(DOCUMENT_TYPES), z.array(z.enum(DOCUMENT_TYPES))]).transform((v) => (Array.isArray(v) ? v : [v])),
    })
    .strict(),
};

const truck = {
  create: z
    .object({
      plateNumber: z.string().min(4).max(20),
      brand: z.string().max(60).optional(),
      model: z.string().max(60).optional(),
      type: z.enum(TRUCK_TYPES),
      capacityKg: z.coerce.number().int().min(100).max(60000),
      volumeM3: z.coerce.number().min(1).max(200),
      photoUrl: z.string().url().optional(),
      latitude: lat.optional(),
      longitude: lng.optional(),
      isAvailable: booleanish.default(true),
    })
    .strict(),

  update: z
    .object({
      brand: z.string().max(60).optional(),
      model: z.string().max(60).optional(),
      type: z.enum(TRUCK_TYPES).optional(),
      capacityKg: z.coerce.number().int().min(100).max(60000).optional(),
      volumeM3: z.coerce.number().min(1).max(200).optional(),
      photoUrl: z.string().url().optional(),
      isAvailable: booleanish.optional(),
    })
    .strict(),

  position: z
    .object({
      latitude: lat,
      longitude: lng,
      isAvailable: booleanish.optional(),
    })
    .strict(),

  available: z
    .object({
      minVolumeM3: z.coerce.number().min(0).optional(),
      minCapacityKg: z.coerce.number().int().min(0).optional(),
      type: z.enum(TRUCK_TYPES).optional(),
      city: z.string().max(80).optional(),
      latitude: lat.optional(),
      longitude: lng.optional(),
      radiusKm: z.coerce.number().min(1).max(1000).default(50),
    })
    .strict(),
};

const trip = {
  create: z
    .object({
      truckId: uuid,
      originCity: z.string().min(2).max(80),
      originLat: lat,
      originLng: lng,
      destinationCity: z.string().min(2).max(80),
      destinationLat: lat,
      destinationLng: lng,
      departureAt: z.coerce.date(),
      arrivalAt: z.coerce.date().optional(),
      freeVolumeM3: z.coerce.number().min(0).max(200),
      freeWeightKg: z.coerce.number().int().min(0).max(60000),
      pricePerM3: z.coerce.number().min(0).optional(),
      goodsTypes: z.array(z.string().max(40)).max(10).default([]),
      notes: z.string().max(500).optional(),
    })
    .strict(),

  update: z
    .object({
      departureAt: z.coerce.date().optional(),
      arrivalAt: z.coerce.date().optional(),
      freeVolumeM3: z.coerce.number().min(0).max(200).optional(),
      freeWeightKg: z.coerce.number().int().min(0).max(60000).optional(),
      pricePerM3: z.coerce.number().min(0).optional(),
      goodsTypes: z.array(z.string().max(40)).max(10).optional(),
      notes: z.string().max(500).optional(),
      status: z.enum(TRIP_STATUS).optional(),
    })
    .strict(),

  list: z
    .object({
      status: z.enum(TRIP_STATUS).optional(),
      originCity: z.string().max(80).optional(),
      destinationCity: z.string().max(80).optional(),
      minFreeVolumeM3: z.coerce.number().min(0).optional(),
      minFreeWeightKg: z.coerce.number().int().min(0).optional(),
      goodsType: z.string().max(40).optional(),
      departureFrom: z.coerce.date().optional(),
      departureTo: z.coerce.date().optional(),
      latitude: lat.optional(),
      longitude: lng.optional(),
      radiusKm: z.coerce.number().min(1).max(2000).default(100),
      mine: booleanish.optional(),
      ...pagination,
    })
    .strict(),
};

const mission = {
  create: z
    .object({
      transporterId: uuid,
      truckId: uuid.optional(),
      tripId: uuid.optional(),
      goodsType: z.string().min(2).max(60),
      volumeM3: z.coerce.number().min(0.1).max(200),
      weightKg: z.coerce.number().int().min(1).max(60000),
      pickupCity: z.string().min(2).max(80),
      pickupLat: lat,
      pickupLng: lng,
      pickupAt: z.coerce.date(),
      dropoffCity: z.string().min(2).max(80),
      dropoffLat: lat,
      dropoffLng: lng,
      budgetDzd: z.coerce.number().min(0).optional(),
      description: z.string().max(1000).optional(),
    })
    .strict(),

  list: z
    .object({
      status: z.enum(MISSION_STATUS).optional(),
      role: z.enum(['client', 'transporter', 'all']).optional(),
      ...pagination,
    })
    .strict(),

  updateStatus: z
    .object({
      missionId: uuid,
      status: z.enum(MISSION_STATUS),
      reason: z.string().max(300).optional(),
    })
    .strict(),
};

const chat = {
  send: z
    .object({
      missionId: uuid,
      content: z.string().min(1, 'Message vide').max(2000),
    })
    .strict(),

  history: z
    .object({
      missionId: uuid,
      before: z.coerce.date().optional(),
      limit: z.coerce.number().int().min(1).max(100).default(50),
    })
    .strict(),
};

const admin = {
  listTransporters: z
    .object({
      status: z.enum(['PENDING', 'VERIFIED', 'REJECTED']).optional(),
      search: z.string().max(80).optional(),
      ...pagination,
    })
    .strict(),

  verifyTransporter: z
    .object({
      transporterId: uuid,
      status: z.enum(['VERIFIED', 'REJECTED', 'PENDING']),
      reason: z.string().max(300).optional(),
    })
    .strict(),

  listUsers: z
    .object({
      role: z.enum(ROLES).optional(),
      search: z.string().max(80).optional(),
      ...pagination,
    })
    .strict(),

  setUserActive: z.object({ isActive: booleanish }).strict(),
};

const device = {
  register: z
    .object({
      token: z.string().min(10).max(200),
      platform: z.enum(['IOS', 'ANDROID']),
      deviceName: z.string().max(80).optional(),
    })
    .strict(),

  unregister: z.object({ token: z.string().min(10).max(200) }).strict(),
};

const common = {
  idParam: z.object({ id: uuid }),
  missionIdParam: z.object({ missionId: uuid }),
  notificationQuery: z
    .object({
      unreadOnly: booleanish.optional(),
      // Curseur sur createdAt, comme l'historique de conversation : un decalage
      // par numero de page ferait reapparaitre une ligne des qu'une notification
      // arrive entre deux appels.
      before: z.coerce.date().optional(),
      take: z.coerce.number().int().min(1).max(100).default(50),
    })
    .strict(),
};

module.exports = {
  auth,
  device,
  transporter,
  truck,
  trip,
  mission,
  chat,
  admin,
  common,
  enums: { ROLES, TRUCK_TYPES, TRIP_STATUS, MISSION_STATUS, DOCUMENT_TYPES },
};
