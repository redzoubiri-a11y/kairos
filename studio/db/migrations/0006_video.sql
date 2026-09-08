-- Kairos Studio — 0006 : la vidéo entre dans le schéma.
--
-- Deux contraintes de la phase 1 refusaient explicitement autre chose que du
-- texte et de l'image. Elles étaient justes : mieux valait une contrainte
-- étroite qu'un `kind` libre où n'importe quelle faute de frappe passe. Le
-- prix à payer est cette migration, qui est le comportement voulu.
--
-- Ajouter plutôt que corriger 0002 et 0003 sur place : le projet Supabase
-- « studio » peut déjà exister quelque part, et une migration appliquée ne se
-- réécrit pas. Si ce n'est pas le cas, ce fichier ne coûte qu'un aller-retour.

alter table generations drop constraint generations_kind_check;
alter table generations
  add constraint generations_kind_check check (kind in ('text', 'video'));

alter table assets drop constraint assets_kind_check;
alter table assets
  add constraint assets_kind_check check (kind in ('image', 'text', 'video'));

comment on column generations.kind is
  'text : appel au modèle de langue. video : rendu Remotion, qui n''appelle aucun modèle mais mérite la même traçabilité (durée, format, temps de rendu).';
