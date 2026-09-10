-- Kairos Studio — 0008 : deux natures de campagne.
--
-- Jusqu'ici le studio ne connaissait qu'un usage — publier — et son déclencheur
-- refusait toute pièce portant sur une entité sans accord marketing. C'était
-- juste, et ça le reste.
--
-- Mais 81 des 89 fiches de Mida n'ont pas de propriétaire, et aucune ne donnera
-- son accord tant que personne ne lui aura montré ce que Mida ferait pour elle.
-- Montrer à un restaurateur le visuel de son propre restaurant, en privé, n'est
-- pas le publier : c'est lui parler de son établissement. Le refuser revenait à
-- interdire au studio l'usage qui peut débloquer tous les autres.
--
-- On sépare donc les deux actes. La garantie « rien ne se publie sans accord »
-- ne bouge pas d'un pouce ; on ouvre seulement le droit de montrer.

alter table campaigns
  add column if not exists kind text not null default 'publication'
    check (kind in ('publication', 'demarchage'));

comment on column campaigns.kind is
  'publication = diffusion publique, exige le consentement de chaque entité. '
  'demarchage = pièce montrée au restaurateur lui-même, consentement non requis.';

-- ---------------------------------------------------------------------------
-- Le déclencheur consulte désormais la nature de la campagne.
-- ---------------------------------------------------------------------------
create or replace function assert_marketing_consent()
returns trigger
language plpgsql
as $$
declare
  v_ok   boolean;
  v_name text;
  v_kind text;
begin
  select c.kind into v_kind
  from campaigns c
  where c.id = new.campaign_id;

  -- Une pièce de démarchage ne sort pas de la relation entre Mida et le
  -- restaurateur : elle n'a pas à réclamer un accord de publication.
  if v_kind = 'demarchage' then
    return new;
  end if;

  select marketing_ok, name into v_ok, v_name
  from entities where id = new.entity_id;

  if not coalesce(v_ok, false) then
    raise exception
      'Consentement marketing absent pour l''entité % (%) : elle ne peut pas entrer dans une campagne de publication.',
      coalesce(v_name, '?'), new.entity_id
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

-- new.campaign_id est lu par la fonction : le déclencheur doit donc se
-- redéclencher aussi quand cette colonne change, pas seulement entity_id.
drop trigger if exists trg_assert_marketing_consent on campaign_items;
create trigger trg_assert_marketing_consent
  before insert or update of entity_id, campaign_id on campaign_items
  for each row execute function assert_marketing_consent();

-- ---------------------------------------------------------------------------
-- Second garde-fou : la bascule.
--
-- Sans lui, la règle serait contournable en trois lignes — créer la campagne en
-- « demarchage », y faire entrer des entités sans accord, puis la repasser en
-- « publication ». Le premier déclencheur ne verrait rien : il ne s'exécute
-- qu'à l'écriture d'une pièce, pas à la modification de la campagne.
-- ---------------------------------------------------------------------------
create or replace function assert_bascule_publication()
returns trigger
language plpgsql
as $$
declare
  v_sans_accord int;
begin
  if old.kind = 'demarchage' and new.kind = 'publication' then
    select count(*) into v_sans_accord
    from campaign_items ci
    join entities e on e.id = ci.entity_id
    where ci.campaign_id = new.id
      and not coalesce(e.marketing_ok, false);

    if v_sans_accord > 0 then
      raise exception
        'Bascule refusée : % pièce(s) de cette campagne portent sur des entités sans consentement marketing.',
        v_sans_accord
        using errcode = 'check_violation';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_assert_bascule_publication on campaigns;
create trigger trg_assert_bascule_publication
  before update of kind on campaigns
  for each row execute function assert_bascule_publication();

comment on function assert_bascule_publication() is
  'Interdit de requalifier en publication une campagne de démarchage dont les entités n''ont pas donné leur accord.';
