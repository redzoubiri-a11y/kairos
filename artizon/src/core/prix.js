/**
 * Chaine de prix : debourse sec -> prix de vente HT.
 *
 * Regle centrale du module : les frais generaux, les aleas et la marge se
 * definissent en pourcentage du PRIX DE VENTE, pas du debourse. Le passage se
 * fait donc par une division, jamais par une multiplication. Multiplier calcule
 * ces taux sur une base plus petite et fait perdre plusieurs points de marge.
 */

import { euros, arrondi } from './arrondi.js';

/** Au-dela, la division explose : un taux cumule aussi haut est une erreur de saisie. */
export const TAUX_CUMULE_MAX = 0.9;

/** Bornes de plausibilite du coefficient de vente en second oeuvre (cf. SKILL §5). */
export const BORNES_COEFFICIENT = {
  bloquantBas: 1.35,
  normalBas: 1.45,
  normalHaut: 1.75,
  alerteHaut: 1.95,
};

/** Coefficients de contexte appliques au TEMPS de main-d'oeuvre (cf. SKILL §4bis). */
export const COEFFICIENTS_CONTEXTE = {
  neuf: 1.0,
  siteOccupe: 1.2,
  nuitOuWeekEnd: 1.35,
  petitesSurfaces: 1.3,
  sansAscenseur: 1.15,
  renovationSurExistant: 1.25,
  monumentHistorique: 1.3,
};

function verifierParametres(parametres) {
  const {
    fraisChantier = 0,
    fraisGeneraux = 0,
    aleas = 0,
    marge = 0,
  } = parametres ?? {};

  for (const [nom, valeur] of Object.entries({ fraisChantier, fraisGeneraux, aleas, marge })) {
    if (typeof valeur !== 'number' || !Number.isFinite(valeur) || valeur < 0) {
      throw new RangeError(`Parametre "${nom}" invalide : ${valeur} (attendu un taux positif, 0,12 pour 12 %)`);
    }
    if (valeur >= 1) {
      throw new RangeError(
        `Parametre "${nom}" = ${valeur} : les taux s'expriment en décimal (0,12 pour 12 %), pas en points`,
      );
    }
  }

  const cumule = fraisGeneraux + aleas + marge;
  if (cumule >= TAUX_CUMULE_MAX) {
    throw new RangeError(
      `Frais generaux + aleas + marge = ${arrondi(cumule * 100, 1)} % : au-dela de ${TAUX_CUMULE_MAX * 100} %, ` +
        `le prix de vente diverge. Vérifier les taux.`,
    );
  }

  return { fraisChantier, fraisGeneraux, aleas, marge, cumule };
}

/** Cout d'une fourniture reellement rendue sur le chantier. */
export function fournitureRendueChantier({
  prixCatalogue,
  remise = 0,
  transport = 0,
  manutention = 0,
}) {
  if (remise < 0 || remise >= 1) {
    throw new RangeError(`Remise invalide : ${remise} (attendu 0,12 pour 12 %)`);
  }
  return euros(prixCatalogue * (1 - remise) + transport + manutention);
}

/** Cout de main-d'oeuvre d'un ouvrage, contexte de chantier compris. */
export function coutMainOeuvre({ tempsUnitaire, coutHoraire, coefficientContexte = 1 }) {
  if (coefficientContexte < 1) {
    throw new RangeError(
      `Coefficient de contexte = ${coefficientContexte} : un contexte dégradé allonge le temps, il ne le réduit pas`,
    );
  }
  return euros(tempsUnitaire * coefficientContexte * coutHoraire);
}

/** Debourse sec : ce que l'ouvrage coute a realiser, hors structure et hors marge. */
export function debourseSec({ fournitures = 0, mainOeuvre = 0, materiel = 0 }) {
  return euros(fournitures + mainOeuvre + materiel);
}

/**
 * Coefficient de vente theorique, deduit des seuls parametres.
 * k = (1 + %FC) / (1 - (%FG + %aleas + %marge))
 */
export function coefficientVente(parametres) {
  const { fraisChantier, cumule } = verifierParametres(parametres);
  return arrondi((1 + fraisChantier) / (1 - cumule), 4);
}

/**
 * Passage du debourse sec au prix de vente HT, avec la decomposition complete
 * — c'est elle qu'on produit en justification d'offre anormalement basse.
 */
