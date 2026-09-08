-- Assertions sur le verrou de consentement (spec § 6).
--
-- Le verrou est la seule chose qui empêche le studio de produire une campagne
-- pour un restaurant qui n'a rien signé. Vérifier que le SQL se parse ne dit
-- rien de son efficacité : ce fichier vérifie qu'il REFUSE.
--
-- À lancer avec `psql -v ON_ERROR_STOP=1` : sans ça psql sort en 0 même après
-- une erreur, et un test qui ne peut pas échouer ne teste rien.

begin;

insert into apps (key, name, connector)
values ('test-app', 'Application de test', 'test')
on conflict (key) do nothing;

insert into entities (app_id, kind, external_id, name, payload, marketing_ok)
select id, 'restaurant', 'sans-accord', 'Sans accord', '{}'::jsonb, false
from apps where key = 'test-app';

insert into entities (app_id, kind, external_id, name, payload, marketing_ok, marketing_scopes)
select id, 'restaurant', 'avec-accord', 'Avec accord', '{}'::jsonb, true, array['name', 'photos']
from apps where key = 'test-app';

insert into campaigns (app_id, slug, name, objective, template)
select id, 'test-verrou', 'Test du verrou', 'Vérifier que le verrou refuse', 'mida-square'
from apps where key = 'test-app';

-- 1. Une entité sans accord doit être REFUSÉE.
do $$
declare
  v_campaign uuid;
  v_entity   uuid;
begin
  select id into v_campaign from campaigns where slug = 'test-verrou';
  select id into v_entity   from entities  where external_id = 'sans-accord';

  begin
    insert into campaign_items (campaign_id, entity_id) values (v_campaign, v_entity);
    raise exception
      'ASSERTION ÉCHOUÉE : une pièce sans consentement a été acceptée.';
  exception
    when check_violation then
      raise notice 'ok — le verrou a refusé la pièce sans consentement';
  end;
end
$$;

-- 2. Une entité avec accord doit passer.
do $$
declare
  v_campaign uuid;
  v_entity   uuid;
begin
  select id into v_campaign from campaigns where slug = 'test-verrou';
  select id into v_entity   from entities  where external_id = 'avec-accord';

  insert into campaign_items (campaign_id, entity_id) values (v_campaign, v_entity);
  raise notice 'ok — le verrou a laissé passer la pièce consentie';
end
$$;

-- 3. Retirer l'accord après coup doit bloquer un NOUVEAU rattachement.
--    Le déclencheur porte sur campaign_items, pas sur entities : il protège le
--    moment où une pièce est créée, pas rétroactivement. C'est assumé, et cette
--    assertion fixe la limite pour qu'un futur lecteur ne la découvre pas seul.
do $$
declare
  v_campaign uuid;
  v_entity   uuid;
begin
  update entities set marketing_ok = false where external_id = 'avec-accord';

  insert into campaigns (app_id, slug, name, objective, template)
  select id, 'test-verrou-2', 'Second test', 'Vérifier le retrait', 'mida-square'
  from apps where key = 'test-app';

  select id into v_campaign from campaigns where slug = 'test-verrou-2';
  select id into v_entity   from entities  where external_id = 'avec-accord';

  begin
    insert into campaign_items (campaign_id, entity_id) values (v_campaign, v_entity);
    raise exception
      'ASSERTION ÉCHOUÉE : un accord retiré n''a pas bloqué un nouveau rattachement.';
  exception
    when check_violation then
      raise notice 'ok — un accord retiré bloque tout nouveau rattachement';
  end;
end
$$;

-- 4. Les deux seaux de 0004 doivent être privés.
do $$
declare
  v_public int;
begin
  select count(*) into v_public
  from storage.buckets
  where id in ('campaign-visuals', 'campaign-texts') and public;

  if v_public > 0 then
    raise exception
      'ASSERTION ÉCHOUÉE : % seau(x) de campagne sont publics.', v_public;
  end if;
  raise notice 'ok — les deux seaux de campagne sont privés';
end
$$;

-- Rien n'est gardé : le test ne doit pas laisser de données derrière lui.
rollback;
