/**
 * Sous-detail de prix d'un ouvrage.
 *
 * Un ouvrage est decrit par ses composants unitaires (fournitures, main-d'oeuvre,
 * materiel affecte). Le moteur en deduit le debourse sec unitaire, puis le prix
 * de vente par la chaine de `prix.js`. Le sous-detail produit est exactement la
 * piece a fournir en justification d'offre anormalement basse.
 */

import { euros, arrondi } from './arrondi.js';
import { prixDeVente, coutMainOeuvre } from './prix.js';
import { uniteAffichee, typeComposantAffiche } from '../data/ratios.js';

/** Sources de prix, de la plus sure a la plus faible (cf. SKILL, regle absolue). */
export const SOURCES = {
  BPU: { rang: 5, libelle: 'Bordereau de prix unitaires du marché' },
  FOURNISSEUR: { rang: 4, libelle: 'Devis fournisseur ou sous-traitant' },
  BIBLIO: { rang: 3, libelle: 'Bibliothèque de prix Artizon' },
  HISTORIQUE: { rang: 3, libelle: 'Chantier Artizon comparable' },
  ESTIME: { rang: 1, libelle: 'Estimation à dire d\'expert, à valider' },
};

const TYPES_COMPOSANT = new Set(['fourniture', 'mainOeuvre', 'materiel']);

function verifierComposant(composant, codeOuvrage) {
  const { type, libelle, quantite, prixUnitaire, source } = composant;
  if (!TYPES_COMPOSANT.has(type)) {
    throw new TypeError(
      `Ouvrage ${codeOuvrage} : type de composant inconnu "${type}" (attendu fourniture, mainOeuvre ou materiel)`,
    );
  }
  if (!(typeof quantite === 'number' && Number.isFinite(quantite) && quantite >= 0)) {
    throw new RangeError(`Ouvrage ${codeOuvrage} / ${libelle} : quantite invalide (${quantite})`);
  }
  if (!(typeof prixUnitaire === 'number' && Number.isFinite(prixUnitaire) && prixUnitaire >= 0)) {
    throw new RangeError(`Ouvrage ${codeOuvrage} / ${libelle} : prix unitaire invalide (${prixUnitaire})`);
  }
  if (!source || !SOURCES[source]) {
    throw new TypeError(
      `Ouvrage ${codeOuvrage} / ${libelle} : source de prix manquante ou inconnue (${source}). ` +
        `Aucun prix sans source : ${Object.keys(SOURCES).join(', ')}.`,
    );
  }
}

/** Fiabilite d'un ouvrage : celle de son composant le plus faible. */
export function fiabilite(composants) {
  return composants.reduce(
    (pire, c) => (SOURCES[c.source].rang < SOURCES[pire].rang ? c.source : pire),
    'BPU',
  );
}

/**
 * Chiffre un ouvrage pour une quantite donnee.
 *
 * @param {object} ouvrage        { code, libelle, unite, composants[] }
 * @param {number} quantite       quantite issue du metre
 * @param {object} parametres     { fraisChantier, fraisGeneraux, aleas, marge }
 * @param {object} [options]      { coefficientContexte, tva, prixUnitaireImpose }
 */
