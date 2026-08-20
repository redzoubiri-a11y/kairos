-- Nouvelles valeurs d'enum pour restaurant_status (garde le typage fort existant,
-- plutot que de remplacer par text+CHECK -- decision utilisateur du 2026-08-20).
-- Le DEFAULT de la colonne reste 'pending' (inchange) : les flux d'insertion existants
-- (approve-pro, auto-approve-pro, verify-restaurant, onboarding manuel) fixent deja
-- explicitement le status, donc aucun impact. L'import (etape 3) fixera 'draft' explicitement.
--
-- Doit etre applique dans une migration/transaction separee de celle qui utilise
-- ces valeurs (contrainte Postgres : "unsafe use of new value of enum type" tant que
-- la valeur ajoutee n'a pas ete commit).
alter type restaurant_status add value if not exists 'draft';
alter type restaurant_status add value if not exists 'claimed';
