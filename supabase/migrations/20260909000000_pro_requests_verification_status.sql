-- ============================================================
-- pro_requests.verification_status — déclaré dans le dépôt
-- 2026-09-09
-- ============================================================
-- La colonne existe en production : verify-restaurant l'écrit depuis sa mise
-- en service ('auto_approved', 'manual_review', 'auto_rejected'). Elle n'était
-- dans aucune migration — ajoutée depuis le dashboard — donc invisible d'un
-- environnement reconstruit depuis le dépôt.
--
-- auto-approve-pro filtre désormais dessus : il n'approuve plus que les
-- demandes rangées dans 'manual_review'. Une colonne dont dépend une décision
-- d'autorisation ne peut pas rester hors du dépôt : sur une base neuve, le
-- filtre échouerait au lieu de restreindre.
--
-- Idempotent : no-op sur la base de production, où la colonne est déjà là.
-- ============================================================

alter table public.pro_requests
  add column if not exists verification_status text;

-- La requête horaire de auto-approve-pro porte sur ces trois colonnes.
create index if not exists pro_requests_pending_verification_idx
  on public.pro_requests (status, verification_status, created_at);
