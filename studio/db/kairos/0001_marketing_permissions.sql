-- ============================================================================
-- À EXÉCUTER SUR LE PROJET KAIROS (la base de Mida), pas sur le projet studio.
-- ============================================================================
--
-- Kairos Studio — table de consentement marketing.
--
-- Le studio produit des visuels et des textes qui nomment un restaurant et
-- réutilisent ses photos. Rien n'autorise ça par défaut : une fiche présente
-- dans le catalogue n'est pas un accord de communication, et 93 des fiches ont
-- été créées avant toute revendication par leur gérant.
--
-- Cette table est le seul endroit qui dit oui. Elle est volontairement pauvre :
-- un restaurant, un accord, sa portée, sa preuve, sa date de retrait.

create table if not exists public.marketing_permissions (
  id             uuid primary key default gen_random_uuid(),
  restaurant_id  uuid not null unique references public.restaurants(id) on delete cascade,

  granted        boolean not null default false,
  -- Ce que l'accord couvre. Un restaurant peut accepter qu'on cite son nom sans
  -- accepter qu'on republie ses photos.
  scopes         text[] not null default '{}',

  granted_at     timestamptz,
  -- Comment l'accord a été recueilli, et où en est la preuve. Un accord dont on
  -- ne peut pas montrer la trace ne vaut rien le jour où il est contesté.
  channel        text check (channel in ('contrat', 'whatsapp', 'email', 'verbal')),
  evidence       text,
  granted_by     text,

  -- Le retrait est un fait daté, pas une suppression de ligne : on doit pouvoir
  -- expliquer pourquoi une campagne de mars citait un restaurant parti en juin.
  revoked_at     timestamptz,

  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  constraint marketing_permissions_scopes_known check (
    scopes <@ array['name', 'photos', 'logo', 'promotions', 'reviews']::text[]
  ),
  -- Un accord coché sans date ni portée est un accord qu'on ne saura pas défendre.
  constraint marketing_permissions_granted_is_documented check (
    not granted or (granted_at is not null and array_length(scopes, 1) >= 1)
  )
);

comment on table public.marketing_permissions is
  'Accord de communication par restaurant. Lu par Kairos Studio, jamais écrit par lui.';
comment on column public.marketing_permissions.scopes is
  'Portée de l''accord : name, photos, logo, promotions, reviews.';

-- RLS active, aucune policy : ni anon ni authenticated n'y touchent. La table se
-- remplit depuis le back-office (service_role) ou à la main, et se lit par la
-- vue studio_read.marketing_permissions (script 0002).
alter table public.marketing_permissions enable row level security;

create or replace function public.touch_marketing_permissions()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_marketing_permissions_touch on public.marketing_permissions;
create trigger trg_marketing_permissions_touch
  before update on public.marketing_permissions
  for each row execute function public.touch_marketing_permissions();
