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
 * Cairo s'y ajoute pour l'arabe. Work Sans n'a aucun glyphe arabe : le repli
 * silencieux n'y serait pas une faute de typographie mais du tofu.
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

/** Mêmes graisses en Cairo, pour l'arabe. */
const FACES_AR = [
  '400Regular/Cairo_400Regular.ttf',
  '600SemiBold/Cairo_600SemiBold.ttf',
  '800ExtraBold/Cairo_800ExtraBold.ttf',
] as const;

let configured: string | null = null;

function paquetDir(nom: string): string {
  // On résout par le package.json : le chemin dans node_modules dépend de
  // l'endroit d'où le studio est lancé (racine, monorepo, script de test).
  return dirname(require.resolve(`${nom}/package.json`));
}

/**
 * Installe la configuration fontconfig et renvoie son chemin.
 * Idempotent : le second appel dans le même processus ne fait rien.
 */
export function ensureFonts(): string {
  if (configured) return configured;

  const root = join(tmpdir(), 'kairos-studio-fonts');
  const fontsDir = join(root, 'fonts');
  const cacheDir = join(root, 'cache');
  mkdirSync(fontsDir, { recursive: true });
  mkdirSync(cacheDir, { recursive: true });

  const paquets = [
    ['@expo-google-fonts/work-sans', FACES],
    ['@expo-google-fonts/cairo', FACES_AR],
  ] as const;

  for (const [paquet, faces] of paquets) {
    const source = paquetDir(paquet);
    for (const face of faces) {
      const from = join(source, face);
      const to = join(fontsDir, face.split('/')[1]!);
      if (!existsSync(from)) {
        throw new Error(
          `Police introuvable : ${from}. Le paquet ${paquet} est-il installé ?`,
        );
      }
      if (!existsSync(to)) copyFileSync(from, to);
    }
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

/** Une chaîne par écriture : l'arabe doit être éprouvé sur des glyphes arabes. */
const TEMOINS: Record<string, string> = {
  'Cairo ExtraBold': 'احجز طاولتك',
};
const TEMOIN_PAR_DEFAUT = 'Réservé ce soir';

/**
 * Vérifie qu'une famille est réellement utilisée, et à la bonne graisse.
 *
 * Deux contrôles, parce qu'il y a deux façons de rendre le mauvais texte :
 *
 * 1. **La famille n'est pas résolue.** On rend la même chaîne dans la famille
 *    voulue et dans une famille qui n'existe nulle part. Images identiques =
 *    la première a été servie par la police de repli du système.
 *
 * 2. **La graisse n'est pas honorée.** Depuis que le gabarit demande une
 *    famille et une graisse séparées, un moteur peut résoudre « Work Sans » et
 *    servir le Regular là où on demandait l'ExtraBold : le premier contrôle
 *    passerait, et le visuel sortirait en typographie fine sans que rien ne le
 *    signale. On compare donc aussi la graisse voulue au Regular de la même
 *    famille — elles doivent différer.
 *
 * Le témoin est écrit dans l'écriture de la famille : demander « Réservé ce
 * soir » à Cairo passerait même si Cairo n'avait pas un glyphe arabe.
 */
export async function assertPolicesDisponibles(
  sharp: typeof import('sharp'),
  family: string,
  weight: number,
): Promise<void> {
  const texte = TEMOINS[family] ?? TEMOINS[`${family} ExtraBold`] ?? TEMOIN_PAR_DEFAUT;
  const probe = async (famille: string, graisse: number = 400): Promise<number> => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="520" height="140">
      <rect width="520" height="140" fill="#000000"/>
      <text x="16" y="96" font-family="${famille}" font-weight="${graisse}" font-size="56" fill="#FFFFFF">${texte}</text>
    </svg>`;
    const { data } = await sharp(Buffer.from(svg))
      .greyscale()
      .raw()
      .toBuffer({ resolveWithObject: true });
    let lit = 0;
    for (const p of data) if (p > 200) lit++;
    return lit;
  };

  const [voulue, repli, regular] = await Promise.all([
    probe(family, weight),
    probe('Kairos Police Absente', weight),
    probe(family, 400),
  ]);

  const ou = `Vérifier FONTCONFIG_FILE (${process.env.FONTCONFIG_FILE ?? 'non posée'}), ` +
    "l'installation des paquets @expo-google-fonts, et — sur macOS, où le moteur " +
    'ignore fontconfig — la présence des .ttf dans ~/Library/Fonts.';

  if (voulue === repli) {
    throw new Error(
      `La famille « ${family} » n'est pas résolue : le rendu utiliserait la ` +
        `police de repli du système. ${ou}`,
    );
  }

  // Une graisse non honorée ne lève aucune erreur et ne se voit qu'à l'œil, sur
  // un visuel déjà publié. Si le 800 rend exactement le même dessin que le 400,
  // c'est que le moteur sert la même fonte pour les deux.
  if (weight !== 400 && voulue === regular) {
    throw new Error(
      `La graisse ${weight} de « ${family} » n'est pas honorée : le rendu est ` +
        `identique au Regular. Le visuel sortirait en typographie fine. ${ou}`,
    );
  }
}
