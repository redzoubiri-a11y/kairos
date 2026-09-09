import test from 'node:test';
import assert from 'node:assert/strict';

import { controler } from '../src/core/controles.js';
import { chiffrerOuvrage } from '../src/core/ouvrage.js';
import { devisTest, OUVRAGE_TEST, PARAMETRES } from './aide.js';

const codes = (liste) => liste.map((item) => item.code);

test('un devis propre est remettable, et le nombre de controles passes est affiche', () => {
  const resultat = controler(devisTest());
  assert.deepEqual(resultat.bloquants, []);
  assert.equal(resultat.verdict, 'REMETTABLE');
  assert.ok(resultat.passes > 5);
});

test('les controles non evalues sont annonces, pas passes sous silence', () => {
  const resultat = controler(devisTest());
  assert.ok(resultat.nonEvalues.length > 0);
  assert.ok(codes(resultat.nonEvalues).includes('B8'));
  assert.ok(resultat.nonEvalues.every((item) => typeof item.raison === 'string'));
});

test('B1 — une incoherence de total est bloquante', () => {
  const devis = devisTest();
  devis.totalHT += 100;
  assert.ok(codes(controler(devis).bloquants).includes('B1'));
});

test('B3 — une unite inconnue est bloquante', () => {
  const devis = devisTest();
  devis.lots[0].postes[0].unite = 'metres carres';
  assert.ok(codes(controler(devis).bloquants).includes('B3'));
});

test('B4 — une quantite nulle non declaree « pour memoire » est bloquante', () => {
  const devis = devisTest({
    postes: [{ code: '03.01', libelle: 'X', unite: 'm2', quantite: 0, prixUnitaire: 50, source: 'BIBLIO' }],
  });
  assert.ok(codes(controler(devis).bloquants).includes('B4'));
});

test('B5 — un prix nul non declare comme offert est bloquant', () => {
  const devis = devisTest({
    postes: [{ code: '03.01', libelle: 'X', unite: 'm2', quantite: 10, prixUnitaire: 0, source: 'BIBLIO' }],
  });
  assert.ok(codes(controler(devis).bloquants).includes('B5'));
});

test('B6 — un coefficient sous le seuil de couverture est bloquant', () => {
  const poste = chiffrerOuvrage(OUVRAGE_TEST, 20, PARAMETRES, { prixUnitaireImpose: 45 });
  const resultat = controler(devisTest({ postes: [{ ...poste, lot: 'platrerie' }] }));
  assert.ok(codes(resultat.bloquants).includes('B6'));
  assert.equal(resultat.verdict, 'NON REMETTABLE');
});

test('B7 — une marge negative est bloquante', () => {
  const poste = chiffrerOuvrage(OUVRAGE_TEST, 20, PARAMETRES, { prixUnitaireImpose: 40 });
  assert.ok(codes(controler(devisTest({ postes: [poste] })).bloquants).includes('B7'));
});

test('B8 — une piece exigee par le RC et absente est bloquante', () => {
  const devis = devisTest();
  devis.dossier = { piecesRequises: ['AE', 'DPGF', 'memoire technique'], piecesFournies: ['AE', 'DPGF'] };
  const resultat = controler(devis);
  assert.ok(codes(resultat.bloquants).includes('B8'));
  assert.match(resultat.bloquants.find((b) => b.code === 'B8').message, /memoire technique/);
});

test('B10 — un ecart entre acte d\'engagement et DPGF est bloquant', () => {
  const devis = devisTest();
  devis.dossier = { montantActeEngagement: devis.totalHT + 1 };
  assert.ok(codes(controler(devis).bloquants).includes('B10'));
});

test('A4 — une part de postes estimes trop elevee alerte et nomme les consultations', () => {
  const devis = devisTest({
    postes: [
      chiffrerOuvrage(OUVRAGE_TEST, 5, PARAMETRES),
      {
        code: '03.90',
        libelle: 'Ouvrage particulier',
        unite: 'ens',
        quantite: 1,
        prixUnitaire: 4000,
        debourseTotal: 2800,
        source: 'ESTIME',
      },
    ],
  });
  const alerte = controler(devis).alertes.find((a) => a.code === 'A4');
  assert.ok(alerte);
  assert.match(alerte.message, /Ouvrage particulier/);
});

test('A5 — un ecart avec le DPGF client est signale', () => {
  const devis = devisTest();
  devis.lots[0].postes[0].quantiteDPGF = 16; // metre Artizon a 20
  const alerte = controler(devis).alertes.find((a) => a.code === 'A5');
  assert.ok(alerte);
  assert.match(alerte.message, /\+25,0 %/);
});

test('A7 — des aleas nuls en renovation declenchent une alerte', () => {
  const devis = devisTest({ parametres: { ...PARAMETRES, aleas: 0 } });
  assert.ok(codes(controler(devis).alertes).includes('A7'));
});

test('A8 — des frais de chantier comptes en poste et en pourcentage sont un double comptage', () => {
  const devis = devisTest();
  devis.lots[0].postes[0].fraisDeChantier = true;
  assert.ok(codes(controler(devis).alertes).includes('A8'));
});

test('A9 — une offre longue sans clause de revision est signalee', () => {
  const devis = devisTest({ conditions: { validiteJours: 180, revisionPrix: false, acompte: 0.3 } });
  assert.ok(codes(controler(devis).alertes).includes('A9'));
});

test('A12 — un prix trop ancien est signale', () => {
  const devis = devisTest();
  devis.lots[0].postes[0].dateSource = '2023-01';
  assert.ok(codes(controler(devis).alertes).includes('A12'));
});

test('A13 — une marge calculee sur un debourse incomplet est annoncee comme surestimee', () => {
  const devis = devisTest({
    postes: [
      chiffrerOuvrage(OUVRAGE_TEST, 10, PARAMETRES),
      { code: '03.91', libelle: 'Sous-traitance', unite: 'ens', quantite: 1, prixUnitaire: 5000, source: 'ESTIME' },
    ],
  });
  const alerte = controler(devis).alertes.find((a) => a.code === 'A13');
  assert.ok(alerte);
  assert.match(alerte.message, /SURESTIMÉS/);
});

test('un poste « pour memoire » n\'est pas pris pour un oubli de prix', () => {
  const devis = devisTest({
    postes: [
      chiffrerOuvrage(OUVRAGE_TEST, 10, PARAMETRES),
      { code: '03.90', libelle: 'Fourni par le client', unite: 'ens', quantite: 0, pourMemoire: true, source: 'BPU' },
    ],
  });
  const resultat = controler(devis);
  assert.ok(!codes(resultat.bloquants).includes('B2'));
  assert.ok(!codes(resultat.bloquants).includes('B4'));
});
