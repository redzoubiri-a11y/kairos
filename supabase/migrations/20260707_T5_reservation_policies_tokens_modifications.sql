-- ============================================================
-- Migration T5 — Policies · Tokens · Modifications · Capacité
-- 2026-07-07
-- ============================================================
-- Tables créées :
--   reservation_policies      — règles par restaurant (1:1)
--   reservation_tokens        — token URL sans compte
--   reservation_modifications — log self-service (cancel/modify)
-- Colonnes ajoutées :
--   restaurants.total_seats / total_tables
--   clients.no_show_count (si la table existe déjà)
-- ============================================================

-- ============================================================
-- 1. reservation_policies
-- ============================================================

CREATE TABLE IF NOT EXISTS reservation_policies (
  restaurant_id      UUID        PRIMARY KEY REFERENCES restaurants(id) ON DELETE CASCADE,
  min_cancel_hours   INT         NOT NULL DEFAULT 2,
  min_modify_hours   INT         NOT NULL DEFAULT 2,
  max_modifications  INT         NOT NULL DEFAULT 2,
  max_party_increase INT         NOT NULL DEFAULT 4,
  allow_self_cancel  BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_reservation_policies_updated_at
  BEFORE UPDATE ON reservation_policies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 2. reservation_tokens
-- ============================================================

CREATE TABLE IF NOT EXISTS reservation_tokens (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID        NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  token          TEXT        NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(6), 'hex'),
  expires_at     TIMESTAMPTZ NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reservation_tokens_reservation ON reservation_tokens(reservation_id);
CREATE INDEX idx_reservation_tokens_token       ON reservation_tokens(token);

-- ============================================================
-- 3. reservation_modifications
-- ============================================================

CREATE TABLE IF NOT EXISTS reservation_modifications (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID        NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  action         TEXT        NOT NULL CHECK (action IN ('cancel', 'modify_time', 'modify_party')),
  old_value      JSONB,
  new_value      JSONB,
  source         TEXT        NOT NULL DEFAULT 'app' CHECK (source IN ('web', 'app', 'manager')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reservation_modifications_resa   ON reservation_modifications(reservation_id);
CREATE INDEX idx_reservation_modifications_action ON reservation_modifications(reservation_id, action);

-- ============================================================
-- 4. Colonnes capacité sur restaurants
-- ============================================================

ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS total_seats  INT,
  ADD COLUMN IF NOT EXISTS total_tables INT;

-- ============================================================
-- 5. no_show_count sur la table clients (si elle existe déjà)
--    Sinon elle sera créée en T6.
--    Note : la table users a déjà no_show_count dans le schéma initial.
-- ============================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'clients'
  ) THEN
    ALTER TABLE clients
      ADD COLUMN IF NOT EXISTS no_show_count INT NOT NULL DEFAULT 0;
  END IF;
END $$;

-- ============================================================
-- 6. ROW LEVEL SECURITY
-- ============================================================

-- ------------------------------------------------------------
-- reservation_policies
-- Lisibles par tous (conditions d'annulation = info publique).
-- Modifiables uniquement par le propriétaire du restaurant.
-- ------------------------------------------------------------

ALTER TABLE reservation_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY rp_select ON reservation_policies
  FOR SELECT USING (TRUE);

CREATE POLICY rp_owner_insert ON reservation_policies
  FOR INSERT WITH CHECK (
    restaurant_id IN (
      SELECT r.id FROM restaurants r
      JOIN restaurant_owners o ON o.restaurant_id = r.id
      WHERE o.auth_id = auth.uid()
    )
  );

CREATE POLICY rp_owner_update ON reservation_policies
  FOR UPDATE
  USING (
    restaurant_id IN (
      SELECT r.id FROM restaurants r
      JOIN restaurant_owners o ON o.restaurant_id = r.id
      WHERE o.auth_id = auth.uid()
    )
  );

CREATE POLICY rp_owner_delete ON reservation_policies
  FOR DELETE USING (
    restaurant_id IN (
      SELECT r.id FROM restaurants r
      JOIN restaurant_owners o ON o.restaurant_id = r.id
      WHERE o.auth_id = auth.uid()
    )
  );

-- ------------------------------------------------------------
-- reservation_tokens
-- Aucune politique client : accès service_role uniquement
-- (Edge Function génère et consomme les tokens).
-- ------------------------------------------------------------

ALTER TABLE reservation_tokens ENABLE ROW LEVEL SECURITY;

-- Aucune policy ajoutée → rejet par défaut pour anon + authenticated.
-- L'Edge Function utilise le client service_role qui bypasse RLS.

-- ------------------------------------------------------------
-- reservation_modifications
-- Inaccessible aux clients (rejet par défaut).
-- Le propriétaire peut lire les logs de son restaurant.
-- Écriture uniquement via Edge Function (service_role).
-- ------------------------------------------------------------

ALTER TABLE reservation_modifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY rm_owner_select ON reservation_modifications
  FOR SELECT USING (
    reservation_id IN (
      SELECT res.id FROM reservations res
      JOIN restaurants r    ON r.id = res.restaurant_id
      JOIN restaurant_owners o ON o.restaurant_id = r.id
      WHERE o.auth_id = auth.uid()
    )
  );
