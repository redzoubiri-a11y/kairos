/**
 * Parametres d'entreprise Artizon.
 *
 * Ces valeurs se CONSTATENT (compte de resultat, releves de chantier), elles ne
 * se devinent pas. Elles sont revues une fois par exercice, pas a chaque devis :
 * un taux recalcule a chaque affaire est un taux incoherent d'une affaire a l'autre.
 */

export const EXERCICE_DE_REFERENCE = 2026;

/** Parametres par defaut de la chaine de prix. */
export const PARAMETRES_DEFAUT = {
  fraisChantier: 0.08,
  fraisGeneraux: 0.12,
  aleas: 0.04,
  marge: 0.08,
};

/**
 * Cout horaire ENTREPRISE : salaire charge, conges payes BTP, intemperies,
 * paniers, trajets, formation, temps improductif. Ce n'est pas le taux du salarie.
 */
export const COUT_HORAIRE = {
  apprenti: 24,
  ouvrierSpecialise: 36,
  ouvrierQualifie: 42,
  ouvrierHautementQualifie: 47,
  chefEquipe: 52,
};

/** Frais de chantier forfaitises, en % du debourse, quand ils ne sont pas chiffres en postes. */
export const FRAIS_CHANTIER_PAR_TYPE = {
  neufAccessible: 0.055,
  renovationLogementVide: 0.08,
  renovationLogementOccupe: 0.11,
  siteIndustrielEnActivite: 0.16,
};

/** Provision pour aleas selon la connaissance de l'existant. */
export const ALEAS_PAR_CONTEXTE = {
  neufDossierComplet: 0.015,
  renovationExistantSonde: 0.04,
  renovationExistantNonSonde: 0.08,
  prixFermesSurChantierLong: 0.03,
  sousSolNonReconnu: 0.08,
};

/** Marge visee selon le contexte commercial. Decision de direction, pas calcul. */
export const MARGE_PAR_CONTEXTE = {
  marchePublicConcurrentiel: 0.05,
  marchePriveStandard: 0.09,
  techniciteForte: 0.15,
  clientOuChantierDifficile: 0.12,
};

/** Frais annexes souvent oublies (cf. references/ratios-metre.md §7). */
export const FRAIS_ANNEXES = {
  benne8m3: { min: 350, max: 700, unite: 'U' },
  echafaudageFacade: { min: 12, max: 25, unite: 'm2/mois' },
  nacelle: { min: 200, max: 450, unite: 'jour' },
  baseVie: { min: 250, max: 600, unite: 'mois' },
  nettoyageFinDeChantier: { min: 3, max: 8, unite: 'm2' },
  protectionExistants: { min: 2, max: 6, unite: 'm2' },
  coordinationSPS: { min: 1500, max: 6000, unite: 'operation' },
  compteProrata: { min: 0.01, max: 0.02, unite: '% du lot' },
};

/** Conditions contractuelles par defaut d'un devis Artizon. */
export const CONDITIONS_DEFAUT = {
  validiteJours: 60,
  retenueGarantie: 0,
  acompte: 0.3,
  delaiPaiementJours: 30,
  revisionPrix: false,
};
