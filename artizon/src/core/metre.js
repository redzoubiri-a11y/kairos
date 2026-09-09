/**
 * Metre : calcul des quantites.
 *
 * Chaque fonction renvoie, en plus de la quantite, le `detail` du calcul ligne
 * a ligne. Un metre doit etre verifiable par un tiers : un total sans son calcul
 * n'est pas un metre, c'est une affirmation.
 */

import { arrondi, auPas } from './arrondi.js';

const fmt = (valeur, decimales = 2) =>
  Number(valeur).toLocaleString('fr-FR', {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  });

/** Seuil usuel de deduction des ouvertures, en m2 (a declarer dans le devis). */
export const SEUIL_DEDUCTION_DEFAUT = 0.5;

/** Taux de pertes et chutes par nature de pose (cf. references/ratios-metre.md). */
export const PERTES = {
  carrelageDroit: 0.07,
  carrelageGrandFormat: 0.1,
  carrelageDiagonale: 0.14,
  faience: 0.09,
  parquetFlottant: 0.07,
  parquetBatonRompu: 0.15,
  plaquePlatre: 0.1,
  isolationRouleau: 0.08,
  isolationPanneau: 0.1,
  peinture: 0.04,
  chape: 0.04,
  beton: 0.04,
  cableElectrique: 0.12,
  tube: 0.1,
  charpente: 0.1,
  bardage: 0.1,
};

/** Foisonnement des deblais : volume transporte, pas une perte. */
export const FOISONNEMENT = { terreVegetale: 0.25, argile: 0.3, roche: 0.5 };

export function perimetre({ longueur, largeur }) {
  const valeur = arrondi((longueur + largeur) * 2, 3);
  return {
    quantite: valeur,
    unite: 'ml',
    detail: [`Périmètre = (${fmt(longueur)} + ${fmt(largeur)}) × 2 = ${fmt(valeur)} ml`],
  };
}

export function surfaceSol({ longueur, largeur }) {
  const valeur = arrondi(longueur * largeur, 3);
  return {
    quantite: valeur,
    unite: 'm2',
    detail: [`Surface au sol = ${fmt(longueur)} × ${fmt(largeur)} = ${fmt(valeur)} m²`],
  };
}

export function volume({ longueur, largeur, epaisseur }) {
  const valeur = arrondi(longueur * largeur * epaisseur, 4);
  return {
    quantite: valeur,
    unite: 'm3',
    detail: [
      `Volume = ${fmt(longueur)} × ${fmt(largeur)} × ${fmt(epaisseur, 3)} = ${fmt(valeur, 3)} m³`,
    ],
  };
}

/**
 * Surface developpee des murs, ouvertures deduites au-dela du seuil declare.
 * La convention de deduction est renvoyee pour etre reprise telle quelle
 * dans le devis : une convention tacite finit en litige de decompte.
 */
export function surfaceMurs({
  longueur,
  largeur,
  perimetre: perimetreFourni,
  hauteur,
  ouvertures = [],
  seuilDeduction = SEUIL_DEDUCTION_DEFAUT,
}) {
  const detail = [];
  let lineaire;

  if (perimetreFourni !== undefined) {
    lineaire = arrondi(perimetreFourni, 3);
    detail.push(`Linéaire de mur = ${fmt(lineaire)} ml (donné)`);
  } else if (longueur !== undefined && largeur !== undefined) {
    const p = perimetre({ longueur, largeur });
    lineaire = p.quantite;
    detail.push(...p.detail);
  } else {
    throw new TypeError('surfaceMurs : fournir soit `perimetre`, soit `longueur` et `largeur`');
  }

  const brute = arrondi(lineaire * hauteur, 3);
  detail.push(`Surface brute = ${fmt(lineaire)} × ${fmt(hauteur)} ht = ${fmt(brute)} m²`);

  let deductions = 0;
  const nonDeduites = [];

  for (const ouverture of ouvertures) {
    const { libelle = 'ouverture', largeur: l, hauteur: h, nombre = 1 } = ouverture;
    const surfaceUnitaire = arrondi(l * h, 3);
    const surfaceTotale = arrondi(surfaceUnitaire * nombre, 3);

    if (surfaceUnitaire > seuilDeduction) {
      deductions = arrondi(deductions + surfaceTotale, 3);
      detail.push(
        `Déduction ${libelle} ${fmt(l)} × ${fmt(h)}${nombre > 1 ? ` × ${nombre}` : ''} = −${fmt(surfaceTotale)} m²`,
      );
    } else {
      nonDeduites.push(libelle);
      detail.push(
        `${libelle} ${fmt(l)} × ${fmt(h)} = ${fmt(surfaceUnitaire)} m² non déduite (≤ seuil ${fmt(seuilDeduction)} m²)`,
      );
    }
  }

  const nette = arrondi(brute - deductions, 3);
  detail.push(`Surface nette = ${fmt(nette)} m²`);

  return {
    quantite: nette,
    unite: 'm2',
    brute,
    deductions,
    nonDeduites,
    convention: `Déduction des ouvertures de surface unitaire supérieure à ${fmt(seuilDeduction)} m²`,
    detail,
  };
}

/** Pertes et chutes : poste de metre, distinct de la marge. */
export function avecPertes(quantiteNette, taux, { libelle = 'Pertes et chutes' } = {}) {
  if (taux < 0 || taux >= 1) throw new RangeError(`Taux de pertes invalide : ${taux}`);
  const brute = arrondi(quantiteNette * (1 + taux), 3);
  return {
    quantite: brute,
    unite: null,
    nette: arrondi(quantiteNette, 3),
    taux,
    detail: [
      `${libelle} (+${fmt(taux * 100, 0)} %) : ${fmt(quantiteNette)} → ${fmt(brute)}`,
    ],
  };
}

