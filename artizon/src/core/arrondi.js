/**
 * Arrondis du chiffrage.
 *
 * Le calcul en virgule flottante fait perdre des centimes sur les totaux d'un
 * devis (0,1 + 0,2 ne vaut pas 0,3). Tout montant qui sort du moteur passe donc
 * par `euros`, et toute quantite commandee par `auPas`.
 */

/** Arrondi commercial, demi vers le haut en valeur absolue. */
export function arrondi(valeur, decimales = 2) {
  if (typeof valeur !== 'number' || !Number.isFinite(valeur)) {
    throw new TypeError(`Valeur non numérique à arrondir : ${valeur}`);
  }
  const facteur = 10 ** decimales;
  // toPrecision corrige la representation binaire avant l'arrondi :
  // 1.005 * 100 vaut 100.49999999999999 en flottant, et s'arrondirait a 1,00.
  const brut = Number((valeur * facteur).toPrecision(12));
  const entier = brut < 0 ? -Math.round(-brut) : Math.round(brut);
  return entier / facteur;
}

/** Montant en euros, au centime. */
export function euros(valeur) {
  return arrondi(valeur, 2);
}

/** Pourcentage lisible, en points (0,1234 -> 12,3). */
export function pourcent(taux, decimales = 1) {
  return arrondi(taux * 100, decimales);
}

/**
 * Quantite arrondie au pas d'achat, toujours vers le haut : on ne commande pas
 * 4,2 plaques de platre. Le pas depend du conditionnement (plaque, sac, m3).
 */
export function auPas(valeur, pas = 0.01) {
  if (!(pas > 0)) throw new RangeError(`Pas d'arrondi invalide : ${pas}`);
  const nombreDePas = Math.ceil(arrondi(valeur / pas, 6));
  return arrondi(nombreDePas * pas, 4);
}

/** Formatage francais d'un montant, pour l'affichage seulement. */
export function formaterEuros(valeur) {
  return `${euros(valeur).toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} €`;
}
