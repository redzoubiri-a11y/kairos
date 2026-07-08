-- ============================================================
-- Migration T6 — customer_profiles (agrégation no-show par téléphone)
-- 2026-07-08
-- ============================================================
-- La table users possède déjà no_show_count + le trigger handle_no_show().
-- customer_profiles agrège par téléphone (cible : futurs clients sans compte,
-- ou plusieurs comptes pour un même numéro).
-- ============================================================

CREATE TABLE IF NOT EXISTS customer_profiles (
  phone              TEXT        PRIMARY KEY,
  name               TEXT,
  no_show_count      INT         NOT NULL DEFAULT 0,
  total_reservations INT         NOT NULL DEFAULT 0,
  last_seen_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Trigger 1 : no_show → incrémenter no_show_count ─────────────────────────

CREATE OR REPLACE FUNCTION sync_customer_no_show()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_phone TEXT;
  v_name  TEXT;
BEGIN
  IF NEW.status = 'no_show' AND OLD.status IS DISTINCT FROM 'no_show' THEN
    SELECT u.phone,
           trim(u.first_name || ' ' || u.last_name)
    INTO   v_phone, v_name
    FROM   users u
    WHERE  u.id = NEW.user_id;

    IF v_phone IS NOT NULL THEN
      INSERT INTO customer_profiles (phone, name, no_show_count, total_reservations, last_seen_at)
      VALUES (v_phone, v_name, 1, 1, NOW())
      ON CONFLICT (phone) DO UPDATE SET
        no_show_count = customer_profiles.no_show_count + 1,
        name          = EXCLUDED.name,
        last_seen_at  = NOW();
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_customer_no_show
AFTER UPDATE ON reservations
FOR EACH ROW EXECUTE FUNCTION sync_customer_no_show();

-- ── Trigger 2 : nouvelle réservation → incrémenter total_reservations ────────

CREATE OR REPLACE FUNCTION sync_customer_new_resa()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_phone TEXT;
  v_name  TEXT;
BEGIN
  IF NEW.status != 'cancelled' THEN
    SELECT u.phone,
           trim(u.first_name || ' ' || u.last_name)
    INTO   v_phone, v_name
    FROM   users u
    WHERE  u.id = NEW.user_id;

    IF v_phone IS NOT NULL THEN
      INSERT INTO customer_profiles (phone, name, no_show_count, total_reservations, last_seen_at)
      VALUES (v_phone, v_name, 0, 1, NOW())
      ON CONFLICT (phone) DO UPDATE SET
        total_reservations = customer_profiles.total_reservations + 1,
        name               = EXCLUDED.name,
        last_seen_at       = NOW();
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_customer_new_resa
AFTER INSERT ON reservations
FOR EACH ROW EXECUTE FUNCTION sync_customer_new_resa();

-- ── RLS : owners en lecture seule, écriture via triggers (SECURITY DEFINER) ──

ALTER TABLE customer_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY cp_owner_select ON customer_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM restaurant_owners
      WHERE restaurant_owners.auth_id = auth.uid()
    )
  );
