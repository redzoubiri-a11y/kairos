/* eslint-disable no-console */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const CITIES = {
  Alger: { lat: 36.7538, lng: 3.0588 },
  Oran: { lat: 35.6971, lng: -0.6308 },
  Constantine: { lat: 36.365, lng: 6.6147 },
  Annaba: { lat: 36.9, lng: 7.7667 },
  Setif: { lat: 36.1898, lng: 5.4108 },
  Blida: { lat: 36.4703, lng: 2.8277 },
  Bejaia: { lat: 36.7509, lng: 5.0567 },
  Ouargla: { lat: 31.9497, lng: 5.3253 },
};

const DEFAULT_PASSWORD = 'Password123!';

function daysFromNow(days, hour = 8) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, 0, 0, 0);
  return d;
}

function jitter(value, spreadDeg = 0.05) {
  return value + (Math.random() - 0.5) * spreadDeg * 2;
}

async function main() {
  console.log('Seeding TruckSpot...');

  await prisma.chatMessage.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.mission.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.truck.deleteMany();
  await prisma.transporterDocument.deleteMany();
  await prisma.transporterProfile.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@truckspot.dz',
      passwordHash,
      fullName: 'Admin TruckSpot',
      phone: '+213770000000',
      role: 'ADMIN',
    },
  });

  const clients = await Promise.all(
    [
      { email: 'client@truckspot.dz', fullName: 'Karim Belkacem', phone: '+213661111111' },
      { email: 'sarah@truckspot.dz', fullName: 'Sarah Hamdi', phone: '+213661111112' },
    ].map((data) => prisma.user.create({ data: { ...data, passwordHash, role: 'CLIENT' } }))
  );

  const transporterSpecs = [
    {
      email: 'transporteur@truckspot.dz',
      fullName: 'Yacine Meddah',
      phone: '+213662222221',
      companyName: 'Meddah Transport',
      city: 'Alger',
      verificationStatus: 'VERIFIED',
      trucks: [
        { plateNumber: '16-12345-24', brand: 'Mercedes', model: 'Actros', type: 'SEMI_REMORQUE', capacityKg: 24000, volumeM3: 90 },
        { plateNumber: '16-12346-24', brand: 'Renault', model: 'Master', type: 'FOURGON', capacityKg: 1500, volumeM3: 13 },
      ],
    },
    {
      email: 'logitrans@truckspot.dz',
      fullName: 'Nabil Cherif',
      phone: '+213662222222',
      companyName: 'LogiTrans Oran',
      city: 'Oran',
      verificationStatus: 'VERIFIED',
      trucks: [
        { plateNumber: '31-54321-23', brand: 'Iveco', model: 'Eurocargo', type: 'PLATEAU', capacityKg: 12000, volumeM3: 45 },
        { plateNumber: '31-54322-23', brand: 'Volvo', model: 'FH', type: 'FRIGO', capacityKg: 20000, volumeM3: 70 },
      ],
    },
    {
      email: 'estfret@truckspot.dz',
      fullName: 'Amine Bouzid',
      phone: '+213662222223',
      companyName: 'Est Fret Constantine',
      city: 'Constantine',
      verificationStatus: 'PENDING',
      trucks: [
        { plateNumber: '25-11111-22', brand: 'MAN', model: 'TGX', type: 'BENNE', capacityKg: 18000, volumeM3: 40 },
      ],
    },
  ];

  const transporters = [];
  for (const spec of transporterSpecs) {
    const user = await prisma.user.create({
      data: {
        email: spec.email,
        passwordHash,
        fullName: spec.fullName,
        phone: spec.phone,
        role: 'TRANSPORTER',
        transporter: {
          create: {
            companyName: spec.companyName,
            city: spec.city,
            address: `Zone industrielle, ${spec.city}`,
            rcNumber: `RC-${Math.floor(100000 + Math.random() * 899999)}`,
            nifNumber: `NIF-${Math.floor(100000 + Math.random() * 899999)}`,
            verificationStatus: spec.verificationStatus,
            verifiedAt: spec.verificationStatus === 'VERIFIED' ? new Date() : null,
          },
        },
      },
      include: { transporter: true },
    });

    const base = CITIES[spec.city];
    const trucks = await Promise.all(
      spec.trucks.map((truck) =>
        prisma.truck.create({
          data: {
            ...truck,
            transporterId: user.transporter.id,
            latitude: jitter(base.lat),
            longitude: jitter(base.lng),
            lastPositionAt: new Date(),
            isAvailable: spec.verificationStatus === 'VERIFIED',
          },
        })
      )
    );

    transporters.push({ user, profile: user.transporter, trucks });
  }

  // Documents for the two verified transporters plus the pending one.
  for (const t of transporters) {
    await prisma.transporterDocument.createMany({
      data: ['RC', 'PATENTE', 'CARTE_GRISE'].map((type) => ({
        transporterId: t.profile.id,
        type,
        fileUrl: `https://placehold.co/800x1000/png?text=${type}`,
        originalName: `${type.toLowerCase()}.png`,
        mimeType: 'image/png',
        sizeBytes: 128000,
      })),
    });
  }

  const [meddah, logitrans] = transporters;

  const trips = await Promise.all([
    prisma.trip.create({
      data: {
        transporterId: meddah.profile.id,
        truckId: meddah.trucks[0].id,
        originCity: 'Alger',
        originLat: CITIES.Alger.lat,
        originLng: CITIES.Alger.lng,
        destinationCity: 'Oran',
        destinationLat: CITIES.Oran.lat,
        destinationLng: CITIES.Oran.lng,
        departureAt: daysFromNow(1, 6),
        arrivalAt: daysFromNow(1, 15),
        freeVolumeM3: 35,
        freeWeightKg: 9000,
        pricePerM3: 2500,
        goodsTypes: ['Palettes', 'Electromenager'],
        notes: 'Depart matinal, chargement possible a Blida.',
      },
    }),
    prisma.trip.create({
      data: {
        transporterId: meddah.profile.id,
        truckId: meddah.trucks[1].id,
        originCity: 'Alger',
        originLat: CITIES.Alger.lat,
        originLng: CITIES.Alger.lng,
        destinationCity: 'Bejaia',
        destinationLat: CITIES.Bejaia.lat,
        destinationLng: CITIES.Bejaia.lng,
        departureAt: daysFromNow(2, 7),
        freeVolumeM3: 8,
        freeWeightKg: 900,
        pricePerM3: 3200,
        goodsTypes: ['Colis', 'Materiel informatique'],
      },
    }),
    prisma.trip.create({
      data: {
        transporterId: logitrans.profile.id,
        truckId: logitrans.trucks[1].id,
        originCity: 'Oran',
        originLat: CITIES.Oran.lat,
        originLng: CITIES.Oran.lng,
        destinationCity: 'Constantine',
        destinationLat: CITIES.Constantine.lat,
        destinationLng: CITIES.Constantine.lng,
        departureAt: daysFromNow(3, 5),
        freeVolumeM3: 30,
        freeWeightKg: 8000,
        pricePerM3: 2800,
        goodsTypes: ['Produits frais'],
        notes: 'Camion frigorifique, -18C a +4C.',
      },
    }),
  ]);

  const mission = await prisma.mission.create({
    data: {
      clientId: clients[0].id,
      transporterId: meddah.profile.id,
      truckId: meddah.trucks[0].id,
      tripId: trips[0].id,
      goodsType: 'Electromenager',
      volumeM3: 12,
      weightKg: 2400,
      pickupCity: 'Alger',
      pickupLat: CITIES.Alger.lat,
      pickupLng: CITIES.Alger.lng,
      pickupAt: daysFromNow(1, 6),
      dropoffCity: 'Oran',
      dropoffLat: CITIES.Oran.lat,
      dropoffLng: CITIES.Oran.lng,
      budgetDzd: 45000,
      description: '20 cartons de refrigerateurs, manutention prevue sur place.',
      status: 'ACCEPTED',
      acceptedAt: new Date(),
    },
  });

  await prisma.mission.create({
    data: {
      clientId: clients[1].id,
      transporterId: logitrans.profile.id,
      truckId: logitrans.trucks[1].id,
      tripId: trips[2].id,
      goodsType: 'Produits frais',
      volumeM3: 6,
      weightKg: 1800,
      pickupCity: 'Oran',
      pickupLat: CITIES.Oran.lat,
      pickupLng: CITIES.Oran.lng,
      pickupAt: daysFromNow(3, 5),
      dropoffCity: 'Constantine',
      dropoffLat: CITIES.Constantine.lat,
      dropoffLng: CITIES.Constantine.lng,
      budgetDzd: 30000,
      description: 'Chaine du froid obligatoire.',
      status: 'PENDING',
    },
  });

  await prisma.chatMessage.createMany({
    data: [
      { missionId: mission.id, senderId: clients[0].id, content: 'Bonjour, le chargement est pret des 6h.' },
      { missionId: mission.id, senderId: meddah.user.id, content: 'Bonjour, parfait. Je serai sur place a 5h45.' },
      { missionId: mission.id, senderId: clients[0].id, content: 'Merci, je vous envoie l adresse exacte.' },
    ],
  });

  await prisma.notification.createMany({
    data: [
      {
        userId: clients[0].id,
        type: 'MISSION_ACCEPTED',
        title: 'Mission acceptee',
        body: 'Alger → Oran a ete acceptee par Meddah Transport',
        data: { missionId: mission.id },
      },
      {
        userId: logitrans.user.id,
        type: 'MISSION_CREATED',
        title: 'Nouvelle demande de mission',
        body: 'Sarah Hamdi — Oran → Constantine (6 m3)',
      },
    ],
  });

  console.log('Seed done.');
  console.log('---------------------------------------------');
  console.log(`Admin        : ${admin.email} / ${DEFAULT_PASSWORD}`);
  console.log(`Client       : ${clients[0].email} / ${DEFAULT_PASSWORD}`);
  console.log(`Transporteur : ${transporterSpecs[0].email} / ${DEFAULT_PASSWORD}`);
  console.log(`En attente   : ${transporterSpecs[2].email} / ${DEFAULT_PASSWORD}`);
  console.log('---------------------------------------------');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
