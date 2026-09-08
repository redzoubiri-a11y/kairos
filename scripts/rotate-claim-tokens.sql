-- ============================================================================
-- Rotation des jetons de revendication exposés — À EXÉCUTER SUR KAIROS.
-- Lancer avec `psql -v ON_ERROR_STOP=1`, ou coller dans l'éditeur SQL Supabase.
-- ============================================================================
--
-- Pourquoi
-- --------
-- `scripts/send-prospection-alger-26-08.js` a été committé avec six `claim_token`
-- en clair, dans un dépôt public. Le fichier énonce pourtant la règle lui-même,
-- ligne 20 :
--
--     « Jamais de token en dur : ce repo est PUBLIC »
--
-- Elle avait été appliquée au jeton ULTRAMSG, pas aux jetons de revendication.
--
-- Ce que ça permet : `public.get_restaurant_by_claim(slug, token)` est en
-- SECURITY DEFINER et son EXECUTE est accordé à `anon`. Quiconque a lu le dépôt
-- possède le couple (slug, token) de six établissements et peut donc ouvrir leur
-- parcours de revendication. La fonction ne rend que les fiches en statut
-- 'draft' ou 'claimed' : une fiche déjà passée en 'active' n'est plus
-- revendicable, son jeton est sans effet. Le relevé ci-dessous dit lesquelles
-- étaient réellement exposées.
--
-- Pourquoi une rotation et pas une réécriture d'historique
-- --------------------------------------------------------
-- Le jeton est une donnée, pas un fichier. Le réécrire en base le rend caduc
-- partout où il traîne — dans l'historique git, dans les forks, dans les caches
-- de GitHub. Réécrire l'historique ne ferait ni l'un ni l'autre.
--
-- ⚠️ À N'EXÉCUTER QU'UNE FOIS
-- Chaque exécution invalide les liens de revendication déjà envoyés. Les six
-- restaurateurs ont reçu le leur par WhatsApp le 26/08 : après cette rotation,
-- ces liens ne fonctionnent plus. Le relevé final donne les nouveaux — les
-- renvoyer aux fiches encore non revendiquées.

begin;

-- Garde : les six fiches doivent exister. Une disparition silencieuse laisserait
-- un jeton exposé en circulation en croyant l'avoir tourné.
do $$
declare
  v_ids uuid[] := array[
    'ceb17018-2789-4692-b6fa-afe9440206cd',  -- Le Bardo
    '9c9c116a-5df8-45ff-9c58-cbf08d792eb8',  -- Le Ciel d'Alger
    'e72657cb-b82f-4066-ae01-094c94358f83',  -- Restaurant El Djenina
    '5109b09a-c080-44cc-9f50-e4cf7191ccf3',  -- Restaurant Signature
    '9965b694-e414-4d46-ba20-b4a2436928e1',  -- Restaurant Yulmaz
    '04ed2712-4c7b-4f89-886f-d2d74358165e'   -- Le Douar
  ]::uuid[];
  v_trouves int;
begin
  select count(*) into v_trouves
  from public.restaurants where id = any(v_ids);

  if v_trouves <> array_length(v_ids, 1) then
    raise exception
      'Attendu % fiches, % trouvée(s). Rotation annulée : vérifier les identifiants avant de recommencer.',
      array_length(v_ids, 1), v_trouves;
  end if;
end
$$;

-- État avant rotation, pour savoir lesquelles étaient réellement exposées.
select r.name,
       r.status,
       case when r.status in ('draft', 'claimed')
            then 'exposée — le jeton permettait la revendication'
            else 'sans effet — fiche déjà active' end as portee
from public.restaurants r
where r.id in (
  'ceb17018-2789-4692-b6fa-afe9440206cd', '9c9c116a-5df8-45ff-9c58-cbf08d792eb8',
  'e72657cb-b82f-4066-ae01-094c94358f83', '5109b09a-c080-44cc-9f50-e4cf7191ccf3',
  '9965b694-e414-4d46-ba20-b4a2436928e1', '04ed2712-4c7b-4f89-886f-d2d74358165e'
)
order by r.name;

update public.restaurants
set claim_token = gen_random_uuid()
where id in (
  'ceb17018-2789-4692-b6fa-afe9440206cd', '9c9c116a-5df8-45ff-9c58-cbf08d792eb8',
  'e72657cb-b82f-4066-ae01-094c94358f83', '5109b09a-c080-44cc-9f50-e4cf7191ccf3',
  '9965b694-e414-4d46-ba20-b4a2436928e1', '04ed2712-4c7b-4f89-886f-d2d74358165e'
);

commit;

-- Les nouveaux liens, à renvoyer aux fiches encore non revendiquées.
-- La route canonique est /revendiquer/ — celle qu'utilisent les scripts
-- d'import et que documente src/hooks/useRestaurant.js. La vague du 26/08
-- pointait sur /partenaire/, qui mène à la même revendication.
--
-- ⚠️ Le résultat de cette requête contient les nouveaux jetons : ne pas le
-- coller dans un ticket, un commit ou une conversation partagée.
select r.name,
       r.status,
       'https://web-resa.vercel.app/revendiquer/' || r.slug || '?t=' || r.claim_token as lien
from public.restaurants r
where r.id in (
  'ceb17018-2789-4692-b6fa-afe9440206cd', '9c9c116a-5df8-45ff-9c58-cbf08d792eb8',
  'e72657cb-b82f-4066-ae01-094c94358f83', '5109b09a-c080-44cc-9f50-e4cf7191ccf3',
  '9965b694-e414-4d46-ba20-b4a2436928e1', '04ed2712-4c7b-4f89-886f-d2d74358165e'
)
  and r.status in ('draft', 'claimed')
order by r.name;
