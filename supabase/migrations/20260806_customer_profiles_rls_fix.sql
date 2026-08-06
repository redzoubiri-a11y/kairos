-- ============================================================
-- Fix sécurité — customer_profiles lisible par tout propriétaire
-- 2026-08-06
-- ============================================================
-- cp_owner_select vérifiait seulement "l'appelant possède un
-- restaurant quelconque", sans lier la ligne customer_profiles
-- lue à ce restaurant. N'importe quel restaurateur pouvait donc
-- lire le téléphone, le nom et l'historique de no-show de TOUS
-- les clients de TOUTE la plateforme.
--
-- Nouvelle règle : un propriétaire ne voit le profil d'un client
-- que si ce client a réservé au moins une fois dans l'un de ses
-- propres restaurants.
-- ============================================================

-- La policy est évaluée pour chaque ligne lue : la jointure passe par
-- users.phone, qui n'était indexé nulle part.
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

DROP POLICY IF EXISTS cp_owner_select ON customer_profiles;

CREATE POLICY cp_owner_select ON customer_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM restaurant_owners ro
      JOIN reservations r ON r.restaurant_id = ro.restaurant_id
      JOIN users u ON u.id = r.user_id
      -- (SELECT auth.uid()) plutôt que auth.uid() : Postgres l'évalue alors
      -- une seule fois (InitPlan) au lieu d'une fois par ligne candidate.
      WHERE ro.auth_id = (SELECT auth.uid())
        AND u.phone = customer_profiles.phone
    )
  );