/**
 * Cloison a ossature metallique et plaques de platre : quantitatif complet.
 * L'oubli des accessoires (vis, bande, enduit) fait 3 a 5 % du poste.
 */
export function cloisonBA13({
  longueur,
  hauteur,
  entraxe = 0.6,
  faces = 2,
  plaquesParFace = 1,
  perte = PERTES.plaquePlatre,
  surfacePlaque = 3.0,
}) {
  const surface = arrondi(longueur * hauteur, 3);
  const surfacePlaques = arrondi(surface * faces * plaquesParFace * (1 + perte), 3);
  const nombrePlaques = Math.ceil(surfacePlaques / surfacePlaque);
  const rails = arrondi(longueur * 2 * 1.1, 2);
  const nombreMontants = Math.ceil(longueur / entraxe) + 1;
  const montants = arrondi(nombreMontants * hauteur, 2);
  const vis = Math.ceil(surface * faces * plaquesParFace * 30);
  const bande = arrondi(surface * 2.4, 2);
  const enduit = arrondi(surface * 0.7, 2);

  return {
    quantite: surface,
    unite: 'm2',
    composants: {
      plaques: { nombre: nombrePlaques, surface: surfacePlaques, unite: 'm2' },
      rails: { quantite: rails, unite: 'ml' },
      montants: { quantite: montants, unite: 'ml', nombre: nombreMontants },
      vis: { nombre: vis, unite: 'U' },
      bandeAJoint: { quantite: bande, unite: 'ml' },
      enduitAJoint: { quantite: enduit, unite: 'kg' },
    },
    detail: [
      `Surface de cloison = ${fmt(longueur)} × ${fmt(hauteur)} = ${fmt(surface)} m²`,
      `Plaques = ${fmt(surface)} × ${faces} faces × ${plaquesParFace} ép. × (1 + ${fmt(perte * 100, 0)} %) = ${fmt(surfacePlaques)} m² → ${nombrePlaques} plaques de ${fmt(surfacePlaque)} m²`,
      `Rails = ${fmt(longueur)} × 2 + 10 % = ${fmt(rails)} ml`,
      `Montants = ${nombreMontants} × ${fmt(hauteur)} = ${fmt(montants)} ml (entraxe ${fmt(entraxe, 2)} m)`,
      `Visserie ≈ ${vis} vis · bande ${fmt(bande)} ml · enduit ${fmt(enduit)} kg`,
    ],
  };
}

/** Carrelage : carreaux, colle et joint. */
export function carrelage({
  surface,
  perte = PERTES.carrelageDroit,
  encollage = 'simple',
  consommationJoint = 0.7,
  conditionnementColle = 25,
}) {
  const carreaux = arrondi(surface * (1 + perte), 3);
  const consommationColle = encollage === 'double' ? 8 : 5;
  const colleKg = arrondi(surface * consommationColle, 1);
  const sacsColle = Math.ceil(colleKg / conditionnementColle);
  const jointKg = arrondi(surface * consommationJoint, 1);

  return {
    quantite: carreaux,
    unite: 'm2',
    composants: {
      carreaux: { quantite: carreaux, unite: 'm2' },
      colle: { quantite: colleKg, unite: 'kg', sacs: sacsColle },
      joint: { quantite: jointKg, unite: 'kg' },
    },
    detail: [
      `Carreaux = ${fmt(surface)} × (1 + ${fmt(perte * 100, 0)} %) = ${fmt(carreaux)} m²`,
      `Colle (encollage ${encollage}, ${consommationColle} kg/m²) = ${fmt(colleKg, 1)} kg → ${sacsColle} sacs de ${conditionnementColle} kg`,
      `Joint = ${fmt(jointKg, 1)} kg`,
    ],
  };
}

/** Peinture : volume de produit, couches comprises. */
export function peinture({ surface, couches = 2, rendement = 10, perte = PERTES.peinture }) {
  if (!(rendement > 0)) throw new RangeError(`Rendement invalide : ${rendement} m²/L/couche`);
  const litres = arrondi((surface * couches * (1 + perte)) / rendement, 2);
  return {
    quantite: litres,
    unite: 'L',
    surfaceTraitee: arrondi(surface * couches, 3),
    detail: [
      `Produit = ${fmt(surface)} m² × ${couches} couches × (1 + ${fmt(perte * 100, 0)} %) / ${fmt(rendement, 0)} m²/L = ${fmt(litres)} L`,
    ],
  };
}

/** Terrassement : volume en place et volume evacue apres foisonnement. */
export function terrassement({ volumeEnPlace, foisonnement = FOISONNEMENT.terreVegetale }) {
  const evacue = arrondi(volumeEnPlace * (1 + foisonnement), 3);
  return {
    quantite: arrondi(volumeEnPlace, 3),
    unite: 'm3',
    volumeEvacue: evacue,
    detail: [
      `Volume en place = ${fmt(volumeEnPlace, 3)} m³`,
      `Volume évacué = ${fmt(volumeEnPlace, 3)} × (1 + ${fmt(foisonnement * 100, 0)} % de foisonnement) = ${fmt(evacue, 3)} m³`,
    ],
  };
}

/** Quantite a commander, arrondie au conditionnement du fournisseur. */
export function commander(quantite, { pas = 1, unite = 'U' } = {}) {
  const commandee = auPas(quantite, pas);
  return {
    quantite: commandee,
    unite,
    detail: [`Commande = ${fmt(quantite)} arrondie au pas de ${fmt(pas)} → ${fmt(commandee)} ${unite}`],
  };
}
