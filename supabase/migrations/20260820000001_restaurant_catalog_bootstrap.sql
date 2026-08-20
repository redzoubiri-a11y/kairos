-- Bootstrap du catalogue restaurants (draft + revendication publique)
-- Contexte : import de fiches "draft" (Google Places) avec lien de revendication par restaurant.
-- Doit etre applique APRES 20260820000000_restaurant_status_enum.sql (commit separe requis).

-- 1. Colonnes ajoutees a restaurants
alter table restaurants add column if not exists slug text;
alter table restaurants add column if not exists claim_token uuid default gen_random_uuid();
alter table restaurants add column if not exists source text default 'manual';
alter table restaurants add column if not exists google_place_id text;

alter table restaurants
  drop constraint if exists restaurants_source_check;
alter table restaurants
  add constraint restaurants_source_check check (source in ('manual', 'google_places', 'tripadvisor'));

create unique index if not exists restaurants_slug_key on restaurants (slug);
create unique index if not exists restaurants_claim_token_key on restaurants (claim_token);
create unique index if not exists restaurants_google_place_id_key on restaurants (google_place_id);

-- 2. Backfill slug + source + status='active' pour les 7 restaurants survivants
--    (noms connus, slugs poses explicitement plutot qu'une regex fragile sur accents/apostrophes)
update restaurants set slug = 'terraza-zianis',      source = 'manual', status = 'active' where id = '065b32c3-5cf9-4711-aa6f-274e9fcfcd20';
update restaurants set slug = 'la-fontaine-dor',     source = 'manual' where id = '6f624ce4-a73f-4ff4-9835-98507cacc81b';
update restaurants set slug = 'lassiette-royale',    source = 'manual' where id = '9a483bb9-fd3e-4766-a97a-43871ffc1924';
update restaurants set slug = 'grille-viking',       source = 'manual' where id = '3545c622-e140-4bfc-8b5e-6c9b98b31fdb';
update restaurants set slug = 'le-romarin',          source = 'manual' where id = '646168cc-0734-4942-ba91-97e7dfe299cf';
update restaurants set slug = 'sunflower',           source = 'manual' where id = '75b70aa8-ee75-42b6-b1c9-c4f57149ed66';
update restaurants set slug = 'rafif-al-sham',       source = 'manual' where id = 'de670d44-8f19-433c-8bc6-cd92fe59f918';

-- 3. Owner placeholder "non reclame" pour les fiches draft importees sans gerant reel
--    (owner_id est NOT NULL + FK RESTRICT vers restaurant_owners -- decision utilisateur du 2026-08-20).
--    auth_id NULL => ne matchera jamais auth.uid(), donc aucun acces "Pro voit/modifie son restaurant".
insert into restaurant_owners (id, email, phone, full_name, role, restaurant_id)
values (
  '00000000-0000-0000-0000-000000000099',
  'non-reclame@mida-food.com',
  '',
  'Non reclame',
  'owner',
  null
)
on conflict (id) do nothing;

-- 4. Bucket storage public restaurant-photos : deja existant, rien a faire.

-- 5. RLS : lecture des fiches draft/claimed uniquement via slug+claim_token exact,
--    jamais listables via le catalogue public (qui ne filtre que status = 'active',
--    policies existantes "restaurants_select" / "Lecture publique restaurants actifs" inchangees).
--    On n'ajoute PAS de policy "status in ('draft','claimed')" sur la table : une policy RLS
--    ne peut pas verifier que l'appelant connait le bon token, seulement autoriser/refuser une ligne
--    -- un select* sans filtre rendrait alors tous les drafts listables. La verification du token
--    se fait donc server-side dans une fonction SECURITY DEFINER dediee.
create or replace function public.get_restaurant_by_claim(p_slug text, p_token uuid)
returns setof restaurants
language sql
security definer
set search_path = public
stable
as $$
  select *
  from restaurants
  where slug = p_slug
    and claim_token = p_token
    and status in ('draft', 'claimed');
$$;

revoke all on function public.get_restaurant_by_claim(text, uuid) from public;
grant execute on function public.get_restaurant_by_claim(text, uuid) to anon, authenticated;
