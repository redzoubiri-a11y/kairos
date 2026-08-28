-- Retire la policy "Public can insert restaurants".
--
-- Elle etait definie avec `with check (true)` pour le role public : n'importe
-- qui disposant de la cle anon — publique par nature, embarquee dans l'app —
-- pouvait inserer des lignes dans `restaurants`. Rien n'empechait d'en creer
-- en masse.
--
-- Aucun code legitime n'en depend : les seuls chemins qui inserent un
-- restaurant sont les Edge Functions verify-restaurant, approve-pro et
-- auto-approve-pro, plus les 9 scripts d'import. Tous utilisent la cle
-- service_role, qui contourne la RLS et n'a donc jamais eu besoin de cette
-- policy. Verifie par grep : aucune insertion cote client dans l'app mobile
-- ni dans web-resa.

drop policy if exists "Public can insert restaurants" on public.restaurants;
