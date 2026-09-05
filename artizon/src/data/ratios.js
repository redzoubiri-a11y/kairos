/**
 * Fourchettes de controle.
 *
 * Ce ne sont PAS des prix a utiliser : ce sont des bornes de plausibilite qui
 * servent a detecter qu'un chiffrage est hors normes. Le prix vient toujours de
 * la bibliotheque, d'un fournisseur ou d'un BPU.
 */

/** Euros HT par m2 de surface traitee, fourniture et pose. */
export const RATIOS_OUVRAGE = {
  peinture: { min: 25, max: 45 },
  doublage: { min: 40, max: 65 },
  cloison: { min: 55, max: 90 },
  plafondSuspendu: { min: 55, max: 95 },
  chape: { min: 30, max: 55 },
  carrelage: { min: 70, max: 120 },
  carrelageGrandFormat: { min: 110, max: 190 },
  faience: { min: 80, max: 150 },
  parquetFlottant: { min: 45, max: 85 },
  parquetMassif: { min: 100, max: 200 },
  isolationInterieure: { min: 45, max: 85 },
};

/** Euros HT par m2 de surface habitable, par lot, en renovation d'appartement. */
export const RATIOS_LOT_SHAB = {
  electricite: { min: 90, max: 170 },
  plomberie: { min: 60, max: 130 },
  platrerie: { min: 80, max: 150 },
};

/** Euros HT par m2 de surface habitable, operation complete. */
export const RATIOS_OPERATION = {
  rafraichissement: { min: 350, max: 700 },
  renovationMoyenne: { min: 700, max: 1200 },
  renovationLourde: { min: 1200, max: 2000 },
  repriseDeStructure: { min: 2000, max: 4000 },
};

/** Part de main-d'oeuvre dans le debourse, par lot. Un ecart signale une erreur. */
export const REPARTITION_LOT = {
  peinture: { min: 0.62, max: 0.88 },
  platrerie: { min: 0.5, max: 0.75 },
  carrelage: { min: 0.42, max: 0.68 },
  sols: { min: 0.3, max: 0.68 },
  electricite: { min: 0.45, max: 0.75 },
  plomberie: { min: 0.4, max: 0.7 },
  menuiserieExterieure: { min: 0.2, max: 0.4 },
  menuiserie: { min: 0.18, max: 0.48 },
  grosOeuvre: { min: 0.32, max: 0.52 },
  demolition: { min: 0.45, max: 0.96 },
  nettoyage: { min: 0.75, max: 0.96 },
};

/** Seuils de declenchement des alertes de controle. */
export const SEUILS = {
  partEstimee: 0.15,
  ecartPostesVoisins: 0.25,
  ecartDPGF: 0.1,
  offreSuspecte: 0.25,
  ageSourceMois: 18,
  validiteMoisSansRevision: 3,
  posteMajeur: 0.1,
};

/** Unites admises dans un devis. Toute autre unite est une erreur de saisie. */
export const UNITES = new Set(['m2', 'ml', 'm3', 'U', 'kg', 'L', 'h', 'ens', 'F', 'j', 'mois', 't']);

/**
 * Les cles restent ASCII pour rester comparables et saisissables ; l'affichage,
 * lui, est celui d'un document francais.
 */
const AFFICHAGE_UNITE = { m2: 'm²', m3: 'm³' };

export const uniteAffichee = (unite) => AFFICHAGE_UNITE[unite] ?? unite ?? '';

const AFFICHAGE_NATURE = {
  neuf: 'construction neuve',
  renovation: 'rénovation',
  rehabilitation: 'réhabilitation',
  amelioration: 'amélioration',
  transformation: 'transformation',
  amenagement: 'aménagement',
  entretien: 'entretien',
  renovation_energetique: 'rénovation énergétique',
  travaux_induits: 'travaux induits',
  surelevation: 'surélévation',
  reconstruction: 'reconstruction',
  agrandissement: 'agrandissement',
};

export const natureAffichee = (nature) => AFFICHAGE_NATURE[nature] ?? nature ?? '';

const AFFICHAGE_TYPE_COMPOSANT = {
  fourniture: 'fourniture',
  mainOeuvre: "main-d'œuvre",
  materiel: 'matériel',
};

export const typeComposantAffiche = (type) => AFFICHAGE_TYPE_COMPOSANT[type] ?? type;
