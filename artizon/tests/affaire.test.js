import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import { chiffrerAffaire } from '../src/affaire.js';
import { formaterDevis, formaterControles } from '../src/rendu.js';
import { euros } from '../src/core/arrondi.js';

const CHEMIN = fileURLToPath(new URL('../exemples/renovation-appartement.json', import.meta.url));
const config = JSON.parse(await readFile(CHEMIN, 'utf8'));

test('l\'affaire d\'exemple se chiffre sans bloquant', () => {
  const { devis, controles } = chiffrerAffaire(config);

  assert.equal(controles.bloquants.length, 0);
  assert.notEqual(controles.verdict, 'NON REMETTABLE');
  assert.ok(devis.totalHT > 0);
});

test('les totaux de l\'affaire sont coherents a tous les niveaux', () => {
  const { devis } = chiffrerAffaire(config);

  const postes = devis.lots.flatMap((l) => l.postes);
  assert.equal(devis.totalHT, euros(postes.reduce((s, p) => s + (p.total ?? 0), 0)));
  assert.equal(devis.totalHT, euros(devis.lots.reduce((s, l) => s + l.totalHT, 0)));
  assert.equal(devis.totalHT, euros(devis.ventilationTVA.reduce((s, v) => s + v.baseHT, 0)));
  assert.equal(devis.totalTTC, euros(devis.totalHT + devis.totalTVA));
});

test('le taux de TVA est deduit du chantier et ses conditions sont rappelees', () => {
  const { tva } = chiffrerAffaire(config);
  assert.equal(tva.taux, 0.1);
  assert.ok(tva.conditions.length > 0);
});

test('un poste referencant un ouvrage inconnu echoue clairement', () => {
  const casse = {
    ...config,
    lots: [{ code: '99', libelle: 'X', postes: [{ ouvrage: '99.99', quantite: 1 }] }],
  };
  assert.throws(() => chiffrerAffaire(casse), /absent de la bibliothèque/);
});

test('un poste libre sans source de prix est refuse', () => {
  const casse = {
    ...config,
    lots: [
      {
        code: '99',
        libelle: 'X',
        postes: [{ code: '99.01', libelle: 'Sans source', unite: 'U', quantite: 1, prixUnitaire: 100 }],
      },
    ],
  };
  assert.throws(() => chiffrerAffaire(casse), /source de prix manquante/);
});

test('le contexte de chantier renforce le prix de la main-d\'oeuvre', () => {
  const sansContexte = chiffrerAffaire({
    ...config,
    chantier: { ...config.chantier, coefficientContexte: 1 },
  });
  const avecContexte = chiffrerAffaire(config);
  assert.ok(avecContexte.devis.totalHT > sansContexte.devis.totalHT);
});

test('les livrables texte contiennent les rubriques attendues', () => {
  const { devis, controles } = chiffrerAffaire(config);

  const texteDevis = formaterDevis(devis);
  for (const attendu of ['DEVIS', 'TOTAL HT', 'TOTAL TTC', 'SYNTHÈSE', 'Coefficient de vente', 'Prix plancher']) {
    assert.ok(texteDevis.includes(attendu), `devis sans "${attendu}"`);
  }

  const texteControles = formaterControles(controles);
  assert.ok(texteControles.includes('CONTRÔLES'));
  assert.ok(texteControles.includes('VERDICT'));
  assert.ok(texteControles.includes('NON ÉVALUÉS'));
});
