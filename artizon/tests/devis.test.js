import test from 'node:test';
import assert from 'node:assert/strict';

import { construireDevis, appliquerRemise } from '../src/core/devis.js';
import { chiffrerOuvrage } from '../src/core/ouvrage.js';
import { euros } from '../src/core/arrondi.js';
import { devisTest, OUVRAGE_TEST, PARAMETRES } from './aide.js';

test('les totaux sont recalcules depuis les postes, jamais reportes', () => {
  const devis = devisTest();
  const sommePostes = euros(devis.lots.flatMap((l) => l.postes).reduce((s, p) => s + p.total, 0));
  const sommeLots = euros(devis.lots.reduce((s, l) => s + l.totalHT, 0));

  assert.equal(devis.totalHT, sommePostes);
  assert.equal(devis.totalHT, sommeLots);
  assert.equal(devis.totalTTC, euros(devis.totalHT + devis.totalTVA));
});

test('un devis multi-taux se totalise taux par taux', () => {
  const poste = (tva, quantite) => ({ ...chiffrerOuvrage(OUVRAGE_TEST, quantite, PARAMETRES), tva });
  const devis = construireDevis({
    chantier: {},
    lots: [{ code: '03', libelle: 'Platrerie', postes: [poste(0.1, 10), poste(0.2, 5)] }],
    parametres: PARAMETRES,
  });

  assert.equal(devis.ventilationTVA.length, 2);
  const taux = devis.ventilationTVA.map((v) => v.taux);
  assert.deepEqual(taux, [0.1, 0.2]);
  assert.equal(
    euros(devis.ventilationTVA.reduce((s, v) => s + v.baseHT, 0)),
    devis.totalHT,
  );
  assert.equal(devis.totalTVA, euros(devis.ventilationTVA.reduce((s, v) => s + v.montantTVA, 0)));
});

test('un poste « pour memoire » ne pese pas dans les totaux', () => {
  const devis = devisTest({
    postes: [
      chiffrerOuvrage(OUVRAGE_TEST, 10, PARAMETRES),
      { code: '03.90', libelle: 'Fourni par le client', unite: 'ens', quantite: 0, pourMemoire: true, source: 'BPU' },
    ],
  });
  assert.equal(devis.lots[0].postes.length, 2);
  assert.equal(devis.totalHT, devis.lots[0].postes[0].total);
});

test('un poste sans debourse est signale, pas compte pour zero en silence', () => {
  const devis = devisTest({
    postes: [
      chiffrerOuvrage(OUVRAGE_TEST, 10, PARAMETRES),
      { code: '03.91', libelle: 'Sous-traitance', unite: 'ens', quantite: 1, prixUnitaire: 5000, source: 'ESTIME' },
    ],
  });

  assert.equal(devis.synthese.debourseComplet, false);
  assert.deepEqual(devis.synthese.postesSansDebourse, ['03.91']);
  assert.equal(devis.synthese.montantSansDebourse, 5000);
});

test('la repartition main-d\'oeuvre ne porte que sur le debourse decompose', () => {
  const devis = devisTest({
    postes: [
      chiffrerOuvrage(OUVRAGE_TEST, 10, PARAMETRES),
      {
        code: '03.91',
        libelle: 'Sous-traitance',
        unite: 'ens',
        quantite: 1,
        prixUnitaire: 5000,
        debourseTotal: 3600,
        source: 'FOURNISSEUR',
      },
    ],
  });

  const lot = devis.lots[0];
  assert.ok(lot.couvertureDecomposition < 1);
  // 25,20 € de MO sur 43,20 € de debourse decompose : le poste sous-traite ne dilue pas le ratio.
  assert.equal(lot.partMainOeuvre, 0.5833);
});

test('l\'echeancier isole la retenue de garantie', () => {
  const devis = devisTest({ conditions: { validiteJours: 60, acompte: 0.3, retenueGarantie: 0.05 } });
  assert.equal(devis.retenueGarantie, euros(devis.totalHT * 0.05));
  const somme = euros(devis.echeancier.reduce((s, e) => s + e.montant, 0));
  assert.equal(somme, devis.totalTTC);
});

test('une remise se traduit en points de marge et le passage sous le plancher est refuse', () => {
  const devis = devisTest();
  const legere = appliquerRemise(devis, 0.03);
  assert.ok(legere.margeApres < legere.margeAvant);
  assert.ok(legere.pointsPerdus > 0);
  assert.match(legere.avis, /ACCEPTABLE/);

  const brutale = appliquerRemise(devis, 0.3);
  assert.equal(brutale.aPerte, true);
  assert.match(brutale.avis, /REFUSER/);
});

test('un devis sans lot est refuse', () => {
  assert.throws(() => construireDevis({ lots: [], parametres: PARAMETRES }), /au moins un lot/);
});
