/**
 * Recopie Work Sans dans remotion/public/ pour que le bundler Remotion la serve.
 *
 * Les .ttf viennent du paquet @expo-google-fonts/work-sans — les mêmes fichiers
 * que charge l'application Mida. Ils ne sont pas versionnés : ce dossier est
 * ignoré par git et reconstruit à la demande, comme la configuration fontconfig
 * du rendu statique.
 */

import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);
const source = dirname(require.resolve('@expo-google-fonts/work-sans/package.json'));
const cible = join(import.meta.dirname, 'remotion', 'public', 'fonts');

mkdirSync(cible, { recursive: true });

const FACES = [
  '400Regular/WorkSans_400Regular.ttf',
  '600SemiBold/WorkSans_600SemiBold.ttf',
  '800ExtraBold/WorkSans_800ExtraBold.ttf',
];

for (const face of FACES) {
  const de = join(source, face);
  if (!existsSync(de)) throw new Error(`Police introuvable : ${de}`);
  copyFileSync(de, join(cible, face.split('/')[1]));
}

console.log(`${FACES.length} graisses de Work Sans copiées dans remotion/public/fonts/`);
