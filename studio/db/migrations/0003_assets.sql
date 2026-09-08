-- Kairos Studio — 0003 : fichiers produits.
--
-- La table ne stocke pas les octets, seulement où ils sont dans le Storage du
-- projet studio. Le chemin est la clé : re-générer écrase le même chemin, donc
-- une campagne rejouée ne laisse pas de doublons derrière elle.

create table assets (
  id                uuid primary key default gen_random_uuid(),
  campaign_item_id  uuid not null references campaign_items(id) on delete cascade,
  kind              text not null check (kind in ('image', 'text')),
  bucket            text not null,
  path              text not null,
  mime              text not null,
  bytes             integer not null,
  width             integer,
  height            integer,
  checksum          text,                    -- sha256, pour repérer un rendu identique
  created_at        timestamptz not null default now(),
  unique (bucket, path)
);

create index assets_item_idx on assets (campaign_item_id);

comment on table assets is
  'Pièces produites, référencées par leur chemin Storage. Un chemin = une pièce, réécrite en place.';
