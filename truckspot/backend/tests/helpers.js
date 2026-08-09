require('dotenv').config();

// Must be set before `src/config/env` is first required: the suite issues far more
// signups than a real client ever would.
process.env.DISABLE_RATE_LIMIT = 'true';

// Garde-fou : aucune suite ne doit joindre l'API Expo publique. push.test.js
// reactive l'envoi apres avoir fait pointer EXPO_PUSH_URL sur un service local.
process.env.PUSH_ENABLED = process.env.PUSH_ENABLED ?? 'false';
process.env.NODE_ENV = process.env.NODE_ENV === 'production' ? 'production' : 'test';

const http = require('http');
const { io } = require('socket.io-client');

const env = require('../src/config/env');

if (env.isProduction) {
  throw new Error('Refus de lancer la suite de tests avec NODE_ENV=production');
}

const app = require('../src/app');
const prisma = require('../src/config/prisma');
const { initWebSocket } = require('../src/websocket');

let server;
let baseUrl;

async function startServer() {
  if (server) return baseUrl;
  server = http.createServer(app);
  initWebSocket(server);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
  return baseUrl;
}

async function stopServer() {
  if (server) await new Promise((resolve) => server.close(resolve));
  server = null;
  baseUrl = null;
  await prisma.$disconnect();
}

// Order matters: children before parents, foreign keys are enforced.
async function resetDb() {
  await prisma.chatMessage.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.mission.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.truck.deleteMany();
  await prisma.transporterDocument.deleteMany();
  await prisma.transporterProfile.deleteMany();
  await prisma.user.deleteMany();
}

async function api(method, path, { token, body } = {}) {
  const response = await fetch(`${baseUrl}/api${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const text = await response.text();
  return {
    status: response.status,
    body: text ? JSON.parse(text) : null,
  };
}

let counter = 0;
function uniqueEmail(prefix) {
  counter += 1;
  return `${prefix}-${process.pid}-${counter}@truckspot.test`;
}

async function createClient(overrides = {}) {
  const { body } = await api('POST', '/auth/signup', {
    body: {
      email: uniqueEmail('client'),
      password: 'Password123!',
      fullName: 'Client Test',
      role: 'CLIENT',
      ...overrides,
    },
  });
  return body;
}

async function createTransporter({ verified = true, ...overrides } = {}) {
  const { body } = await api('POST', '/auth/signup', {
    body: {
      email: uniqueEmail('transporteur'),
      password: 'Password123!',
      fullName: 'Transporteur Test',
      role: 'TRANSPORTER',
      company: { companyName: 'Test Transport', city: 'Alger' },
      ...overrides,
    },
  });

  if (verified) {
    await prisma.transporterProfile.update({
      where: { id: body.user.transporter.id },
      data: { verificationStatus: 'VERIFIED', verifiedAt: new Date() },
    });
  }

  return { ...body, profileId: body.user.transporter.id };
}

async function createAdmin() {
  const bcrypt = require('bcryptjs');
  const email = uniqueEmail('admin');
  await prisma.user.create({
    data: {
      email,
      passwordHash: await bcrypt.hash('Password123!', 10),
      fullName: 'Admin Test',
      role: 'ADMIN',
    },
  });
  const { body } = await api('POST', '/auth/login', {
    body: { email, password: 'Password123!' },
  });
  return body;
}

async function createTruck(token, overrides = {}) {
  counter += 1;
  const { body } = await api('POST', '/trucks/create', {
    token,
    body: {
      plateNumber: `16-${String(counter).padStart(5, '0')}-${String(process.pid).slice(-2)}`,
      type: 'FOURGON',
      capacityKg: 3500,
      volumeM3: 20,
      latitude: 36.7538,
      longitude: 3.0588,
      ...overrides,
    },
  });
  return body;
}

function tomorrowAt(hour = 8) {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
}

async function createTrip(token, truckId, overrides = {}) {
  const { body } = await api('POST', '/trips/create', {
    token,
    body: {
      truckId,
      originCity: 'Alger',
      originLat: 36.7538,
      originLng: 3.0588,
      destinationCity: 'Oran',
      destinationLat: 35.6971,
      destinationLng: -0.6308,
      departureAt: tomorrowAt(6),
      freeVolumeM3: 18,
      freeWeightKg: 3000,
      ...overrides,
    },
  });
  return body;
}

async function createMission(clientToken, { transporterId, truckId, tripId, ...overrides } = {}) {
  const { body } = await api('POST', '/missions/create', {
    token: clientToken,
    body: {
      transporterId,
      ...(truckId ? { truckId } : {}),
      ...(tripId ? { tripId } : {}),
      goodsType: 'Palettes',
      volumeM3: 5,
      weightKg: 800,
      pickupCity: 'Alger',
      pickupLat: 36.7538,
      pickupLng: 3.0588,
      pickupAt: tomorrowAt(6),
      dropoffCity: 'Oran',
      dropoffLat: 35.6971,
      dropoffLng: -0.6308,
      ...overrides,
    },
  });
  return body;
}

function connectSocket(token) {
  return new Promise((resolve, reject) => {
    const socket = io(baseUrl, { auth: { token }, transports: ['websocket'] });
    const timer = setTimeout(() => reject(new Error('connect timeout')), 5000);
    socket.on('connect', () => {
      clearTimeout(timer);
      resolve(socket);
    });
    socket.on('connect_error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

function emitWithAck(socket, event, payload) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${event} ack timeout`)), 5000);
    socket.emit(event, payload, (ack) => {
      clearTimeout(timer);
      resolve(ack);
    });
  });
}

function waitFor(socket, event, timeoutMs = 4000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${event} not received`)), timeoutMs);
    socket.once(event, (payload) => {
      clearTimeout(timer);
      resolve(payload);
    });
  });
}

module.exports = {
  startServer,
  stopServer,
  resetDb,
  api,
  prisma,
  createClient,
  createTransporter,
  createAdmin,
  createTruck,
  createTrip,
  createMission,
  connectSocket,
  emitWithAck,
  waitFor,
  tomorrowAt,
  uniqueEmail,
};
