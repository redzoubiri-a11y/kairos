-- CreateEnum
CREATE TYPE "Role" AS ENUM ('CLIENT', 'TRANSPORTER', 'ADMIN');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('RC', 'PATENTE', 'CARTE_GRISE', 'ID_CARD');

-- CreateEnum
CREATE TYPE "TruckType" AS ENUM ('FOURGON', 'PLATEAU', 'BENNE', 'FRIGO', 'CITERNE', 'PORTE_CHAR', 'SEMI_REMORQUE');

-- CreateEnum
CREATE TYPE "TripStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MissionStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('MISSION_CREATED', 'MISSION_ACCEPTED', 'MISSION_REJECTED', 'MISSION_STATUS', 'CHAT_MESSAGE', 'ACCOUNT_VERIFIED', 'ACCOUNT_REJECTED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT,
    "role" "Role" NOT NULL DEFAULT 'CLIENT',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transporter_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "address" TEXT,
    "rcNumber" TEXT,
    "nifNumber" TEXT,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "rejectionReason" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transporter_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transporter_documents" (
    "id" TEXT NOT NULL,
    "transporterId" TEXT NOT NULL,
    "type" "DocumentType" NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transporter_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trucks" (
    "id" TEXT NOT NULL,
    "transporterId" TEXT NOT NULL,
    "plateNumber" TEXT NOT NULL,
    "brand" TEXT,
    "model" TEXT,
    "type" "TruckType" NOT NULL,
    "capacityKg" INTEGER NOT NULL,
    "volumeM3" DOUBLE PRECISION NOT NULL,
    "photoUrl" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "lastPositionAt" TIMESTAMP(3),
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trucks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trips" (
    "id" TEXT NOT NULL,
    "transporterId" TEXT NOT NULL,
    "truckId" TEXT NOT NULL,
    "originCity" TEXT NOT NULL,
    "originLat" DOUBLE PRECISION NOT NULL,
    "originLng" DOUBLE PRECISION NOT NULL,
    "destinationCity" TEXT NOT NULL,
    "destinationLat" DOUBLE PRECISION NOT NULL,
    "destinationLng" DOUBLE PRECISION NOT NULL,
    "departureAt" TIMESTAMP(3) NOT NULL,
    "arrivalAt" TIMESTAMP(3),
    "freeVolumeM3" DOUBLE PRECISION NOT NULL,
    "freeWeightKg" INTEGER NOT NULL,
    "pricePerM3" DOUBLE PRECISION,
    "goodsTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT,
    "status" "TripStatus" NOT NULL DEFAULT 'SCHEDULED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "missions" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "transporterId" TEXT NOT NULL,
    "truckId" TEXT,
    "tripId" TEXT,
    "goodsType" TEXT NOT NULL,
    "volumeM3" DOUBLE PRECISION NOT NULL,
    "weightKg" INTEGER NOT NULL,
    "pickupCity" TEXT NOT NULL,
    "pickupLat" DOUBLE PRECISION NOT NULL,
    "pickupLng" DOUBLE PRECISION NOT NULL,
    "pickupAt" TIMESTAMP(3) NOT NULL,
    "dropoffCity" TEXT NOT NULL,
    "dropoffLat" DOUBLE PRECISION NOT NULL,
    "dropoffLng" DOUBLE PRECISION NOT NULL,
    "budgetDzd" DOUBLE PRECISION,
    "description" TEXT,
    "status" "MissionStatus" NOT NULL DEFAULT 'PENDING',
    "statusReason" TEXT,
    "acceptedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "missions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "data" JSONB,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE UNIQUE INDEX "transporter_profiles_userId_key" ON "transporter_profiles"("userId");

-- CreateIndex
CREATE INDEX "transporter_profiles_verificationStatus_idx" ON "transporter_profiles"("verificationStatus");

-- CreateIndex
CREATE INDEX "transporter_documents_transporterId_type_idx" ON "transporter_documents"("transporterId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "trucks_plateNumber_key" ON "trucks"("plateNumber");

-- CreateIndex
CREATE INDEX "trucks_isAvailable_idx" ON "trucks"("isAvailable");

-- CreateIndex
CREATE INDEX "trucks_latitude_longitude_idx" ON "trucks"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "trips_status_departureAt_idx" ON "trips"("status", "departureAt");

-- CreateIndex
CREATE INDEX "trips_originCity_destinationCity_idx" ON "trips"("originCity", "destinationCity");

-- CreateIndex
CREATE INDEX "missions_clientId_status_idx" ON "missions"("clientId", "status");

-- CreateIndex
CREATE INDEX "missions_transporterId_status_idx" ON "missions"("transporterId", "status");

-- CreateIndex
CREATE INDEX "chat_messages_missionId_createdAt_idx" ON "chat_messages"("missionId", "createdAt");

-- CreateIndex
CREATE INDEX "notifications_userId_readAt_idx" ON "notifications"("userId", "readAt");

-- AddForeignKey
ALTER TABLE "transporter_profiles" ADD CONSTRAINT "transporter_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transporter_documents" ADD CONSTRAINT "transporter_documents_transporterId_fkey" FOREIGN KEY ("transporterId") REFERENCES "transporter_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trucks" ADD CONSTRAINT "trucks_transporterId_fkey" FOREIGN KEY ("transporterId") REFERENCES "transporter_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_transporterId_fkey" FOREIGN KEY ("transporterId") REFERENCES "transporter_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_truckId_fkey" FOREIGN KEY ("truckId") REFERENCES "trucks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "missions" ADD CONSTRAINT "missions_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "missions" ADD CONSTRAINT "missions_transporterId_fkey" FOREIGN KEY ("transporterId") REFERENCES "transporter_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "missions" ADD CONSTRAINT "missions_truckId_fkey" FOREIGN KEY ("truckId") REFERENCES "trucks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "missions" ADD CONSTRAINT "missions_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "missions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
