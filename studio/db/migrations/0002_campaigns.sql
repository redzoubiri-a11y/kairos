-- Kairos Studio — 0002 : campagnes et pièces produites.

create table campaigns (
  id          uuid primary key default gen_random_uuid(),
  app_id      uuid not null references apps(id) on delete restrict,
  slug        text not null,
  name        text not null,
  objective   text not null,                 -- l'intention, en clair, reprise dans le prompt
  locale      text not null default 'fr' check (locale in ('fr', 'ar')),
  template    text not null,                 -- 'mida-square'
  params      jsonb not null default '{}',
  status      text not null default 'draft'
                check (status in ('draft', 'generating', 'ready', 'failed', 'archived')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (app_id, slug)
);

-- Une pièce = une entité dans une campagne. C'est l'unité de production :
-- un texte + un visuel, réussis ou échoués ensemble.
create table campaign_items (
  id           uuid primary key default gen_random_uuid(),
  campaign_id  uuid not null references campaigns(id) on delete cascade,
  entity_id    uuid not null references entities(id) on delete restrict,
  status       text not null default 'pending'
                 check (status in ('pending', 'generating', 'ready', 'failed')),
  error        text,
  created_at   timestamptz not null default now(),
  unique (campaign_id, entity_id)
);

create index campaign_items_campaign_idx on campaign_items (campaign_id);

-- Verrou de consentement.
--
-- La règle « on ne publie pas sans accord » ne tient pas si elle vit seulement
-- dans le code applicatif : un script de reprise, un import manuel ou un bug
-- la contournent. Elle est donc posée ici, sur le chemin d'écriture.
create or replace function assert_marketing_consent()
returns trigger
language plpgsql
as $$
declare
  v_ok boolean;
  v_name text;
begin
  select marketing_ok, name into v_ok, v_name
  from entities where id = new.entity_id;

  if not coalesce(v_ok, false) then
    raise exception
      'Consentement marketing absent pour l''entité % (%) : elle ne peut pas entrer dans une campagne.',
      coalesce(v_name, '?'), new.entity_id
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

create trigger trg_assert_marketing_consent
  before insert or update of entity_id on campaign_items
  for each row execute function assert_marketing_consent();

comment on function assert_marketing_consent() is
  'Refuse toute pièce de campagne portant sur une entité sans consentement marketing.';

-- Trace de chaque appel de modèle : ce qui est parti, ce qui est revenu.
-- Sans ça, un texte douteux n'est pas re-diagnosticable trois semaines plus tard.
create table generations (
  id                uuid primary key default gen_random_uuid(),
  campaign_item_id  uuid not null references campaign_items(id) on delete cascade,
  kind              text not null check (kind in ('text')),
  model             text not null,
  prompt_version    text not null,
  input             jsonb not null,
  output            jsonb,
  error             text,
  input_tokens      integer,
  output_tokens     integer,
  latency_ms        integer,
  created_at        timestamptz not null default now()
);

create index generations_item_idx on generations (campaign_item_id);
