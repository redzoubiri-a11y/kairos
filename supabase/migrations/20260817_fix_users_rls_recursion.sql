-- Fix urgent : la policy users_select_by_restaurant_customers (migration du
-- 16/08) référence reservations/orders directement dans son EXISTS. Ces tables
-- ont elles-mêmes des policies RLS qui référencent `users` (ex:
-- reservations_user_select) → boucle infinie dès qu'on lit son propre profil
-- ("infinite recursion detected in policy for relation users", confirmé en
-- direct avec un vrai compte). Cassait réservation/commande/profil pour TOUS
-- les comptes, pas seulement les restaurateurs.
--
-- Fix : la vérification passe par une fonction SECURITY DEFINER, qui contourne
-- le RLS des tables qu'elle interroge en interne — plus de re-déclenchement
-- des policies de reservations/orders, donc plus de boucle.

CREATE OR REPLACE FUNCTION public.is_own_restaurant_customer(p_user_id uuid)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM restaurant_owners o
    WHERE o.auth_id = auth.uid()
    AND (
      EXISTS (SELECT 1 FROM reservations r WHERE r.restaurant_id = o.restaurant_id AND r.user_id = p_user_id)
      OR EXISTS (SELECT 1 FROM orders ord WHERE ord.restaurant_id = o.restaurant_id AND ord.user_id = p_user_id)
    )
  );
$$;
GRANT EXECUTE ON FUNCTION public.is_own_restaurant_customer(uuid) TO authenticated;

DROP POLICY IF EXISTS "users_select_by_restaurant_customers" ON public.users;
CREATE POLICY "users_select_by_restaurant_customers" ON public.users
FOR SELECT TO authenticated
USING (public.is_own_restaurant_customer(id));
