import test from 'node:test';
import assert from 'node:assert/strict';

import { comparerOffres } from '../src/core/comparatif.js';

const POSTES = [
  { ref: 'BA13', libelle: 'Plaque BA13', quantite: 400, unite: 'm2' },
  { ref: 'OSS', libelle: 'Ossature 48', quantite: 400, unite: 'm2' },
  { ref: 'LAINE', libelle: 'Laine minerale 45', quantite: 400, unite: 'm2' },
];

const offre = (fournisseur, prix, extra = {}) => ({
  fournisseur,
  lignes: Object.entries(prix).map(([ref, prixUnitaire]) => ({ ref, prixUnitaire, unite: 'm2' })),
  ...extra,
});

test('les offres sont ramenees aux quantites de reference Artizon', () => {
  const resultat = comparerOffres({
    postes: POSTES,
    offres: [
      offre('Alpha', { BA13: 3.3, OSS: 4.2, LAINE: 4.6 }, { delaiJours: 10 }),
      offre('Beta', { BA13: 3.1, OSS: 4.5, LAINE: 4.4 }, { delaiJours: 15 }),
    ],
  });

  const alpha = resultat.offres.find((o) => o.fournisseur === 'Alpha');
  assert.equal(alpha.total, 400 * (3.3 + 4.2 + 4.6));
  assert.equal(alpha.couverture, 1);
  assert.equal(alpha.complete, true);
});

test('une ligne non chiffree est detectee : c\'est la que se cache le moins-disant apparent', () => {
  const resultat = comparerOffres({
    postes: POSTES,
    offres: [
      offre('Complet', { BA13: 3.3, OSS: 4.2, LAINE: 4.6 }),
      offre('Partiel', { BA13: 3.0, OSS: 4.0 }), // ne chiffre pas la laine
    ],
  });

  const partiel = resultat.offres.find((o) => o.fournisseur === 'Partiel');
  assert.deepEqual(partiel.manquantes, ['LAINE']);
  assert.ok(partiel.couverture < 1);
  assert.equal(partiel.complete, false);
  // Moins cher en apparence, mais la recommandation ne le retient pas.
  // Son total remis est plus bas, mais il est extrapole pour comparer, et
  // l'offre n'est pas retenable tant que la ligne manque.
  assert.ok(partiel.totalComparable > partiel.total);
  assert.equal(resultat.moinsDisant, 'Partiel');
  assert.deepEqual(resultat.eligibles, ['Complet']);
  assert.equal(resultat.recommandation.fournisseur, 'Complet');
  assert.ok(resultat.recommandation.raisons.some((r) => /LAINE/.test(r)));
  assert.ok(resultat.recommandation.raisons.some((r) => /n'est pas ferme/.test(r)));
});

test('une unite non comparable est signalee plutot que convertie au hasard', () => {
  const resultat = comparerOffres({
    postes: POSTES,
    offres: [
      offre('Alpha', { BA13: 3.3, OSS: 4.2, LAINE: 4.6 }),
      {
        fournisseur: 'Gamma',
        lignes: [
          { ref: 'BA13', prixUnitaire: 10, unite: 'U' },
          { ref: 'OSS', prixUnitaire: 4.2, unite: 'm2' },
          { ref: 'LAINE', prixUnitaire: 4.6, unite: 'm2' },
        ],
      },
    ],
  });

  const gamma = resultat.offres.find((o) => o.fournisseur === 'Gamma');
  assert.equal(gamma.unitesIncoherentes.length, 1);
  assert.match(gamma.unitesIncoherentes[0], /BA13/);
});

test('une offre tres inferieure a la moyenne est marquee suspecte', () => {
  const resultat = comparerOffres({
    postes: POSTES,
    offres: [
      offre('Alpha', { BA13: 3.3, OSS: 4.2, LAINE: 4.6 }),
      offre('Beta', { BA13: 3.4, OSS: 4.3, LAINE: 4.7 }),
      offre('Casse-prix', { BA13: 1.6, OSS: 2.0, LAINE: 2.2 }),
    ],
  });

  const suspecte = resultat.offres.find((o) => o.fournisseur === 'Casse-prix');
  assert.equal(suspecte.suspecte, true);
  assert.notEqual(resultat.recommandation.fournisseur, 'Casse-prix');
  assert.ok(resultat.recommandation.raisons.some((r) => /sous la moyenne/.test(r)));
});

test('les garanties manquantes pesent sur la note et sont rappelees', () => {
  const resultat = comparerOffres({
    postes: POSTES,
    qualificationsRequises: ['RGE'],
    offres: [
      offre('Alpha', { BA13: 3.3, OSS: 4.2, LAINE: 4.6 }, { qualifications: ['RGE'], assuranceDecennale: true }),
      offre('Beta', { BA13: 3.2, OSS: 4.1, LAINE: 4.5 }, { qualifications: [], assuranceDecennale: false }),
    ],
  });

  const beta = resultat.offres.find((o) => o.fournisseur === 'Beta');
  assert.ok(beta.garantiesManquantes.includes('RGE'));
  assert.ok(beta.garantiesManquantes.includes('assurance décennale'));
  assert.equal(beta.detailNote.garanties, 0);
  assert.ok(resultat.recommandation.raisons.some((r) => /assurance décennale/.test(r)));
});

test('moins-disant et mieux-disant sont distingues explicitement', () => {
  const resultat = comparerOffres({
    postes: POSTES,
    offres: [
      offre('Rapide', { BA13: 3.4, OSS: 4.3, LAINE: 4.7 }, { delaiJours: 5, assuranceDecennale: true }),
      offre('Lent', { BA13: 3.3, OSS: 4.2, LAINE: 4.6 }, { delaiJours: 60, assuranceDecennale: false }),
    ],
  });

  assert.equal(resultat.moinsDisant, 'Lent');
  // « Lent » est le moins cher mais sans assurance decennale : hors jeu.
  assert.deepEqual(resultat.eligibles, ['Rapide']);
  assert.equal(resultat.mieuxDisant, 'Rapide');
  assert.equal(resultat.recommandation.fournisseur, 'Rapide');
  assert.ok(resultat.recommandation.raisons.some((r) => /est retenu/.test(r)));
});

test('comparer exige au moins deux offres et des postes de reference', () => {
  assert.throws(() => comparerOffres({ postes: POSTES, offres: [offre('Seul', { BA13: 3 })] }), /deux offres/);
  assert.throws(() => comparerOffres({ postes: [], offres: [] }), /postes de référence/);
});
