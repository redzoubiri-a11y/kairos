-- Le RPC get_restaurant_by_claim ne matchait que status in ('draft','claimed'),
-- alors que les 93 fiches du catalogue multi-villes sont en status='active'
-- (décision produit du 20-21/08 pour les rendre visibles côté client avant
-- revendication). Conséquence : /revendiquer/{slug}?t={token} renvoyait 404
-- pour toutes ces fiches, y compris celles déjà "envoyées" en WhatsApp.
-- Le token reste la seule barrière d'accès (slug+claim_token exact), on élargit
-- juste les statuts couverts pour matcher la réalité du catalogue.
create or replace function public.get_restaurant_by_claim(p_slug text, p_token uuid)
returns setof restaurants
language sql
stable security definer
set search_path to 'public'
as $$
  select *
  from restaurants
  where slug = p_slug
    and claim_token = p_token
    and status in ('draft', 'active', 'claimed');
$$;
