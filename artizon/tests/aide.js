/** Fabriques partagees par les tests. */

import { chiffrerOuvrage } from '../src/core/ouvrage.js';
import { construireDevis } from '../src/core/devis.js';

export const PARAMETRES = { fraisChantier: 0.08, fraisGeneraux: 0.12, aleas: 0.03, marge: 0.08 };

export const OUVRAGE_TEST = {
  code: '03.01',
  libelle: 'Cloison BA13',
  unite: 'm2',
  lot: 'platrerie',
  famille: 'cloison',
  composants: [
    { type: 'fourniture', libelle: 'Plaques et ossature', quantite: 1, unite: 'm2', prixUnitaire: 18, source: 'FOURNISSEUR' },
    { type: 'mainOeuvre', libelle: 'Pose', quantite: 0.6, unite: 'h', prixUnitaire: 42, source: 'BIBLIO' },
  ],
};

/** Devis minimal valide, sur lequel les tests appliquent leurs variations. */
export function devisTest({ postes, parametres = PARAMETRES, chantier, conditions } = {}) {
  const poste =
    postes ??
    [
      {
        ...chiffrerOuvrage(OUVRAGE_TEST, 20, parametres),
        lot: 'platrerie',
        famille: 'cloison',
      },
    ];

  return construireDevis({
    reference: 'TEST',
    date: '2026-09-05',
    chantier: chantier ?? { nature: 'renovation', surfaceHabitable: 60 },
    lots: [{ code: '03', libelle: 'Platrerie', lot: 'platrerie', postes: poste }],
    parametres,
    conditions: conditions ?? { validiteJours: 60, acompte: 0.3 },
    tvaParDefaut: 0.1,
  });
}
