-- ============================================================================
-- À EXÉCUTER SUR LE PROJET KAIROS (la base de Mida), pas sur le projet studio.
-- Exécuter APRÈS 0001_marketing_permissions.sql.
-- ============================================================================
--
-- Kairos Studio — rôle de lecture `studio_reader`.
--
-- Ce que ce script installe, et pourquoi il ne se contente pas d'un GRANT SELECT
-- sur les tables demandées :
--
--   1. `restaurants` porte `claim_token`. Ce jeton suffit à revendiquer une
--      fiche : le donner à un moteur marketing, c'est le mettre dans les
--      journaux, les traces d'erreur et les instantanés du studio.
--   2. `reviews` porte `user_id` et le texte libre d'un client, et se joint à
--      `users`. Une campagne n'a besoin ni de savoir qui a écrit, ni de lire un
--      avis non modéré.
--   3. `restaurant_photos` n'existe pas dans cette base. Les photos sont un
--      tableau d'URL sur `restaurants.photos`, plus le seau Storage
--      `restaurant-photos`. La vue ci-dessous rend au studio la forme attendue
--      (une ligne par photo) sans inventer de table.
--
-- D'où un schéma `studio_read` de vues en colonnes explicites. Le rôle n'a
-- aucun droit sur `public` : ce qui n'est pas listé ici lui est invisible, et
-- une colonne ajoutée demain à `restaurants` ne lui parvient pas toute seule.

create schema if not exists studio_read;

comment on schema studio_read is
  'Surface de lecture de Kairos Studio. Vues seulement, colonnes explicites, aucune PII.';

-- ---------------------------------------------------------------------------
-- Villes
-- ---------------------------------------------------------------------------
create or replace view studio_read.cities as
select
  c.id,
  c.name,
  c.wilaya_code,
  c.slug,
  c.is_live,
  c.activated_at,
  c.seasonal,
  c.season_start_month,
  c.season_end_month
from public.cities c;

-- ---------------------------------------------------------------------------
-- Restaurants — fiches actives uniquement.
--
-- Les fiches `draft` et `claimed` sont des imports non revendiqués : elles ne
-- sont pas publiques dans l'app, elles n'ont rien à faire dans une campagne.
-- Exclus : claim_token, google_place_id, source, phone, coordonnées GPS,
-- dashboard_first_opened_at.
-- ---------------------------------------------------------------------------
create or replace view studio_read.restaurants as
select
  r.id,
  r.slug,
  r.name,
  r.description,
  r.cuisine_type,
  r.quartier,
  r.city,
  r.city_id,
  r.address,
  r.avg_rating,
  r.review_count,
  r.avg_ticket,
  r.capacity,
  r.terrasse,
  r.parking,
  r.click_collect_enabled,
  r.opening_hours,
  coalesce(array_length(r.photos, 1), 0) as photo_count,
  r.created_at
from public.restaurants r
where r.status = 'active';

-- ---------------------------------------------------------------------------
-- Photos — une ligne par URL, dans l'ordre du tableau source.
-- `position` = 1 pour la photo de couverture, celle que l'app affiche en tête.
-- ---------------------------------------------------------------------------
create or replace view studio_read.restaurant_photos as
select
  r.id                        as restaurant_id,
  p.ordinality::int           as position,
  p.url
from public.restaurants r
cross join lateral unnest(r.photos) with ordinality as p(url, ordinality)
where r.status = 'active'
  and p.url is not null
  and p.url <> '';

comment on view studio_read.restaurant_photos is
  'Déplie restaurants.photos. Il n''existe pas de table restaurant_photos dans cette base.';

-- ---------------------------------------------------------------------------
-- Avis — approuvés seulement, sans auteur.
--
-- `user_id` et la jointure vers `users` sont volontairement absents : le studio
-- cite un avis, il n'a pas à savoir de qui il vient.
-- ---------------------------------------------------------------------------
-- `pro_response` a été retiré le 2026-09-10 : la colonne n'existe pas dans
-- public.reviews sur Kairos (vérifié par information_schema), et elle n'était
-- lue nulle part — ni par le connecteur, ni par les types, ni par les tests.
create or replace view studio_read.reviews as
select
  rv.id,
  rv.restaurant_id,
  rv.rating,
  rv.comment,
  rv.created_at
