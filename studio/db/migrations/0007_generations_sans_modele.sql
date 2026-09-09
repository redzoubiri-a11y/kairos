-- Kairos Studio — 0007 : une génération n'appelle pas toujours un modèle.
--
-- 0006 a ouvert generations.kind à 'video', mais les deux colonnes qui suivent
-- sont restées obligatoires :
--
--   model          text not null
--   prompt_version text not null
--
-- Un rendu Remotion n'a ni l'un ni l'autre. Les remplir quand même — « model =
-- remotion@4.0.522 », « prompt_version = mida-story » — ferait tenir la
-- contrainte au prix d'une colonne qui ment : personne ne cherche un numéro de
-- version de prompt dans une vidéo qui n'a pas de prompt.
--
-- Elles deviennent donc facultatives, et une contrainte les redemande là où
-- elles ont un sens. Le relâchement est ciblé, pas général : une génération de
-- texte sans modèle reste impossible.

alter table generations alter column model drop not null;
alter table generations alter column prompt_version drop not null;

alter table generations
  add constraint generations_texte_tracable
  check (kind <> 'text' or (model is not null and prompt_version is not null));

comment on column generations.model is
  'Modèle appelé, pour kind = text. Nul pour un rendu, qui n''appelle aucun modèle — ce qu''il a coûté et produit est décrit dans input/output.';
