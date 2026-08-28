-- Index unique sur restaurant_owners.auth_id.
--
-- Pourquoi : `auto-approve-pro` fait un upsert avec `onConflict: "auth_id"`,
-- mais aucune contrainte unique n'existait sur cette colonne. Postgres
-- repondait donc "there is no unique or exclusion constraint matching the ON
-- CONFLICT specification" sur CHAQUE ligne, a chaque execution horaire du
-- cron. Aucune inscription pro n'a jamais pu etre approuvee automatiquement.
--
-- Effet de bord utile : empeche qu'un meme compte auth se retrouve avec
-- plusieurs lignes restaurant_owners. `useDashboard.js` lit cette table avec
-- .eq('auth_id', ...).limit(1) sans ORDER BY — avec des doublons, il affichait
-- un restaurant arbitraire.
--
-- Les NULL restent autorises et non dedupliques (comportement Postgres par
-- defaut) : les 3 lignes historiques sans auth_id ne bloquent pas la creation.

create unique index if not exists restaurant_owners_auth_id_key
  on public.restaurant_owners (auth_id);
