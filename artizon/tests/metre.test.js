import test from 'node:test';
import assert from 'node:assert/strict';

import { arrondi, euros, auPas, pourcent } from '../src/core/arrondi.js';
import {
  surfaceMurs,
  surfaceSol,
  perimetre,
  volume,
  avecPertes,
  cloisonBA13,
  carrelage,
  peinture,
  terrassement,
  commander,
  PERTES,
} from '../src/core/metre.js';

test('les arrondis resistent a la representation binaire', () => {
  assert.equal(arrondi(1.005), 1.01);
  assert.equal(euros(0.1 + 0.2), 0.3);
  assert.equal(euros(1.0049), 1.0);
  assert.equal(arrondi(-2.345, 2), -2.35);
  assert.equal(pourcent(0.1234), 12.3);
});

test('une quantite commandee s\'arrondit vers le haut, au conditionnement', () => {
  assert.equal(auPas(4.2, 1), 5);
  assert.equal(auPas(4.0, 1), 4);
  assert.equal(auPas(20.02, 0.1), 20.1);
  assert.throws(() => auPas(4, 0), /Pas d'arrondi invalide/);
});

test('la surface des murs deduit les ouvertures au-dela du seuil declare', () => {
  const resultat = surfaceMurs({
    longueur: 4.2,
    largeur: 3.1,
    hauteur: 2.5,
    ouvertures: [
      { libelle: 'porte', largeur: 0.9, hauteur: 2.04 },
      { libelle: 'hublot', largeur: 0.4, hauteur: 0.4 },
    ],
  });

  assert.equal(resultat.brute, 36.5);
  assert.equal(resultat.deductions, 1.836);
  assert.equal(arrondi(resultat.quantite, 2), 34.66);
  assert.deepEqual(resultat.nonDeduites, ['hublot']);
  assert.match(resultat.convention, /0,50 m²/);
});

test('le metre est verifiable : chaque calcul est ecrit', () => {
  const resultat = surfaceMurs({ perimetre: 14.6, hauteur: 2.5, ouvertures: [] });
  assert.ok(resultat.detail.length >= 3);
  assert.ok(resultat.detail.some((l) => l.includes('14,60')));
  assert.ok(resultat.detail.at(-1).includes('Surface nette'));
});

test('surfaceMurs exige de quoi calculer un lineaire', () => {
  assert.throws(() => surfaceMurs({ hauteur: 2.5 }), /longueur/);
});

test('les pertes s\'appliquent a la quantite nette et restent tracees', () => {
  const resultat = avecPertes(100, PERTES.carrelageDroit);
  assert.equal(resultat.quantite, 107);
  assert.equal(resultat.nette, 100);
  assert.equal(resultat.taux, 0.07);
  assert.throws(() => avecPertes(100, 1.2), /Taux de pertes invalide/);
});

test('la cloison BA13 chiffre aussi ses accessoires', () => {
  const resultat = cloisonBA13({ longueur: 4.2, hauteur: 2.5 });
  assert.equal(resultat.quantite, 10.5);
  assert.equal(resultat.composants.plaques.nombre, 8);
  assert.equal(resultat.composants.montants.nombre, 9); // 4,20 / 0,60 + 1
  assert.ok(resultat.composants.bandeAJoint.quantite > 0);
  assert.ok(resultat.composants.enduitAJoint.quantite > 0);
});

test('le carrelage chiffre carreaux, colle et joint', () => {
  const resultat = carrelage({ surface: 20 });
  assert.equal(resultat.quantite, 21.4);
  assert.equal(resultat.composants.colle.quantite, 100);
  assert.equal(resultat.composants.colle.sacs, 4);

  const double = carrelage({ surface: 20, encollage: 'double' });
  assert.ok(double.composants.colle.quantite > resultat.composants.colle.quantite);
});

test('la peinture compte les couches et refuse un rendement absurde', () => {
  assert.equal(peinture({ surface: 50, couches: 2, rendement: 10, perte: 0.04 }).quantite, 10.4);
  assert.throws(() => peinture({ surface: 50, rendement: 0 }), /Rendement invalide/);
});

test('le terrassement distingue volume en place et volume evacue', () => {
  const resultat = terrassement({ volumeEnPlace: 10, foisonnement: 0.25 });
  assert.equal(resultat.quantite, 10);
  assert.equal(resultat.volumeEvacue, 12.5);
});

test('surfaces et volumes elementaires', () => {
  assert.equal(surfaceSol({ longueur: 4.2, largeur: 3.1 }).quantite, 13.02);
  assert.equal(perimetre({ longueur: 4.2, largeur: 3.1 }).quantite, 14.6);
  assert.equal(volume({ longueur: 40, largeur: 1, epaisseur: 0.12 }).quantite, 4.8);
  assert.equal(commander(4.2, { pas: 1, unite: 'U' }).quantite, 5);
});
