-- ═══════════════════════════════════════════════════════════════════════════
-- Tasale — position des salles (§1.3, Annexe A)
--
-- La fiche affichait jusqu'ici une distance figée, sans rapport avec la
-- position de l'utilisateur. Ces deux colonnes permettent de la calculer.
-- ═══════════════════════════════════════════════════════════════════════════

alter table salles
    add column if not exists latitude  numeric(9,6),
    add column if not exists longitude numeric(9,6);

-- Bornes valides : une saisie hors plage vaut mieux refusée qu'affichée
alter table salles drop constraint if exists salles_coords_valides;
alter table salles add constraint salles_coords_valides check (
    (latitude is null and longitude is null)
    or (latitude between -90 and 90 and longitude between -180 and 180)
);

-- Recherche « autour de moi » : filtrer d'abord sur une boîte englobante
create index if not exists idx_salles_coords on salles (latitude, longitude)
    where latitude is not null;
