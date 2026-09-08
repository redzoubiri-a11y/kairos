-- ============================================================================
-- À EXÉCUTER SUR LE PROJET KAIROS. Exécuter APRÈS 0001_marketing_permissions.sql.
-- Lancer avec `psql -v ON_ERROR_STOP=1` : sans ça psql sort en 0 même en erreur.
-- ============================================================================
--
-- Accord de communication des restaurants partenaires fondateurs.
--
-- La liste ci-dessous est celle des fiches créées à la main avant l'import des
-- 93 fiches Google Places — les sept « survivantes » que la migration
-- 20260820000001_restaurant_catalog_bootstrap.sql nomme explicitement.
-- Elle a été confirmée par Redouane le 2026-09-08.
--
-- ⚠️ Sept, pas cinq. Le brief de la Phase 1 parlait de « cinq restaurants
-- fondateurs » ; le vivier réel en compte sept et rien ne désigne lesquels
-- écarter. Plutôt que d'en retenir cinq au hasard, le studio travaille sur
-- tous ceux qui ont un accord : le test de bout en bout compte les lignes
-- d'ici, il ne suppose plus un nombre.
--
-- ⚠️ Ce que ce fichier fait est un acte juridique, pas une donnée de
-- configuration : il autorise le studio à nommer ces restaurants et à
-- republier leurs photos. Ne l'exécuter que si l'accord existe réellement, et
-- renseigner `evidence` — un accord dont on ne peut pas montrer la trace ne
-- vaut rien le jour où il est contesté.

insert into public.marketing_permissions
  (restaurant_id, granted, scopes, granted_at, channel, evidence, granted_by)
select r.id,
       true,
       array['name', 'photos', 'promotions']::text[],
       now(),
       'contrat',
       'TODO_REDOUANE : lien vers le contrat partenaire fondateur signé',
       'TODO_REDOUANE : qui a recueilli l''accord'
from public.restaurants r
where r.slug in (
  'terraza-zianis',
  'la-fontaine-dor',
  'lassiette-royale',
  'grille-viking',
  'le-romarin',
  'sunflower',
  'rafif-al-sham'
)
on conflict (restaurant_id) do update
  set granted    = excluded.granted,
      scopes     = excluded.scopes,
      granted_at = excluded.granted_at,
      channel    = excluded.channel,
      revoked_at = null;

-- `reviews` n'est volontairement pas dans les portées : citer un avis client
-- engage le client autant que le restaurant. À ajouter au cas par cas.

-- ---------------------------------------------------------------------------
-- Vérification.
--
-- L'insert ci-dessus filtre sur des slugs : un slug qui n'existe pas n'insère
-- rien et ne dit rien. Six lignes au lieu de sept passeraient inaperçues
-- jusqu'au jour où une campagne oublierait un partenaire. On échoue ici.
--
-- Le second contrôle porte sur `status` : les vues de studio_read ne montrent
-- que les fiches actives, donc un fondateur qui ne le serait pas resterait
-- invisible au studio malgré son accord — un silence, pas une erreur.
-- ---------------------------------------------------------------------------
do $$
declare
  v_attendus text[] := array[
    'terraza-zianis', 'la-fontaine-dor', 'lassiette-royale', 'grille-viking',
    'le-romarin', 'sunflower', 'rafif-al-sham'
  ];
  v_absents  text[];
  v_inactifs text[];
begin
  select coalesce(array_agg(s), '{}')
    into v_absents
  from unnest(v_attendus) as s
  where not exists (select 1 from public.restaurants r where r.slug = s);

  if array_length(v_absents, 1) > 0 then
    raise exception
      'Slugs introuvables dans public.restaurants : %. Aucun accord n''a été posé pour eux.',
      array_to_string(v_absents, ', ');
  end if;

  select coalesce(array_agg(r.slug), '{}')
    into v_inactifs
  from public.restaurants r
  where r.slug = any(v_attendus) and r.status is distinct from 'active';

  if array_length(v_inactifs, 1) > 0 then
    raise exception
      'Fondateurs non actifs : %. Leur accord est enregistré mais studio_read ne les verra pas — passer leur status à ''active'' d''abord.',
      array_to_string(v_inactifs, ', ');
  end if;

  raise notice 'ok — % fondateurs, tous actifs, accord enregistré', array_length(v_attendus, 1);
end
$$;

-- Relevé final.
select r.name, r.slug, r.status, mp.granted, mp.scopes, mp.granted_at
from public.marketing_permissions mp
join public.restaurants r on r.id = mp.restaurant_id
where mp.granted and mp.revoked_at is null
order by r.name;
