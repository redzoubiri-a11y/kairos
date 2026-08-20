// Tracés du monogramme Tasalle — le T et le S de la marque.
//
// Les lettres s'appuyaient auparavant sur le serif du système : Georgia sur le
// web, Times sur iOS, le serif d'Android. Trois dessins pour une même marque,
// et un rendu qui changeait avec les polices installées sur la machine
// d'impression. Elles sont désormais figées en contours.
//
// Ces tracés viennent de Liberation Serif — métriquement compatible avec Times
// et la fonte que le navigateur rendait pour les maquettes validées. Le
// résultat est donc identique à ce qui a été approuvé, mais reproductible.
// Régénération : node scripts/make-icons.js --glyphes (voir le script).
//
// Module pur : ni React Native ni Expo, pour que les gabarits PDF et le
// générateur d'icônes s'en servent aussi.

/** Repère de référence : toutes les coordonnées sont dans ce carré. */
export const MONOGRAMME_VIEWBOX = '0 0 100 100';

/** Filet circulaire entourant les lettres. */
export const MONOGRAMME_CERCLE = { cx: 50, cy: 50, r: 47.2, largeur: 1.6 };

/**
 * Le S descend sous la ligne du T et mord sur son pied : c'est le
 * chevauchement du document de marque, impossible à obtenir par un simple
 * interlettrage.
 */
export const MONOGRAMME_T =
  'M51.59 64L34.36 64L34.36 62.52L40.29 61.77L40.29 29.07L38.87 29.07Q31.83 29.07 29.24 29.63L28.49 35.44L26.62 35.44L26.62 26.68L59.46 26.68L59.46 35.44L57.57 35.44L56.82 29.63Q55.98 29.43 53.17 29.28Q50.36 29.13 47.02 29.13L45.66 29.13L45.66 61.77L51.59 62.52Z';

export const MONOGRAMME_S =
  'M49.91 72.80L49.91 65.54L51.43 65.54L52.25 69.78Q53.12 70.88 55.24 71.73Q57.36 72.57 59.43 72.57Q62.71 72.57 64.55 70.89Q66.39 69.22 66.39 66.27Q66.39 64.58 65.67 63.48Q64.96 62.38 63.80 61.61Q62.64 60.85 61.16 60.32Q59.68 59.80 58.13 59.26Q56.57 58.72 55.09 58.06Q53.61 57.41 52.45 56.40Q51.29 55.39 50.58 53.90Q49.86 52.41 49.86 50.23Q49.86 46.48 52.68 44.35Q55.49 42.22 60.48 42.22Q64.28 42.22 68.73 43.23L68.73 49.77L67.21 49.77L66.39 45.92Q64 44.19 60.48 44.19Q57.34 44.19 55.57 45.46Q53.80 46.74 53.80 48.99Q53.80 50.52 54.52 51.52Q55.23 52.53 56.39 53.25Q57.55 53.96 59.04 54.48Q60.53 54.99 62.09 55.54Q63.64 56.09 65.13 56.79Q66.62 57.48 67.78 58.54Q68.94 59.61 69.66 61.14Q70.37 62.68 70.37 64.93Q70.37 69.48 67.58 71.97Q64.79 74.47 59.54 74.47Q57.01 74.47 54.46 74.02Q51.90 73.58 49.91 72.80Z';
