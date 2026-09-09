/**
 * Recopie les polices dans remotion/public/ pour que le bundler Remotion les serve.
 *
 * Les .ttf viennent des paquets @expo-google-fonts : Work Sans, les mêmes
 * fichiers que charge l'application Mida, et Cairo pour l'arabe — Work Sans n'a
 * aucun glyphe arabe. Ils ne sont pas versionnés : ce dossier est ignoré par git
 * et reconstruit à la demande, comme la configuration fontconfig du rendu
 * statique.
 */

import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);
const cible = join(import.meta.dirname, 'remotion', 'public', 'fonts');
mkdirSync(cible, { recursive: true });

const PAQUETS = {
  '@expo-google-fonts/work-sans': [
    '400Regular/WorkSans_400Regular.ttf',
    '600SemiBold/WorkSans_600SemiBold.ttf',
    '800ExtraBold/WorkSans_800ExtraBold.ttf',
  ],
  '@expo-google-fonts/cairo': [
    '400Regular/Cairo_400Regular.ttf',
    '600SemiBold/Cairo_600SemiBold.ttf',
    '800ExtraBold/Cairo_800ExtraBold.ttf',
  ],
};

for (const [paquet, faces] of Object.entries(PAQUETS)) {
  const source = dirname(require.resolve(`${paquet}/package.json`));
  for (const face of faces) {
    const de = join(source, face);
    if (!existsSync(de)) throw new Error(`Police introuvable : ${de}`);
    copyFileSync(de, join(cible, face.split('/')[1]));
  }
}

const total = Object.values(PAQUETS).reduce((n, f) => n + f.length, 0);
console.log(`${total} graisses copiées dans remotion/public/fonts/ (Work Sans + Cairo)`);
