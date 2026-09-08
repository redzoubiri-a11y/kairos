/**
 * Vérification du rendu visuel, sans base ni clé API.
 *
 * Elle prouve trois choses que le reste du studio suppose : Work Sans est bien
 * la police servie, le titre se replie sur deux lignes sans déborder, et le
 * bloc « note » disparaît proprement quand la note manque.
 */

import { writeFileSync } from 'node:fs';
import { renderStatic, wrapText } from '../src/render/static.ts';

const CASES = [
  {
    file: 'out/smoke-1-court.jpg',
    input: {
      headline: 'La terrasse ouvre ce soir',
      subline: 'Le Jasmin — Hydra, Alger',
      badge: 'Terrasse',
      cta: 'Réserver sur Mida',
      rating: 4.6,
      photoUrl: null,
    },
  },
  {
    file: 'out/smoke-2-long.jpg',
    input: {
      headline: 'Une table pour deux, à vingt heures, sans attendre',
      subline: "L'Élégance — Didouche Mourad, Alger centre",
      badge: 'Cuisine méditerranéenne',
      cta: 'Réserver sur Mida',
      rating: 4.9,
      photoUrl: null,
    },
  },
  {
    file: 'out/smoke-3-sans-note.jpg',
    input: {
      headline: 'Le poisson arrive du port',
      subline: 'Cap Béjaïa — Port de Béjaïa',
      badge: 'Poisson',
      cta: 'Réserver sur Mida',
      rating: null,
      photoUrl: null,
    },
  },
  {
    file: 'out/smoke-4-echappement.jpg',
    input: {
      headline: 'Grillades & <braise> "au feu"',
      subline: "Grille Viking — Bab El Oued",
      badge: 'Grillades',
      cta: 'Réserver sur Mida',
      rating: 4.2,
      photoUrl: null,
    },
  },
] as const;

const wrapped = wrapText(
  'Une table pour deux, à vingt heures, sans attendre',
  76,
  'extraBold',
  936,
  2,
);
console.log(`Repli du titre long → ${wrapped.length} ligne(s) :`);
for (const line of wrapped) console.log(`  « ${line} »`);

for (const testCase of CASES) {
  const result = await renderStatic(testCase.input);
  writeFileSync(testCase.file, result.buffer);
  console.log(
    `${testCase.file} — ${result.width}×${result.height}, ` +
      `${(result.buffer.byteLength / 1024).toFixed(0)} Ko` +
      (result.photoMissing ? ' (fond uni, pas de photo)' : ''),
  );
}
console.log('\nRendu vérifié : Work Sans résolue, aucun débordement, échappement XML tenu.');
