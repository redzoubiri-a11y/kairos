-- Assertions sur les campagnes de démarchage (migration 0008).
--
-- 0008 ouvre une brèche volontaire dans le verrou de consentement : une
-- campagne de démarchage accepte une entité sans accord, parce qu'elle ne
-- publie rien — elle montre au restaurateur ce que Mida ferait pour lui.
--
-- Une brèche volontaire mérite plus d'assertions qu'une règle fermée : ce
-- fichier vérifie qu'elle s'ouvre là où il faut, et nulle part ailleurs.
--
-- À lancer avec `psql -v ON_ERROR_STOP=1` : sans ça psql sort en 0 même après
-- une erreur, et un test qui ne peut pas échouer ne teste rien.

begin;

insert into apps (key, name, connector)
values ('test-demarchage', 'Application de test démarchage', 'test')
on conflict (key) do nothing;

insert into entities (app_id, kind, external_id, name, payload, marketing_ok)
select id, 'restaurant', 'dem-sans-accord', 'Sans accord', '{}'::jsonb, false
from apps where key = 'test-demarchage';

insert into entities (app_id, kind, external_id, name, payload, marketing_ok, marketing_scopes)
select id, 'restaurant', 'dem-avec-accord', 'Avec accord', '{}'::jsonb, true, array['name', 'photos']
from apps where key = 'test-demarchage';

insert into campaigns (app_id, slug, name, objective, template, kind)
select id, 'test-demarchage', 'Démarchage', 'Montrer au restaurateur', 'mida-square', 'demarchage'
from apps where key = 'test-demarchage';

insert into campaigns (app_id, slug, name, objective, template)
select id, 'test-publication', 'Publication', 'Diffuser au public', 'mida-square'
from apps where key = 'test-demarchage';

-- 1. Le défaut ne change pas : une campagne créée sans `kind` publie.
do $$
begin
  if (select kind from campaigns where slug = 'test-publication') <> 'publication' then
    raise exception 'ASSERTION ÉCHOUÉE : le défaut de campaigns.kind n''est plus « publication ».';
  end if;
end $$;

-- 2. Le démarchage ACCEPTE une entité sans accord — c'est tout l'objet de 0008.
do $$
declare v_c uuid; v_e uuid;
begin
  select id into v_c from campaigns where slug = 'test-demarchage';
  select id into v_e from entities  where external_id = 'dem-sans-accord';
  insert into campaign_items (campaign_id, entity_id) values (v_c, v_e);
exception when others then
  raise exception
    'ASSERTION ÉCHOUÉE : une pièce de démarchage sans accord a été refusée (%).', sqlerrm;
end $$;

-- 3. La publication REFUSE toujours. La brèche ne doit rien avoir affaibli.
do $$
declare v_c uuid; v_e uuid;
begin
  select id into v_c from campaigns where slug = 'test-publication';
  select id into v_e from entities  where external_id = 'dem-sans-accord';
  begin
    insert into campaign_items (campaign_id, entity_id) values (v_c, v_e);
    raise exception
      'ASSERTION ÉCHOUÉE : une pièce de publication sans consentement a été acceptée.';
  exception when check_violation then
    null; -- refus attendu
  end;
end $$;

-- 4. On ne requalifie pas une campagne de démarchage en publication tant que
--    ses entités n'ont pas donné leur accord. Sans ce garde-fou, la règle se
--    contournerait en changeant une étiquette.
do $$
begin
  begin
    update campaigns set kind = 'publication' where slug = 'test-demarchage';
    raise exception
      'ASSERTION ÉCHOUÉE : une campagne de démarchage sans accord a été requalifiée en publication.';
  exception when check_violation then
    null; -- refus attendu
  end;
end $$;

-- 5. La bascule reste possible quand tout le monde a donné son accord — le
--    garde-fou protège le consentement, il n'interdit pas de publier.
do $$
declare v_c uuid; v_e uuid;
begin
  insert into campaigns (app_id, slug, name, objective, template, kind)
  select id, 'test-bascule-ok', 'Démarchage consenti', 'Bascule légitime', 'mida-square', 'demarchage'
  from apps where key = 'test-demarchage';

  select id into v_c from campaigns where slug = 'test-bascule-ok';
  select id into v_e from entities  where external_id = 'dem-avec-accord';
  insert into campaign_items (campaign_id, entity_id) values (v_c, v_e);

  update campaigns set kind = 'publication' where id = v_c;
exception when others then
  raise exception
    'ASSERTION ÉCHOUÉE : une bascule légitime vers la publication a été refusée (%).', sqlerrm;
end $$;

-- 6. Déplacer une pièce d'une campagne de démarchage vers une campagne de
--    publication doit être refusé : c'est l'autre chemin de contournement, et
--    il passe par campaign_items, pas par campaigns.
do $$
declare v_dem uuid; v_pub uuid; v_item uuid;
begin
  select id into v_dem from campaigns where slug = 'test-demarchage';
  select id into v_pub from campaigns where slug = 'test-publication';
  select id into v_item from campaign_items where campaign_id = v_dem limit 1;

  begin
    update campaign_items set campaign_id = v_pub where id = v_item;
    raise exception
      'ASSERTION ÉCHOUÉE : une pièce sans accord a été déplacée vers une campagne de publication.';
  exception when check_violation then
    null; -- refus attendu
  end;
end $$;

rollback;
