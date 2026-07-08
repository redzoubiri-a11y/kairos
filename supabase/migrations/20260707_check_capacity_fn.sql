-- ============================================================
-- check_capacity — RPC de vérification de capacité par créneau
-- 2026-07-07
--
-- Appelée par :
--   • reservation-manage (Edge Function T2) — modify_time + modify_party
--   • Flux de réservation initial (client app via supabase.rpc)
--
-- Paramètres :
--   p_restaurant_id   : UUID du restaurant
--   p_date            : date cible (DATE)
--   p_time_slot       : heure cible (TIME, ex. '12:30:00')
--   p_party_size      : couverts à placer (0 = juste lire l'état)
--   p_exclude_resa_id : réservation à exclure du décompte (modif en place)
--   p_window_hours    : durée d'occupation d'un créneau en heures (défaut 2)
--
-- Retourne JSON :
--   { available: bool, seats_left: int, occupied: int,
--     max_seats: int, unconfigured: bool }
-- ============================================================

CREATE OR REPLACE FUNCTION check_capacity(
  p_restaurant_id   UUID,
  p_date            DATE,
  p_time_slot       TIME,
  p_party_size      INT  DEFAULT 0,
  p_exclude_resa_id UUID DEFAULT NULL,
  p_window_hours    INT  DEFAULT 2
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_max_seats  INT;
  v_occupied   INT;
  v_seats_left INT;
BEGIN
  -- Capacité : total_seats (T5) en priorité, capacity (legacy) en fallback
  SELECT COALESCE(total_seats, capacity)
  INTO   v_max_seats
  FROM   restaurants
  WHERE  id     = p_restaurant_id
    AND  status = 'active';

  -- Capacité non configurée → on laisse passer, le caller ignore le résultat
  IF v_max_seats IS NULL OR v_max_seats = 0 THEN
    RETURN json_build_object(
      'available',    TRUE,
      'seats_left',   NULL,
      'occupied',     0,
      'max_seats',    NULL,
      'unconfigured', TRUE
    );
  END IF;

  -- Couverts engagés sur les créneaux qui se chevauchent avec p_time_slot.
  -- Deux créneaux S et T (durée p_window_hours) se chevauchent si |S − T| < p_window_hours.
  -- Borne stricte : un créneau débutant exactement à T + window ne chevauche pas.
  SELECT COALESCE(SUM(nb_adults + nb_children), 0)
  INTO   v_occupied
  FROM   reservations
  WHERE  restaurant_id = p_restaurant_id
    AND  date          = p_date
    AND  status        = 'confirmed'
    AND  (p_exclude_resa_id IS NULL OR id != p_exclude_resa_id)
    AND  time_slot >  (p_time_slot - (p_window_hours || ' hours')::INTERVAL)
    AND  time_slot <  (p_time_slot + (p_window_hours || ' hours')::INTERVAL);

  v_seats_left := v_max_seats - v_occupied;

  RETURN json_build_object(
    'available',    v_seats_left >= GREATEST(p_party_size, 0),
    'seats_left',   GREATEST(v_seats_left, 0),
    'occupied',     v_occupied,
    'max_seats',    v_max_seats,
    'unconfigured', FALSE
  );
END;
$$;

-- Accessible en lecture anonyme et authentifiée.
-- Retourne uniquement des agrégats — aucune donnée individuelle exposée.
GRANT EXECUTE ON FUNCTION check_capacity(UUID, DATE, TIME, INT, UUID, INT)
  TO anon, authenticated;
