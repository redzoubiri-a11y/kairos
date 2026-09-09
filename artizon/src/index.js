/**
 * Moteur de chiffrage Artizon.
 *
 * Point d'entree unique : tout ce dont le chiffreur a besoin s'importe d'ici.
 *
 *   import { chiffrerOuvrage, construireDevis, controler } from '@artizon/chiffrage'
 */

export * from './core/arrondi.js';
export * from './core/prix.js';
export * from './core/metre.js';
export * from './core/ouvrage.js';
export * from './core/tva.js';
export * from './core/devis.js';
export * from './core/controles.js';
export * from './core/comparatif.js';
export * from './rendu.js';

export {
  PARAMETRES_DEFAUT,
  COUT_HORAIRE,
  FRAIS_CHANTIER_PAR_TYPE,
  ALEAS_PAR_CONTEXTE,
  MARGE_PAR_CONTEXTE,
  FRAIS_ANNEXES,
  CONDITIONS_DEFAUT,
} from './data/parametres.js';

export {
  RATIOS_OUVRAGE,
  RATIOS_LOT_SHAB,
  RATIOS_OPERATION,
  REPARTITION_LOT,
  SEUILS,
  UNITES,
} from './data/ratios.js';

export { OUVRAGES, ouvrage, ouvragesDuLot, MISE_A_JOUR } from './data/bibliotheque.js';
