/**
 * Point d'entrée unique vers le moteur de chiffrage depuis l'app.
 *
 * Le moteur (artizon/src) est partagé avec la CLI et les tests — un seul
 * point de change si son emplacement bouge un jour.
 *
 * Attention : `rendu.js` (formatage des devis en texte) utilise
 * `toLocaleString('fr-FR', ...)`, qui dépend d'ICU. Hermes (moteur JS de
 * React Native) n'embarque pas toujours l'ICU complet selon la
 * configuration du build — vérifier avant d'utiliser ce module pour
 * l'affichage d'un devis dans l'app, ou passer par un formateur maison.
 */

export * from '../../../src/core/arrondi.js';
export * from '../../../src/core/prix.js';
export * from '../../../src/core/tva.js';
export * from '../../../src/core/comparatif.js';

export {
  PARAMETRES_DEFAUT,
  COUT_HORAIRE,
  FRAIS_CHANTIER_PAR_TYPE,
  ALEAS_PAR_CONTEXTE,
  MARGE_PAR_CONTEXTE,
  CONDITIONS_DEFAUT,
} from '../../../src/data/parametres.js';
