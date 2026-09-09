import test from 'node:test';
import assert from 'node:assert/strict';

import { chiffrerOuvrage, sousDetail, fiabilite } from '../src/core/ouvrage.js';
import { OUVRAGE_TEST, PARAMETRES } from './aide.js';

test('un composant sans source de prix est refuse', () => {
  const ouvrage = {
    ...OUVRAGE_TEST,
    composants: [{ type: 'fourniture', libelle: 'X', quantite: 1, unite: 'm2', prixUnitaire: 10 }],
  };
  assert.throws(() => chiffrerOuvrage(ouvrage, 1, PARAMETRES), /source de prix manquante/);
});

test('un type de composant inconnu est refuse', () => {
  const ouvrage = {
    ...OUVRAGE_TEST,
    composants: [{ type: 'divers', libelle: 'X', quantite: 1, prixUnitaire: 10, source: 'BIBLIO' }],
  };
  assert.throws(() => chiffrerOuvrage(ouvrage, 1, PARAMETRES), /type de composant inconnu/);
});

test('un ouvrage sans composant ne peut pas etre chiffre', () => {
  assert.throws(() => chiffrerOuvrage({ ...OUVRAGE_TEST, composants: [] }, 1, PARAMETRES), /aucun composant/);
});

test('la fiabilite d\'un ouvrage est celle de son composant le plus faible', () => {
  assert.equal(fiabilite([{ source: 'BPU' }, { source: 'FOURNISSEUR' }]), 'FOURNISSEUR');
  assert.equal(fiabilite([{ source: 'BIBLIO' }, { source: 'ESTIME' }]), 'ESTIME');
  assert.equal(
    chiffrerOuvrage(OUVRAGE_TEST, 1, PARAMETRES).source,
    'BIBLIO',
  );
});

test('le coefficient de contexte agit sur la main-d\'oeuvre, pas sur les fournitures', () => {
  const normal = chiffrerOuvrage(OUVRAGE_TEST, 1, PARAMETRES);
  const occupe = chiffrerOuvrage(OUVRAGE_TEST, 1, PARAMETRES, { coefficientContexte: 1.2 });

  assert.equal(normal.debourseUnitaire.fournitures, occupe.debourseUnitaire.fournitures);
  assert.equal(occupe.debourseUnitaire.mainOeuvre, 30.24);
  assert.equal(normal.debourseUnitaire.mainOeuvre, 25.2);
  assert.ok(occupe.prixUnitaire > normal.prixUnitaire);
});

test('le total est le produit du prix unitaire par la quantite', () => {
  const poste = chiffrerOuvrage(OUVRAGE_TEST, 20, PARAMETRES);
  assert.equal(poste.total, Math.round(poste.prixUnitaire * 20 * 100) / 100);
  assert.equal(poste.debourseTotal, Math.round(poste.debourseUnitaire.total * 20 * 100) / 100);
});

test('un prix impose par un BPU remplace le prix calcule mais garde le sous-detail', () => {
  const poste = chiffrerOuvrage(OUVRAGE_TEST, 10, PARAMETRES, { prixUnitaireImpose: 50 });
  assert.equal(poste.prixUnitaire, 50);
  assert.equal(poste.prixImpose, true);
  assert.ok(poste.debourseUnitaire.total > 0);
  assert.ok(poste.coefficient < 1.35); // un BPU peut ne pas couvrir le debourse : c'est l'information utile
});

test('le sous-detail imprime la chaine complete de prix', () => {
  const texte = sousDetail(chiffrerOuvrage(OUVRAGE_TEST, 1, PARAMETRES));
  for (const attendu of [
    'Déboursé sec unitaire',
    'frais de chantier',
    'prix de revient',
    'frais généraux',
    'aléas',
    'PRIX UNITAIRE HT',
    'coefficient de vente',
    '[FOURNISSEUR]',
  ]) {
    assert.ok(texte.includes(attendu), `sous-detail sans "${attendu}"`);
  }
});
