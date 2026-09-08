-- ============================================================================
-- À EXÉCUTER SUR LE PROJET KAIROS. Exécuter APRÈS 0001_marketing_permissions.sql.
-- ============================================================================
--
-- Accord de communication des cinq restaurants fondateurs.
--
-- ⚠️ Ce fichier ne contient PAS la liste : elle n'est pas dans le dépôt. Aucun
-- drapeau « fondateur » n'existe dans le schéma de Mida — `fondateurs.html`
-- décrit l'offre (20 places à Alger) mais ne nomme personne, et rien en base ne
-- distingue un partenaire fondateur d'une fiche importée. Les cinq slugs
-- ci-dessous sont donc des TROUS À REMPLIR, pas des valeurs par défaut.
--
-- Remplacer les cinq slugs, vérifier chaque ligne, puis exécuter. Ne cocher
-- `granted` que pour un accord réellement obtenu : c'est cette table, et elle
-- seule, qui autorise le studio à nommer un restaurant et à republier ses
-- photos.

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
  'TODO_REDOUANE_fondateur_1',
  'TODO_REDOUANE_fondateur_2',
  'TODO_REDOUANE_fondateur_3',
  'TODO_REDOUANE_fondateur_4',
  'TODO_REDOUANE_fondateur_5'
)
on conflict (restaurant_id) do update
  set granted    = excluded.granted,
      scopes     = excluded.scopes,
      granted_at = excluded.granted_at,
      channel    = excluded.channel,
      revoked_at = null;

-- `reviews` n'est volontairement pas dans les portées ci-dessus : citer un avis
-- client engage le client autant que le restaurant. À ajouter au cas par cas.

-- Contrôle : doit rendre cinq lignes.
select r.name, r.slug, mp.granted, mp.scopes
from public.marketing_permissions mp
join public.restaurants r on r.id = mp.restaurant_id
where mp.granted and mp.revoked_at is null
order by r.name;
