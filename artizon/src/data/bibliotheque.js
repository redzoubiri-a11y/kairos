/**
 * Bibliotheque de prix Artizon — second oeuvre, France.
 *
 * Chaque composant porte sa source. Les prix marques BIBLIO sont issus des
 * chantiers Artizon et des tarifs fournisseurs negocies, et sont dates : un prix
 * de plus de 18 mois est signale par les controles et doit etre reconsulte.
 *
 * Ce fichier est la donnee de calcul. Les fourchettes de `ratios.js` ne servent
 * qu'a verifier que le resultat reste plausible.
 */

export const MISE_A_JOUR = '2026-01';

const mo = (libelle, heures, cout = 42) => ({
  type: 'mainOeuvre',
  libelle,
  quantite: heures,
  unite: 'h',
  prixUnitaire: cout,
  source: 'BIBLIO',
});

const f = (libelle, quantite, unite, prixUnitaire, source = 'BIBLIO') => ({
  type: 'fourniture',
  libelle,
  quantite,
  unite,
  prixUnitaire,
  source,
});

const materiel = (libelle, quantite, unite, prixUnitaire) => ({
  type: 'materiel',
  libelle,
  quantite,
  unite,
  prixUnitaire,
  source: 'BIBLIO',
});

export const OUVRAGES = {
  '01.01': {
    code: '01.01',
    libelle: 'Installation et repli de chantier',
    unite: 'ens',
    lot: 'installation',
    fraisDeChantier: true,
    maj: MISE_A_JOUR,
    composants: [
      mo('Installation, signalisation, repli', 12, 42),
      materiel('Protections, base vie, branchements', 1, 'ens', 450),
    ],
  },
  '01.02': {
    code: '01.02',
    libelle: 'Protection des sols et des existants',
    unite: 'm2',
    lot: 'installation',
    fraisDeChantier: true,
    maj: MISE_A_JOUR,
    composants: [f('Film, carton, adhésif', 1, 'm2', 2.2), mo('Mise en place et dépose', 0.06, 36)],
  },

  '02.01': {
    code: '02.01',
    libelle: 'Dépose de cloison en plaques de plâtre',
    unite: 'm2',
    lot: 'demolition',
    maj: MISE_A_JOUR,
    composants: [mo('Dépose et tri', 0.28, 36), materiel('Consommables et outillage', 1, 'm2', 0.6)],
  },
  '02.02': {
    code: '02.02',
    libelle: 'Évacuation de gravats en benne, traitement compris',
    unite: 'm3',
    lot: 'demolition',
    maj: MISE_A_JOUR,
    composants: [
      f('Benne, rotation et traitement en déchèterie', 1, 'm3', 52),
      mo('Chargement et manutention', 0.5, 36),
    ],
  },

  '03.01': {
    code: '03.01',
    libelle: 'Cloison 98/48, BA13 standard sur ossature, isolée',
    unite: 'm2',
    lot: 'platrerie',
    famille: 'cloison',
    maj: MISE_A_JOUR,
    composants: [
      f('Plaque BA13 standard', 2.2, 'm2', 3.3),
      f('Ossature 48 : rails et montants', 1, 'm2', 4.2),
      f('Laine minérale 45 mm', 1, 'm2', 4.6),
      f('Vis, bande à joint, enduit', 1, 'm2', 1.9),
      mo('Montage, pose et finition', 0.6),
    ],
  },
  '03.02': {
    code: '03.02',
    libelle: 'Cloison 98/48, BA13 hydrofuge, locaux humides',
    unite: 'm2',
    lot: 'platrerie',
    famille: 'cloison',
    maj: MISE_A_JOUR,
    composants: [
      f('Plaque BA13 hydrofuge', 2.2, 'm2', 5.2),
      f('Ossature 48 : rails et montants', 1, 'm2', 4.2),
      f('Laine minérale 45 mm', 1, 'm2', 4.6),
      f('Vis, bande à joint, enduit hydro', 1, 'm2', 1.9),
      mo('Montage, pose et finition', 0.65),
    ],
  },
  '03.03': {
    code: '03.03',
    libelle: 'Doublage collé 13 + 80 sur mur existant',
    unite: 'm2',
    lot: 'platrerie',
    famille: 'doublage',
    maj: MISE_A_JOUR,
    composants: [
      f('Complexe de doublage 13 + 80', 1.1, 'm2', 13.2),
      f('Mortier adhésif, bande, enduit', 1, 'm2', 1.9),
      mo('Collage, pose et finition', 0.4),
    ],
  },
  '03.04': {
    code: '03.04',
    libelle: 'Plafond suspendu BA13 sur ossature',
    unite: 'm2',
    lot: 'platrerie',
    famille: 'plafondSuspendu',
    maj: MISE_A_JOUR,
    composants: [
      f('Plaque BA13 standard', 1.1, 'm2', 3.3),
      f('Ossature, fourrures et suspentes', 1, 'm2', 9.2),
      f('Vis, bande à joint, enduit', 1, 'm2', 1.9),
      mo('Pose ossature, plaques et finition', 0.72),
    ],
  },

  '04.01': {
    code: '04.01',
    libelle: 'Ragréage autolissant, primaire compris',
    unite: 'm2',
    lot: 'sols',
    maj: MISE_A_JOUR,
    composants: [
      f('Ragréage', 1, 'm2', 3.4),
      f('Primaire d\'accrochage', 1, 'm2', 0.9),
      mo('Application', 0.14),
    ],
  },
  '04.02': {
    code: '04.02',
    libelle: 'Chape ciment traditionnelle, épaisseur 5 cm',
    unite: 'm2',
    lot: 'sols',
    famille: 'chape',
    maj: MISE_A_JOUR,
    composants: [f('Mortier de chape', 1, 'm2', 9.0), mo('Mise en œuvre et talochage', 0.35)],
  },

  '05.01': {
    code: '05.01',
    libelle: 'Carrelage sol grès cérame 45 × 45, pose droite',
    unite: 'm2',
    lot: 'carrelage',
    famille: 'carrelage',
    maj: MISE_A_JOUR,
    composants: [
      f('Carreaux grès cérame, chutes comprises', 1.07, 'm2', 24),
      f('Colle à carrelage', 5, 'kg', 0.46),
      f('Joint et croisillons', 1, 'm2', 2.2),
      mo('Pose et jointoiement', 0.65),
    ],
  },
  '05.02': {
    code: '05.02',
    libelle: 'Faïence murale 20 × 25, pose droite',
    unite: 'm2',
    lot: 'carrelage',
    famille: 'faience',
    maj: MISE_A_JOUR,
    composants: [
      f('Faïence, chutes comprises', 1.09, 'm2', 22),
      f('Colle et joint', 1, 'm2', 3.7),
      mo('Pose et jointoiement', 1.0),
    ],
  },
  '05.03': {
    code: '05.03',
    libelle: 'Plinthes carrelage assorties',
    unite: 'ml',
    lot: 'carrelage',
    maj: MISE_A_JOUR,
    composants: [
      f('Plinthes, chutes comprises', 1.05, 'ml', 6.5),
      f('Colle et joint', 1, 'ml', 0.5),
      mo('Pose', 0.16),
    ],
  },

  '06.01': {
    code: '06.01',
    libelle: 'Parquet stratifié flottant, sous-couche comprise',
    unite: 'm2',
    lot: 'sols',
    famille: 'parquetFlottant',
    maj: MISE_A_JOUR,
    composants: [
      f('Lames stratifiées, chutes comprises', 1.07, 'm2', 22),
      f('Sous-couche acoustique', 1, 'm2', 2.6),
      mo('Pose flottante', 0.32),
    ],
  },

  '07.01': {
    code: '07.01',
    libelle: 'Peinture murs : préparation, impression et 2 couches',
    unite: 'm2',
    lot: 'peinture',
    famille: 'peinture',
    maj: MISE_A_JOUR,
    composants: [
      f('Impression', 0.13, 'L', 4.2),
      f('Peinture de finition, 2 couches', 0.26, 'L', 6.8),
      f('Enduit de lissage et abrasifs', 1, 'm2', 1.55),
      f('Protection et consommables', 1, 'm2', 0.45),
      mo('Préparation du support et application', 0.42),
    ],
  },
  '07.02': {
    code: '07.02',
    libelle: 'Peinture plafond : impression et 2 couches',
    unite: 'm2',
    lot: 'peinture',
    famille: 'peinture',
    maj: MISE_A_JOUR,
    composants: [
      f('Impression', 0.13, 'L', 4.2),
      f('Peinture de finition, 2 couches', 0.26, 'L', 6.8),
      f('Enduit, abrasifs, protection', 1, 'm2', 1.75),
      mo('Préparation et application au plafond', 0.48),
    ],
  },

  '08.01': {
    code: '08.01',
    libelle: 'Bloc-porte intérieur, huisserie et quincaillerie',
    unite: 'U',
    lot: 'menuiserie',
    maj: MISE_A_JOUR,
    composants: [
      f('Bloc-porte alvéolaire', 1, 'U', 195, 'FOURNISSEUR'),
      f('Quincaillerie et fixations', 1, 'U', 25),
      mo('Pose et réglage', 1.6),
    ],
  },

  '09.01': {
    code: '09.01',
    libelle: 'Point électrique encastré en rénovation, saignée comprise',
    unite: 'U',
    lot: 'electricite',
    maj: MISE_A_JOUR,
    composants: [
      f('Appareillage, boîte, gaine et câble', 1, 'U', 24),
      mo('Saignée, câblage, pose et rebouchage', 1.1),
    ],
  },
  '09.02': {
    code: '09.02',
    libelle: 'Tableau électrique complet, mise à la terre comprise',
    unite: 'U',
    lot: 'electricite',
    maj: MISE_A_JOUR,
    composants: [
      f('Coffret, disjoncteurs, différentiels, peignes', 1, 'U', 420, 'FOURNISSEUR'),
      mo('Câblage, repérage et mise en service', 6, 47),
    ],
  },

  '10.01': {
    code: '10.01',
    libelle: 'Alimentation et évacuation d\'un appareil sanitaire',
    unite: 'U',
    lot: 'plomberie',
    maj: MISE_A_JOUR,
    composants: [
      f('Tubes, raccords, évacuation et fixations', 1, 'U', 85),
      mo('Percements, pose des réseaux et essais', 3.2),
    ],
  },

  '11.01': {
    code: '11.01',
    libelle: 'Nettoyage de fin de chantier',
    unite: 'm2',
    lot: 'nettoyage',
    maj: MISE_A_JOUR,
    composants: [f('Produits et consommables', 1, 'm2', 0.35), mo('Nettoyage', 0.1, 36)],
  },
};

/** Recupere un ouvrage, en echouant clairement s'il n'existe pas. */
export function ouvrage(code) {
  const trouve = OUVRAGES[code];
  if (!trouve) {
    throw new Error(
      `Ouvrage "${code}" absent de la bibliothèque. Codes disponibles : ${Object.keys(OUVRAGES).join(', ')}`,
    );
  }
  return trouve;
}

/** Ouvrages d'un lot donne. */
export function ouvragesDuLot(lot) {
  return Object.values(OUVRAGES).filter((o) => o.lot === lot);
}
