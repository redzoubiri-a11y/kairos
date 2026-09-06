-- AlterTable
ALTER TABLE "trucks" ADD COLUMN     "freeVolumeM3" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "trucks" ADD COLUMN     "freeWeightKg" INTEGER NOT NULL DEFAULT 0;

-- Un camion part avec toute sa capacite libre...
UPDATE "trucks" SET "freeVolumeM3" = "volumeM3", "freeWeightKg" = "capacityKg";

-- ...moins ce qu'une mission deja acceptee ou en cours, sans trajet declare,
-- avait deja engage sans jamais rien decompter avant ce correctif. Sans cette
-- reprise, une capacite deja prise rouvrirait au premier deploiement.
UPDATE "trucks" t
SET "freeVolumeM3" = t."freeVolumeM3" - committed.vol,
    "freeWeightKg" = t."freeWeightKg" - committed.wt
FROM (
  SELECT "truckId", SUM("volumeM3") AS vol, SUM("weightKg") AS wt
  FROM "missions"
  WHERE "tripId" IS NULL AND "truckId" IS NOT NULL AND "status" IN ('ACCEPTED', 'IN_PROGRESS')
  GROUP BY "truckId"
) committed
WHERE t.id = committed."truckId";
