/**
 * Traduit une erreur de chargement Supabase en type d'état affichable.
 *
 * Les hooks de liste destructuraient jusqu'ici `{ data }` en écartant
 * `{ error }` : une panne réseau produisait une liste vide, donc l'écran
 * affichait « Aucun résultat » au lieu de « Pas de connexion ». Rien ne
 * distinguait l'absence de données du fait de ne pas avoir pu les charger.
 *
 * On ne cherche pas à couvrir tous les cas d'erreur possibles — juste à
 * séparer ce que l'utilisateur peut corriger (sa connexion, en réessayant)
 * de ce qu'il ne peut pas.
 */
export function typeErreur(erreur) {
  if (!erreur) return null;

  const message = String(erreur.message ?? erreur).toLowerCase();

  // supabase-js remonte les coupures réseau comme des TypeError de fetch ;
  // le message varie selon la plateforme, d'où la liste.
  const reseau = ['network', 'fetch', 'timeout', 'connexion', 'offline', 'econnrefused'];
  if (reseau.some((mot) => message.includes(mot))) return 'network';

  return 'server';
}
