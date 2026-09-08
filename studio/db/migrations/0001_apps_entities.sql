-- Kairos Studio — 0001 : applications connectées et miroir de leurs entités.
--
-- Schéma de référence : KAIROS_STUDIO_SPEC.md § 6.
--
-- Le studio ne lit JAMAIS une base applicative au moment de produire : il en
-- prend un instantané ici, daté, et travaille dessus. Trois raisons :
--   1. une campagne doit être rejouable à l'identique, même si la fiche a bougé ;
--   2. la base source est en lecture seule et distante — on ne la sollicite pas
--      une fois par génération ;
--   3. le consentement marketing est figé avec la donnée qu'il autorise.

create table apps (
  id          uuid primary key default gen_random_uuid(),
  key         text not null unique,          -- 'mida', 'sourcily'…
  name        text not null,
  connector   text not null,                 -- identifiant du module connectors/
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

comment on table apps is
  'Applications du groupe branchées au studio. Une ligne = un connecteur.';

-- Instantané d'une entité distante (un restaurant Mida, demain un fournisseur
-- Sourcily). `payload` porte la forme normalisée rendue par le connecteur, pas
-- le schéma de la base source : le studio ne doit pas connaître ses colonnes.
create table entities (
  id                   uuid primary key default gen_random_uuid(),
  app_id               uuid not null references apps(id) on delete cascade,
  kind                 text not null,        -- 'restaurant'
  external_id          text not null,        -- l'id dans la base source
  slug                 text,
  name                 text not null,
  payload              jsonb not null,
  -- Consentement marketing, recopié de la base source au moment du fetch.
  -- Aucune ligne ne peut entrer dans une campagne sans lui (voir 0002).
  marketing_ok         boolean not null default false,
  marketing_scopes     text[] not null default '{}',
  marketing_checked_at timestamptz,
  fetched_at           timestamptz not null default now(),
  unique (app_id, kind, external_id)
);

create index entities_app_kind_idx on entities (app_id, kind);
create index entities_marketing_ok_idx on entities (app_id) where marketing_ok;

comment on column entities.marketing_ok is
  'Recopie de marketing_permissions côté app. Faux par défaut : le silence ne vaut pas accord.';