from public.reviews rv
join public.restaurants r on r.id = rv.restaurant_id
where rv.moderation_status = 'approved'
  and r.status = 'active';

-- ---------------------------------------------------------------------------
-- Promotions — en cours ou à venir, non suspendues.
-- ---------------------------------------------------------------------------
create or replace view studio_read.promotions as
select
  p.id,
  p.restaurant_id,
  p.type,
  p.title,
  p.description,
  p.percent_value,
  p.fixed_value,
  p.time_start,
  p.time_end,
  p.start_date,
  p.end_date,
  p.created_at
from public.promotions p
join public.restaurants r on r.id = p.restaurant_id
where p.is_paused = false
  and r.status = 'active'
  and (p.end_date is null or p.end_date >= current_date);

-- ---------------------------------------------------------------------------
-- Consentement marketing — la porte d'entrée du studio.
--
-- `granted` est recalculé : un accord retiré est un accord qui ne vaut plus,
-- même si la colonne booléenne est restée à true. Le studio ne doit pas avoir à
-- se souvenir de cette règle.
-- ---------------------------------------------------------------------------
create or replace view studio_read.marketing_permissions as
select
  mp.restaurant_id,
  (mp.granted and mp.revoked_at is null) as granted,
  mp.scopes,
  mp.granted_at,
  mp.revoked_at,
  mp.channel
from public.marketing_permissions mp
join public.restaurants r on r.id = mp.restaurant_id
where r.status = 'active';

-- ---------------------------------------------------------------------------
-- Le rôle.
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'studio_reader') then
    -- Sans mot de passe : le rôle existe mais ne peut pas encore se connecter.
    -- Voir « Mot de passe » en fin de fichier.
    create role studio_reader with login;
  end if;
end
$$;

-- Rien sur public : ni USAGE de table, ni SELECT. Le rôle ne voit que les vues.
revoke all on schema public from studio_reader;
revoke all privileges on all tables in schema public from studio_reader;

grant usage on schema studio_read to studio_reader;
grant select on all tables in schema studio_read to studio_reader;

-- Une vue ajoutée demain à studio_read sera lisible sans repasser par ici ;
-- une table ajoutée à public ne le sera jamais.
alter default privileges in schema studio_read grant select on tables to studio_reader;

-- Deuxième verrou, indépendant des GRANT : toute transaction ouverte par ce rôle
-- est en lecture seule. Si un droit fuit un jour par héritage, l'écriture échoue
-- quand même.
alter role studio_reader set default_transaction_read_only = on;

-- Le studio interroge une base de production. Une requête qui part en vrille ne
-- doit pas tenir une connexion pendant dix minutes.
alter role studio_reader set statement_timeout = '15s';
alter role studio_reader set idle_in_transaction_session_timeout = '30s';

-- Le rôle n'a pas à résoudre quoi que ce soit dans public.
alter role studio_reader set search_path = studio_read;

-- Les vues appartiennent à leur créateur (postgres) et sont en SECURITY DEFINER
-- implicite — `security_invoker` reste à false, sinon studio_reader devrait
-- posséder des droits sur les tables sous-jacentes, ce qu'on lui refuse
-- justement. Ne pas passer ces vues en security_invoker.

-- ---------------------------------------------------------------------------
-- Mot de passe — À FAIRE À PART, jamais dans ce fichier.
--
-- Ce script est versionné : un mot de passe écrit ici serait dans l'historique
-- git pour toujours. Générer un secret et l'appliquer en une commande séparée,
-- puis le poser dans le .env du studio (MIDA_DB_URL) et nulle part ailleurs :
--
--   openssl rand -base64 32
--   alter role studio_reader with password '<le secret généré>';
--
-- Vérification, depuis un client connecté en studio_reader :
--   select count(*) from studio_read.restaurants;   -- doit répondre
--   select count(*) from public.restaurants;        -- doit refuser
--   create table t(i int);                          -- doit refuser
-- ---------------------------------------------------------------------------