export function chiffrerOuvrage(ouvrage, quantite, parametres, options = {}) {
  const { code, libelle, unite, composants = [] } = ouvrage;
  const { coefficientContexte = 1, tva, prixUnitaireImpose } = options;

  if (composants.length === 0) {
    throw new TypeError(`Ouvrage ${code} : aucun composant, le déboursé ne peut pas être établi`);
  }
  for (const composant of composants) verifierComposant(composant, code);

  const lignes = composants.map((composant) => {
    const montant =
      composant.type === 'mainOeuvre'
        ? coutMainOeuvre({
            tempsUnitaire: composant.quantite,
            coutHoraire: composant.prixUnitaire,
            coefficientContexte,
          })
        : euros(composant.quantite * composant.prixUnitaire);

    return {
      ...composant,
      quantiteAppliquee:
        composant.type === 'mainOeuvre'
          ? arrondi(composant.quantite * coefficientContexte, 4)
          : composant.quantite,
      montant,
    };
  });

  const parType = (type) =>
    euros(lignes.filter((l) => l.type === type).reduce((somme, l) => somme + l.montant, 0));

  const debourse = {
    fournitures: parType('fourniture'),
    mainOeuvre: parType('mainOeuvre'),
    materiel: parType('materiel'),
  };
  debourse.total = euros(debourse.fournitures + debourse.mainOeuvre + debourse.materiel);

  const chaine = prixDeVente(debourse.total, parametres);
  const prixUnitaire = prixUnitaireImpose ?? chaine.prixVente;

  return {
    code,
    libelle,
    unite,
    quantite: arrondi(quantite, 3),
    coefficientContexte,
    lignes,
    debourseUnitaire: debourse,
    debourseTotal: euros(debourse.total * quantite),
    chaine,
    prixUnitaire: euros(prixUnitaire),
    total: euros(prixUnitaire * quantite),
    coefficient: debourse.total > 0 ? arrondi(prixUnitaire / debourse.total, 4) : null,
    prixImpose: prixUnitaireImpose !== undefined,
    source: fiabilite(composants),
    tva,
    repartition: {
      mainOeuvre: debourse.total > 0 ? arrondi(debourse.mainOeuvre / debourse.total, 4) : 0,
      fournitures: debourse.total > 0 ? arrondi(debourse.fournitures / debourse.total, 4) : 0,
      materiel: debourse.total > 0 ? arrondi(debourse.materiel / debourse.total, 4) : 0,
    },
  };
}

/** Sous-detail imprimable d'un ouvrage chiffre. */
export function sousDetail(poste) {
  const fmt = (v, d = 2) =>
    Number(v).toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d });

  const colonne = (texte, taille) =>
    texte.length <= taille ? texte.padEnd(taille) : `${texte.slice(0, taille - 1)}…`;

  const lignes = [
    `SOUS-DÉTAIL — ${poste.code} ${poste.libelle}  (${uniteAffichee(poste.unite)})`,
    '',
  ];

  for (const l of poste.lignes) {
    const contexte =
      l.type === 'mainOeuvre' && poste.coefficientContexte !== 1
        ? ` × ${fmt(poste.coefficientContexte)} contexte`
        : '';
    lignes.push(
      `  ${colonne(typeComposantAffiche(l.type), 13)} ${colonne(l.libelle, 32)} ` +
        `${fmt(l.quantite, 3).padStart(9)} ${uniteAffichee(l.unite).padEnd(4)}` +
        `× ${fmt(l.prixUnitaire).padStart(9)}${contexte} = ${fmt(l.montant).padStart(9)} €  [${l.source}]`,
    );
  }

  lignes.push(
    '',
    `  Déboursé sec unitaire                      ${fmt(poste.debourseUnitaire.total).padStart(12)} €`,
    `    dont fournitures                         ${fmt(poste.debourseUnitaire.fournitures).padStart(12)} €`,
    `    dont main-d'œuvre                        ${fmt(poste.debourseUnitaire.mainOeuvre).padStart(12)} €`,
    `    dont matériel                            ${fmt(poste.debourseUnitaire.materiel).padStart(12)} €`,
    `  + frais de chantier                        ${fmt(poste.chaine.fraisChantier).padStart(12)} €`,
    `  = prix de revient                          ${fmt(poste.chaine.prixRevient).padStart(12)} €`,
    `  + frais généraux                           ${fmt(poste.chaine.fraisGeneraux).padStart(12)} €`,
    `  + aléas                                    ${fmt(poste.chaine.aleas).padStart(12)} €`,
    `  + marge                                    ${fmt(poste.chaine.marge).padStart(12)} €`,
    `  = PRIX UNITAIRE HT                         ${fmt(poste.prixUnitaire).padStart(12)} €` +
      (poste.prixImpose ? '   (imposé par le BPU)' : ''),
    `  coefficient de vente k = ${fmt(poste.coefficient, 3)}`,
  );

  return lignes.join('\n');
}