export function prixDeVente(debourse, parametres) {
  if (typeof debourse !== 'number' || !Number.isFinite(debourse) || debourse < 0) {
    throw new RangeError(`Déboursé sec invalide : ${debourse}`);
  }
  const { fraisChantier, fraisGeneraux, aleas, marge, cumule } = verifierParametres(parametres);

  const montantFraisChantier = euros(debourse * fraisChantier);
  const prixRevient = euros(debourse + montantFraisChantier);
  const prixVente = euros(prixRevient / (1 - cumule));

  return {
    debourseSec: euros(debourse),
    fraisChantier: montantFraisChantier,
    prixRevient,
    fraisGeneraux: euros(prixVente * fraisGeneraux),
    aleas: euros(prixVente * aleas),
    marge: euros(prixVente * marge),
    prixVente,
    coefficient: debourse > 0 ? arrondi(prixVente / debourse, 4) : null,
    tauxMarge: marge,
  };
}

/**
 * Prix plancher : frais generaux et aleas couverts, marge nulle. En dessous,
 * l'entreprise travaille a perte. C'est la limite que le negociateur doit connaitre.
 */
export function prixPlancher(debourse, parametres, { inclureAleas = true } = {}) {
  const { fraisChantier, fraisGeneraux, aleas } = verifierParametres(parametres);
  const prixRevient = debourse * (1 + fraisChantier);
  const cumule = fraisGeneraux + (inclureAleas ? aleas : 0);
  return {
    prixPlancher: euros(prixRevient / (1 - cumule)),
    aleasInclus: inclureAleas,
  };
}

/**
 * Lecture inverse : a un prix impose (budget client, prix concurrent), que
 * reste-t-il comme marge ? Repond a « le client veut 180 k€, on peut ? ».
 */
export function margeRestante({ prixCible, debourseSec: debourse, parametres }) {
  if (!(prixCible > 0)) throw new RangeError(`Prix cible invalide : ${prixCible}`);
  const { fraisChantier, fraisGeneraux, aleas } = verifierParametres(parametres);

  const prixRevient = debourse * (1 + fraisChantier);
  const marge = 1 - fraisGeneraux - aleas - prixRevient / prixCible;
  const { prixPlancher: plancher } = prixPlancher(debourse, parametres);

  return {
    marge: arrondi(marge, 4),
    margeEuros: euros(marge * prixCible),
    prixPlancher: plancher,
    sousPlancher: prixCible < plancher,
    aPerte: prixCible < prixRevient,
  };
}

/** Effet reel d'une remise commerciale : en points de marge, pas en pourcentage du prix. */
export function effetRemise({ prixVente, debourseSec: debourse, parametres, remise }) {
  if (remise < 0 || remise >= 1) throw new RangeError(`Remise invalide : ${remise}`);
  const prixRemise = euros(prixVente * (1 - remise));
  const avant = margeRestante({ prixCible: prixVente, debourseSec: debourse, parametres });
  const apres = margeRestante({ prixCible: prixRemise, debourseSec: debourse, parametres });

  return {
    prixInitial: euros(prixVente),
    prixRemise,
    margeAvant: avant.marge,
    margeApres: apres.marge,
    pointsPerdus: arrondi((avant.marge - apres.marge) * 100, 2),
    sousPlancher: apres.sousPlancher,
    aPerte: apres.aPerte,
  };
}

/** Lecture du coefficient de vente contre les bornes de plausibilite. */
export function lireCoefficient(k) {
  if (k === null || k === undefined) return { niveau: 'indetermine', message: 'Déboursé nul, coefficient non calculable' };
  if (k < BORNES_COEFFICIENT.bloquantBas) {
    return { niveau: 'bloquant', message: `k = ${arrondi(k, 3)} : frais généraux non couverts` };
  }
  if (k < BORNES_COEFFICIENT.normalBas) {
    return { niveau: 'alerte', message: `k = ${arrondi(k, 3)} : bas, à justifier (volume ou chantier stratégique)` };
  }
  if (k <= BORNES_COEFFICIENT.normalHaut) {
    return { niveau: 'normal', message: `k = ${arrondi(k, 3)} : dans la zone normale` };
  }
  if (k <= BORNES_COEFFICIENT.alerteHaut) {
    return { niveau: 'normal', message: `k = ${arrondi(k, 3)} : haut, justifié si site occupé ou technicité` };
  }
  return { niveau: 'alerte', message: `k = ${arrondi(k, 3)} : risque de perdre l'affaire, à justifier` };
}
