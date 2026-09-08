-- Bouchon Supabase — POUR LES TESTS SEULEMENT, jamais appliqué en vrai.
--
-- La migration 0004 insère dans `storage.buckets`, que Supabase fournit et
-- qu'un PostgreSQL nu n'a pas. Sans ce bouchon, on ne pourrait pas rejouer les
-- migrations hors de Supabase — donc pas les vérifier en intégration continue.
--
-- Volontairement minimal : uniquement les colonnes que 0004 touche. Si un jour
-- une migration en utilise d'autres, elle échouera ici, ce qui est le
-- comportement voulu — mieux vaut un bouchon qui casse qu'un bouchon qui ment.

create schema if not exists storage;

create table if not exists storage.buckets (
  id      text primary key,
  name    text not null,
  public  boolean not null default false
);
