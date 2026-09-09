#!/usr/bin/env node
/**
 * Chiffre une affaire decrite en JSON et imprime devis, controles et TVA.
 *
 *   node artizon/cli/chiffrer.js artizon/exemples/renovation-appartement.json
 *   node artizon/cli/chiffrer.js affaire.json --sous-detail 05.01
 *   node artizon/cli/chiffrer.js affaire.json --remise 3
 */

import { readFile } from 'node:fs/promises';
import { chiffrerAffaire } from '../src/affaire.js';
import { formaterDevis, formaterControles } from '../src/rendu.js';
import { sousDetail } from '../src/core/ouvrage.js';
import { appliquerRemise } from '../src/core/devis.js';

const nb = (valeur, decimales = 2) =>
  Number(valeur).toLocaleString('fr-FR', {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  });

const argv = process.argv.slice(2);
const options = {};
const positionnels = [];
for (let i = 0; i < argv.length; i += 1) {
  if (argv[i].startsWith('--')) {
    options[argv[i].slice(2)] = argv[i + 1];
    i += 1;
  } else {
    positionnels.push(argv[i]);
  }
}
const fichier = positionnels[0];

if (!fichier) {
  console.error('Usage : node artizon/cli/chiffrer.js <affaire.json> [--sous-detail <code>] [--remise <%>]');
  process.exit(2);
}

const config = JSON.parse(await readFile(fichier, 'utf8'));
const { devis, controles, tva } = chiffrerAffaire(config);

console.log(formaterDevis(devis));
console.log('');
console.log(`TVA        ${(tva.taux * 100).toFixed(1).replace('.', ',')} % — ${tva.motif}`);
for (const condition of tva.conditions) console.log(`           · ${condition}`);
for (const alerteTva of tva.alertes) console.log(`           ⚠ ${alerteTva}`);
console.log('');
console.log(formaterControles(controles));

const code = options['sous-detail'];
if (code) {
  const poste = devis.lots.flatMap((l) => l.postes).find((p) => p.code === code);
  if (!poste) {
    console.error(`\nAucun poste ${code} dans ce devis.`);
    process.exit(1);
  }
  console.log('');
  console.log(sousDetail(poste));
}

const remise = options.remise;
if (remise !== undefined) {
  const resultat = appliquerRemise(devis, Number(remise) / 100);
  console.log('');
  console.log(`REMISE COMMERCIALE DE ${remise} %`);
  console.log(`  Total HT          ${nb(resultat.totalHT)} € (−${nb(resultat.montantRemise)} €)`);
  console.log(
    `  Marge             ${nb(resultat.margeAvant * 100, 1)} % → ${nb(resultat.margeApres * 100, 1)} % ` +
      `(−${nb(resultat.pointsPerdus, 2)} points)`,
  );
  console.log(`  Prix plancher     ${nb(resultat.prixPlancher)} €`);
  console.log(`  ${resultat.avis}`);
}

if (controles.bloquants.length > 0) process.exit(1);
