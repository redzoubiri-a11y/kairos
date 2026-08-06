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

DROP POLICY IF EXISTS cp_owner_select ON customer_profiles;

CREATE POLICY cp_owner_select ON customer_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM restaurant_owners ro
      JOIN reservations r ON r.restaurant_id = ro.restaurant_id
      JOIN users u ON u.id = r.user_id
      WHERE ro.auth_id = auth.uid()
        AND u.phone = customer_profiles.phone
    )
  );
