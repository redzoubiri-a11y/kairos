-- Sécurité : la table public.users était lisible intégralement par n'importe qui
-- (policies SELECT "true" pour public ET authenticated) — email/téléphone/nom de
-- tous les utilisateurs exposés sans authentification, vérifié en direct via curl
-- avec la clé anon. Verrouillage + RPC de remplacement pour les 2 besoins légitimes
-- de lecture croisée identifiés dans le code (nom d'auteur d'avis publié, résolution
-- auth_id -> id interne pour notifier un gérant après commande/réservation).

-- 1. Retrait des policies trop permissives
DROP POLICY IF EXISTS "users_select" ON public.users;
DROP POLICY IF EXISTS "Lecture authentifiée users" ON public.users;

-- 2. Un restaurateur peut lire les infos complètes (dont téléphone) des clients qui
--    ont une réservation ou une commande dans SON restaurant — besoin réel : le
--    Dashboard/Comptoir Pro affichent nom+téléphone pour gérer les no-show.
CREATE POLICY "users_select_by_restaurant_customers" ON public.users
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM restaurant_owners o
    WHERE o.auth_id = auth.uid()
    AND (
      EXISTS (SELECT 1 FROM reservations r WHERE r.restaurant_id = o.restaurant_id AND r.user_id = users.id)
      OR EXISTS (SELECT 1 FROM orders ord WHERE ord.restaurant_id = o.restaurant_id AND ord.user_id = users.id)
    )
  )
);

-- 3. RPC pour afficher le nom de l'auteur d'un avis publié (RestaurantScreen, tous
--    visiteurs y compris invités), sans jamais exposer email/téléphone.
CREATE OR REPLACE FUNCTION public.get_restaurant_reviews(p_restaurant_id uuid)
RETURNS TABLE(id uuid, rating int, comment text, created_at timestamptz, first_name text, last_name text)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT r.id, r.rating, r.comment, r.created_at, u.first_name, u.last_name
  FROM reviews r
  LEFT JOIN users u ON u.id = r.user_id
  WHERE r.restaurant_id = p_restaurant_id AND r.moderation_status = 'approved'
  ORDER BY r.created_at DESC
  LIMIT 20;
$$;
GRANT EXECUTE ON FUNCTION public.get_restaurant_reviews(uuid) TO anon, authenticated;

-- 4. RPC pour résoudre l'id interne d'un utilisateur depuis son auth_id, sans exposer
--    aucune donnée personnelle (utilisé pour notifier un gérant après commande/résa).
CREATE OR REPLACE FUNCTION public.get_user_id_by_auth(p_auth_id uuid)
RETURNS uuid
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM users WHERE auth_id = p_auth_id LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.get_user_id_by_auth(uuid) TO anon, authenticated;

-- 5. Table profiles : reliquat d'un ancien système de rôles, jamais lu par le code
--    actuel (le rôle manager/client vient de app_metadata.role), mais exposait
--    role+téléphone publiquement via une policy nommée "Service role bypass" en
--    réalité accordée au rôle public. Verrouillage complet.
DROP POLICY IF EXISTS "Service role bypass" ON public.profiles;
