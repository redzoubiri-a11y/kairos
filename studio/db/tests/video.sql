-- Assertions sur l'ouverture à la vidéo (migrations 0006 et 0007).
--
-- 0006 a élargi deux contraintes, 0007 en a relâché deux autres. Un
-- relâchement est plus dangereux qu'un élargissement : il se vérifie par ce
-- qu'il continue de REFUSER, pas par ce qu'il laisse passer.
--
-- À lancer avec `psql -v ON_ERROR_STOP=1`.

begin;

insert into apps (key, name, connector) values ('test-video', 'Test vidéo', 'test');

insert into entities (app_id, kind, external_id, name, payload, marketing_ok)
select id, 'restaurant', 'video-e1', 'Entité de test', '{}'::jsonb, true
from apps where key = 'test-video';

insert into campaigns (app_id, slug, name, objective, template)
select id, 'test-video', 'Test vidéo', 'Vérifier 0006 et 0007', 'mida-story'
from apps where key = 'test-video';

insert into campaign_items (campaign_id, entity_id)
select c.id, e.id from campaigns c, entities e
where c.slug = 'test-video' and e.external_id = 'video-e1';

-- 1. Un rendu vidéo n'appelle aucun modèle : il doit passer sans.
do $$
declare v_item uuid;
begin
  select id into v_item from campaign_items limit 1;
  insert into generations (campaign_item_id, kind, input, output)
  values (v_item, 'video',
          '{"template": "mida-story"}'::jsonb,
          '{"duree_images": 180, "largeur": 1080, "hauteur": 1920}'::jsonb);
  raise notice 'ok — une génération vidéo sans modèle est acceptée';
end
$$;

-- 2. Un texte sans modèle reste REFUSÉ : c'est tout l'intérêt de 0007, dont le
--    relâchement est ciblé et non général.
do $$
declare v_item uuid;
begin
  select id into v_item from campaign_items limit 1;
  begin
    insert into generations (campaign_item_id, kind, input)
    values (v_item, 'text', '{}'::jsonb);
    raise exception
      'ASSERTION ÉCHOUÉE : une génération de texte sans modèle a été acceptée.';
  exception
    when check_violation then
      raise notice 'ok — une génération de texte sans modèle reste refusée';
  end;
end
$$;

-- 3. Une pièce vidéo doit pouvoir être déposée (0006 sur assets.kind).
do $$
declare v_item uuid;
begin
  select id into v_item from campaign_items limit 1;
  insert into assets (campaign_item_id, kind, bucket, path, mime, bytes, width, height)
  values (v_item, 'video', 'campaign-visuals', 'test-video/video-e1.mp4',
          'video/mp4', 400000, 1080, 1920);
  raise notice 'ok — une pièce vidéo est acceptée';
end
$$;

-- 4. Un type inconnu reste refusé : élargir n'est pas ouvrir.
do $$
declare v_item uuid;
begin
  select id into v_item from campaign_items limit 1;
  begin
    insert into assets (campaign_item_id, kind, bucket, path, mime, bytes)
    values (v_item, 'gif', 'campaign-visuals', 'test-video/x.gif', 'image/gif', 1);
    raise exception 'ASSERTION ÉCHOUÉE : un type de pièce inconnu a été accepté.';
  exception
    when check_violation then
      raise notice 'ok — un type de pièce inconnu reste refusé';
  end;
end
$$;

rollback;
