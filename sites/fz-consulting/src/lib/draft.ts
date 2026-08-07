/**
 * Mode brouillon.
 *
 * Le défaut est volontairement « brouillon » : un déploiement dont la
 * variable n'a pas été configurée reste non indexable et affiche le bandeau,
 * plutôt que de publier des contenus d'exemple par omission. Pour sortir du
 * mode brouillon, il faut le dire explicitement : NEXT_PUBLIC_DRAFT=0.
 */
export const DRAFT = process.env.NEXT_PUBLIC_DRAFT !== '0'
