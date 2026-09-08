/**
 * Rendre Work Sans visible à Sharp.
 *
 * Sharp rend le SVG via librsvg, qui résout les polices par fontconfig — donc
 * par les polices installées sur la machine, pas par le paquet npm. Sans rien
 * faire, `font-family="Work Sans ExtraBold"` ne produit pas une erreur : il
 * retombe silencieusement sur la police par défaut du système. Le visuel sort,
 * dans la mauvaise typographie, et personne ne s'en aperçoit avant publication.
 *
 * On écrit donc une configuration fontconfig dédiée, pointant sur les fichiers
 * .ttf du paquet @expo-google-fonts/work-sans — les mêmes que ceux que charge
 * l'application. La configuration système reste incluse en second, pour que les
 * caractères absents de Work Sans aient encore une police de secours.
 *
 * FONTCONFIG_FILE doit être posée AVANT le premier chargement de sharp : c'est
 * pourquoi static.ts importe sharp dynamiquement, après avoir appelé ici.
 */

import { mkdirSync, copyFileSync, writeFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);

/** Les trois graisses utilisées par le gabarit, sous le nom exact de theme.js. */
const FACES = [
  '400Regular/WorkSans_400Regular.ttf',
  '600SemiBold/WorkSans_600SemiBold.ttf',
  '800ExtraBold/WorkSans_800ExtraBold.ttf',
] as const;

let configured: string | null = null;

function workSansDir(): string {
  // On résout par le package.json : le chemin dans node_modules dépend de
  // l'endroit d'où le studio est lancé (racine, monorepo, script de test).
  return dirname(require.resolve('@expo-google-fonts/work-sans/package.json'));
}

/**
 * Installe la configuration fontconfig et renvoie son chemin.
 * Idempotent : le second appel dans le même processus ne fait rien.
 */
export function ensureFonts(): string {
  if (configured) return configured;

  const source = workSansDir();
  const root = join(tmpdir(), 'kairos-studio-fonts');
  const fontsDir = join(root, 'fonts');
  const cacheDir = join(root, 'cache');
  mkdirSync(fontsDir, { recursive: true });
  mkdirSync(cacheDir, { recursive: true });

  for (const face of FACES) {
    const from = join(source, face);
    const to = join(fontsDir, face.split('/')[1]!);
    if (!existsSync(from)) {
      throw new Error(
        `Police introuvable : ${from}. ` +
          `Le paquet @expo-google-fonts/work-sans est-il installé ?`,
      );
    }
    if (!existsSync(to)) copyFileSync(from, to);
  }

  const configPath = join(root, 'fonts.conf');
  writeFileSync(
    configPath,
    `<?xml version="1.0"?>
<!DOCTYPE fontconfig SYSTEM "urn:fontconfig:fonts.dtd">
<fontconfig>
  <dir>${fontsDir}</dir>
  <cachedir>${cacheDir}</cachedir>
  <include ignore_missing="yes">/etc/fonts/fonts.conf</include>
  <include ignore_missing="yes">/usr/local/etc/fonts/fonts.conf</include>
  <include ignore_missing="yes">/opt/homebrew/etc/fonts/fonts.conf</include>
</fontconfig>
`,
    'utf8',
  );

  process.env.FONTCONFIG_FILE = configPath;
  configured = configPath;
  return configPath;
}

/**
 * Vérifie que Work Sans est réellement utilisée, et pas seulement demandée.
 *
 * On rend deux fois la même chaîne : une fois dans la graisse voulue, une fois
 * dans une famille qui n'existe nulle part. Si les deux images sont identiques,
 * c'est que la première a été servie par la police de repli — la configuration
 * n'a pas pris, et tout visuel produit ensuite serait dans la mauvaise
 * typographie. On préfère s'arrêter.
 */
export async function assertWorkSansAvailable(
  sharp: typeof import('sharp'),
): Promise<void> {
  const probe = async (family: string): Promise<number> => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="520" height="140">
      <rect width="520" height="140" fill="#000000"/>
      <text x="16" y="96" font-family="${family}" font-size="56" fill="#FFFFFF">Réservé ce soir</text>
    </svg>`;
    const { data } = await sharp(Buffer.from(svg))
      .greyscale()
      .raw()
      .toBuffer({ resolveWithObject: true });
    let lit = 0;
    for (const p of data) if (p > 200) lit++;
    return lit;
  };

  const [wanted, fallback] = await Promise.all([
    probe('Work Sans ExtraBold'),
    probe('Kairos Police Absente'),
  ]);

  if (wanted === fallback) {
    throw new Error(
      'Work Sans n\'est pas résolue par fontconfig : le rendu utiliserait la ' +
        'police de repli du système. Vérifier FONTCONFIG_FILE ' +
        `(${process.env.FONTCONFIG_FILE ?? 'non posée'}) et l'installation de ` +
        '@expo-google-fonts/work-sans.',
    );
  }
}
