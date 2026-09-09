import test from 'node:test';
import assert from 'node:assert/strict';

import { tauxApplicable, regimeSousTraitance, TAUX } from '../src/core/tva.js';

test('amelioration d\'un logement de plus de deux ans : taux intermediaire', () => {
  const resultat = tauxApplicable({ ageLogementAnnees: 30, natureTravaux: 'amelioration' });
  assert.equal(resultat.taux, TAUX.INTERMEDIAIRE);
  assert.ok(resultat.conditions.some((c) => /attestation/i.test(c)));
});

test('renovation energetique : taux reduit, conditions listees', () => {
  const resultat = tauxApplicable({ ageLogementAnnees: 30, natureTravaux: 'renovation_energetique' });
  assert.equal(resultat.taux, TAUX.REDUIT);
  assert.ok(resultat.conditions.length >= 3);
});

test('un logement de moins de deux ans reste au taux normal', () => {
  assert.equal(tauxApplicable({ ageLogementAnnees: 1, natureTravaux: 'amelioration' }).taux, TAUX.NORMAL);
});

test('les travaux assimiles a du neuf sont exclus des taux reduits', () => {
  for (const nature of ['neuf', 'surelevation', 'reconstruction', 'agrandissement']) {
    assert.equal(tauxApplicable({ ageLogementAnnees: 40, natureTravaux: nature }).taux, TAUX.NORMAL);
  }
});

test('un local professionnel est au taux normal, un local mixte declenche une alerte', () => {
  assert.equal(
    tauxApplicable({ typeLocal: 'professionnel', ageLogementAnnees: 40, natureTravaux: 'amelioration' }).taux,
    TAUX.NORMAL,
  );
  const mixte = tauxApplicable({ typeLocal: 'mixte', ageLogementAnnees: 40, natureTravaux: 'amelioration' });
  assert.ok(mixte.alertes.some((a) => /ventiler/i.test(a)));
});

test('en cas de doute, le moteur retient 20 % et le signale plutot que de trancher', () => {
  const ageInconnu = tauxApplicable({ natureTravaux: 'amelioration' });
  assert.equal(ageInconnu.taux, TAUX.NORMAL);
  assert.ok(ageInconnu.alertes.length > 0);

  const natureFloue = tauxApplicable({ ageLogementAnnees: 40, natureTravaux: 'travaux divers' });
  assert.equal(natureFloue.taux, TAUX.NORMAL);
  assert.ok(natureFloue.alertes.length > 0);
});

test('les gros equipements restent au taux normal meme en logement ancien', () => {
  const resultat = tauxApplicable({
    ageLogementAnnees: 40,
    natureTravaux: 'amelioration',
    categorie: 'gros_equipement',
  });
  assert.equal(resultat.taux, TAUX.NORMAL);
  assert.ok(resultat.alertes.length > 0);
});

test('la sous-traitance BTP passe en autoliquidation', () => {
  assert.equal(regimeSousTraitance({ sousTraitance: false }).autoliquidation, false);
  const st = regimeSousTraitance({ sousTraitance: true });
  assert.equal(st.autoliquidation, true);
  assert.match(st.mention, /Autoliquidation/);
});
