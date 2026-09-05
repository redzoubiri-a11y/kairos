/**
 * TVA sur les travaux — marche francais.
 *
 * Le moteur PROPOSE un taux et liste les conditions a faire attester par le
 * client. Il ne tranche pas : la preuve incombe a l'entreprise en cas de
 * controle, et une TVA sous-appliquee est redressee avec penalites. En cas de
 * doute, le taux retourne est 20 % assorti d'une alerte.
 */

import { natureAffichee } from '../data/ratios.js';

export const TAUX = {
  NORMAL: 0.2,
  INTERMEDIAIRE: 0.1,
  REDUIT: 0.055,
};

const CONDITIONS_TAUX_REDUIT = [
  'Local à usage d\'habitation achevé depuis plus de 2 ans',
  'Attestation du client, ou mention portée sur le devis et la facture, à conserver',
  'Travaux facturés directement au client occupant ou propriétaire',
];

/** Natures de travaux relevant du taux intermediaire. */
const NATURES_INTERMEDIAIRE = new Set(['amelioration', 'transformation', 'amenagement', 'entretien']);

/** Natures de travaux relevant du taux reduit. */
const NATURES_REDUIT = new Set(['renovation_energetique', 'travaux_induits']);

/** Natures exclues de tout taux reduit. */
const NATURES_EXCLUES = new Set(['neuf', 'surelevation', 'reconstruction', 'agrandissement']);

/** Categories de prestation exclues des taux reduits meme en logement ancien. */
const CATEGORIES_EXCLUES = new Set([
  'gros_equipement',
  'mobilier',
  'electromenager',
  'amenagement_exterieur',
  'piscine',
]);

/**
 * @param {object} contexte
 * @param {'habitation'|'professionnel'|'mixte'} contexte.typeLocal
 * @param {number} contexte.ageLogementAnnees
 * @param {string} contexte.natureTravaux
 * @param {string} [contexte.categorie]
 */
export function tauxApplicable({
  typeLocal = 'habitation',
  ageLogementAnnees,
  natureTravaux,
  categorie,
}) {
  const alertes = [];

  if (typeLocal !== 'habitation') {
    return {
      taux: TAUX.NORMAL,
      code: 'NORMAL',
      motif: `Local ${typeLocal} : les taux réduits sont réservés au logement`,
      conditions: [],
      alertes: typeLocal === 'mixte'
        ? ['Local mixte : ventiler les travaux entre partie habitation et partie professionnelle']
        : [],
    };
  }

  if (NATURES_EXCLUES.has(natureTravaux)) {
    return {
      taux: TAUX.NORMAL,
      code: 'NORMAL',
      motif: `Travaux de type « ${natureAffichee(natureTravaux)} » : assimilés à du neuf, exclus des taux réduits`,
      conditions: [],
      alertes,
    };
  }

  if (categorie && CATEGORIES_EXCLUES.has(categorie)) {
    return {
      taux: TAUX.NORMAL,
      code: 'NORMAL',
      motif: `Catégorie « ${categorie} » exclue des taux réduits`,
      conditions: [],
      alertes: ['Vérifier la liste des gros équipements en vigueur avant de trancher'],
    };
  }

  if (typeof ageLogementAnnees !== 'number') {
    return {
      taux: TAUX.NORMAL,
      code: 'NORMAL',
      motif: 'Âge du logement inconnu : taux normal par prudence',
      conditions: [],
      alertes: ['Âge du logement à confirmer : un taux réduit est possible au-delà de 2 ans'],
    };
  }

  if (ageLogementAnnees < 2) {
    return {
      taux: TAUX.NORMAL,
      code: 'NORMAL',
      motif: `Logement achevé depuis ${ageLogementAnnees} an(s), moins de 2 ans`,
      conditions: [],
      alertes,
    };
  }

  if (NATURES_REDUIT.has(natureTravaux)) {
    return {
      taux: TAUX.REDUIT,
      code: 'REDUIT',
      motif: `Travaux de type « ${natureAffichee(natureTravaux)} » en logement de plus de 2 ans`,
      conditions: [...CONDITIONS_TAUX_REDUIT, 'Éligibilité des travaux au taux de 5,5 % à vérifier poste par poste'],
      alertes,
    };
  }

  if (NATURES_INTERMEDIAIRE.has(natureTravaux)) {
    return {
      taux: TAUX.INTERMEDIAIRE,
      code: 'INTERMEDIAIRE',
      motif: `Travaux de type « ${natureAffichee(natureTravaux)} » en logement de plus de 2 ans`,
      conditions: CONDITIONS_TAUX_REDUIT,
      alertes,
    };
  }

  return {
    taux: TAUX.NORMAL,
    code: 'NORMAL',
    motif: `Nature de travaux « ${natureAffichee(natureTravaux)} » non rattachée à un taux réduit`,
    conditions: [],
    alertes: ['Nature des travaux à préciser : un taux réduit est peut-être applicable'],
  };
}

/** Regime de facturation entre entreprises du batiment. */
export function regimeSousTraitance({ sousTraitance = false } = {}) {
  if (!sousTraitance) return { autoliquidation: false, mention: null };
  return {
    autoliquidation: true,
    mention: 'Autoliquidation — TVA due par le preneur (art. 283-2 nonies du CGI)',
    note: 'Le sous-traitant facture hors taxe. Tout comparatif d\'offres se fait en HT.',
  };
}
