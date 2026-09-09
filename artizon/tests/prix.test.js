import test from 'node:test';
import assert from 'node:assert/strict';

import {
  prixDeVente,
  coefficientVente,
  prixPlancher,
  margeRestante,
  effetRemise,
  lireCoefficient,
  fournitureRendueChantier,
  coutMainOeuvre,
  debourseSec,
} from '../src/core/prix.js';

const P = { fraisChantier: 0.08, fraisGeneraux: 0.12, aleas: 0.03, marge: 0.08 };

test('le prix de vente se calcule par division, pas par multiplication', () => {
  const resultat = prixDeVente(100, P);

  assert.equal(resultat.prixRevient, 108);
  assert.equal(resultat.prixVente, 140.26);

  // La methode fausse (multiplication) donnerait 132,84 € et 5,9 % de marge reelle.
  const methodeFausse = 100 * 1.08 * (1 + 0.12 + 0.03 + 0.08);
  assert.ok(resultat.prixVente > methodeFausse);
  assert.equal(Math.round((resultat.prixVente - methodeFausse) * 100) / 100, 7.42);
});

test('la marge obtenue est bien celle qui etait visee', () => {
  const { prixVente, marge } = prixDeVente(100, P);
  assert.equal(Math.round((marge / prixVente) * 1000) / 1000, 0.08);
});

test('le coefficient de vente se deduit des seuls parametres', () => {
  assert.equal(coefficientVente(P), 1.4026);
  assert.equal(prixDeVente(100, P).coefficient, 1.4026);
  assert.equal(prixDeVente(4321.5, P).coefficient, 1.4026);
});

test('un taux exprime en points au lieu de decimal est refuse', () => {
  assert.throws(() => prixDeVente(100, { ...P, marge: 8 }), /décimal/);
});

test('un cumul de taux irrealiste est refuse plutot que divergent', () => {
  assert.throws(
    () => prixDeVente(100, { fraisChantier: 0, fraisGeneraux: 0.5, aleas: 0.2, marge: 0.25 }),
    /diverge/,
  );
});

test('le prix plancher couvre les frais generaux et les aleas, sans marge', () => {
  const { prixPlancher: plancher } = prixPlancher(100, P);
  assert.equal(plancher, 127.06);
  assert.ok(plancher < prixDeVente(100, P).prixVente);

  const sansAleas = prixPlancher(100, P, { inclureAleas: false });
  assert.equal(sansAleas.prixPlancher, 122.73);
});

test('la marge restante a un prix impose est calculable, et le passage sous le plancher detecte', () => {
  const bon = margeRestante({ prixCible: 140.26, debourseSec: 100, parametres: P });
  assert.equal(Math.round(bon.marge * 1000) / 1000, 0.08);
  assert.equal(bon.sousPlancher, false);

  const mauvais = margeRestante({ prixCible: 120, debourseSec: 100, parametres: P });
  assert.ok(mauvais.marge < 0);
  assert.equal(mauvais.sousPlancher, true);
  assert.equal(mauvais.aPerte, false); // au-dessus du prix de revient, mais pas des frais generaux

  const perte = margeRestante({ prixCible: 100, debourseSec: 100, parametres: P });
  assert.equal(perte.aPerte, true);
});

test('une remise se lit en points de marge, pas en pourcentage du prix', () => {
  const effet = effetRemise({ prixVente: 140.26, debourseSec: 100, parametres: P, remise: 0.03 });
  assert.equal(effet.prixRemise, 136.05);
  assert.equal(effet.pointsPerdus, 2.38); // une remise de 3 % coute 2,4 points de marge
  assert.ok(effet.margeApres < effet.margeAvant);
});

test('les bornes du coefficient distinguent bloquant, alerte et normal', () => {
  assert.equal(lireCoefficient(1.2).niveau, 'bloquant');
  assert.equal(lireCoefficient(1.4).niveau, 'alerte');
  assert.equal(lireCoefficient(1.6).niveau, 'normal');
  assert.equal(lireCoefficient(1.85).niveau, 'normal');
  assert.equal(lireCoefficient(2.1).niveau, 'alerte');
});

test('une fourniture est rendue chantier, pas prise au catalogue', () => {
  const prix = fournitureRendueChantier({
    prixCatalogue: 22,
    remise: 0.12,
    transport: 1.1,
    manutention: 0.4,
  });
  assert.equal(prix, 20.86);
  assert.ok(prix < 22);
});

test('le contexte de chantier allonge le temps, il ne peut pas le reduire', () => {
  assert.equal(coutMainOeuvre({ tempsUnitaire: 0.6, coutHoraire: 42, coefficientContexte: 1.2 }), 30.24);
  assert.throws(
    () => coutMainOeuvre({ tempsUnitaire: 0.6, coutHoraire: 42, coefficientContexte: 0.9 }),
    /allonge le temps/,
  );
});

test('le debourse sec additionne les trois natures de cout', () => {
  assert.equal(debourseSec({ fournitures: 18, mainOeuvre: 25.2, materiel: 1.5 }), 44.7);
});
