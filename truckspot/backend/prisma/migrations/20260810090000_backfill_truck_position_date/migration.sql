-- Un camion enregistre avec des coordonnees mais sans horodatage n'avait pas
-- d'age de position. Il echapperait donc a la fenetre de fraicheur appliquee
-- par /trucks/available et disparaitrait de la carte. On date sa position
-- connue avec sa derniere modification.
UPDATE "trucks"
SET "lastPositionAt" = "updatedAt"
WHERE "lastPositionAt" IS NULL
  AND "latitude" IS NOT NULL
  AND "longitude" IS NOT NULL;
