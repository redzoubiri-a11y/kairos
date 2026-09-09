/**
 * Rendu du visuel statique — Sharp.
 *
 * Le principe : la photo du restaurant est le fond, le gabarit SVG est la
 * couche du dessus. Aucune image n'est fabriquée, seulement recadrée et
 * assombrie ; les seuls pixels ajoutés sont du texte et des aplats.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ensureFonts, assertPolicesDisponibles } from './fonts.ts';
import type { Locale } from '../types.ts';

const here = dirname(fileURLToPath(import.meta.url));

export const CANVAS = 1080;
const MARGIN = 72;
const CONTENT_WIDTH = CANVAS - MARGIN * 2;

/**
 * Work Sans n'a aucun glyphe arabe : demandée sur de l'arabe, elle ne produit
 * pas d'erreur, fontconfig sert autre chose et le visuel sort en tofu ou dans
 * une police de système. Cairo couvre l'arabe et le latin, et vient du même
 * paquet @expo-google-fonts que celui qu'utilise déjà l'application.
 */
const POLICES = {
  fr: { xb: 'Work Sans ExtraBold', sb: 'Work Sans SemiBold', rg: 'Work Sans Regular' },
  ar: { xb: 'Cairo ExtraBold', sb: 'Cairo SemiBold', rg: 'Cairo Regular' },
} as const;

/**
 * Géométrie du sens de lecture. Le gabarit est symétrique : le code lui donne
 * de quel côté commence la ligne, et tout suit.
 */
function sensDeLecture(locale: Locale) {
  const rtl = locale === 'ar';
  return {
    rtl,
    /** Bord où commence la lecture — gauche en français, droite en arabe. */
    debutX: rtl ? CANVAS - MARGIN : MARGIN,
    finX: rtl ? MARGIN : CANVAS - MARGIN,
    ancreDebut: rtl ? 'end' : 'start',
    ancreFin: rtl ? 'start' : 'end',
  } as const;
}

/** Ligne de base de la DERNIÈRE ligne de titre. Le bloc grandit vers le haut. */
const HEADLINE_BASELINE = 796;
const HEADLINE_SIZE = 76;
const HEADLINE_LEADING = 88;
const MAX_HEADLINE_LINES = 2;

/**
 * Largeurs de glyphe approchées, en fraction de la taille de police.
 *
 * librsvg n'expose pas de mesure de texte à l'appelant : pour couper une ligne
 * il faut estimer. Ces valeurs viennent des métriques moyennes de Work Sans sur
 * du français courant. Elles sont volontairement un peu larges — mieux vaut
 * couper une ligne trop tôt que déborder du carré.
 *
 * Elles valent aussi pour l'arabe, ce qui n'allait pas de soi : les lettres se
 * lient, donc la largeur rendue n'est pas la somme des glyphes isolés. Mesuré
 * plutôt que supposé — largeur d'encre sur cinq phrases arabes en Cairo
 * ExtraBold à 76 px : facteur 0,485 à 0,521, contre 0,486 à 0,514 pour trois
 * phrases françaises en Work Sans ExtraBold. Le 0,58 garde donc sa marge dans
 * les deux langues. C'est peu d'échantillons : la contrainte de longueur du
 * schéma de sortie reste le vrai garde-fou.
 */
const ADVANCE = {
  extraBold: 0.58,
  semiBold: 0.55,
  regular: 0.53,
  /** Les capitales sont nettement plus larges — l'étiquette est en capitales. */
  semiBoldCaps: 0.7,
} as const;

const estimateWidth = (
  text: string,
  size: number,
  weight: keyof typeof ADVANCE,
  letterSpacing = 0,
): number => text.length * (size * ADVANCE[weight] + letterSpacing);

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Coupe sur les espaces, jamais au milieu d'un mot.
 * Si le texte ne tient pas en `maxLines`, la dernière ligne est tronquée avec
 * une ellipse : un titre coupé net se voit, un titre qui déborde se voit plus.
 */
export function wrapText(
  text: string,
  size: number,
  weight: keyof typeof ADVANCE,
  maxWidth: number,
  maxLines: number,
): string[] {
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (estimateWidth(candidate, size, weight) <= maxWidth || current === '') {
      current = candidate;
    } else {
      lines.push(current);
      current = word;
      if (lines.length === maxLines) break;
    }
  }
  if (current && lines.length < maxLines) lines.push(current);

  if (lines.length === maxLines) {
    const consumed = lines.join(' ').length;
    if (consumed < text.trim().length) {
      const last = lines[maxLines - 1]!;
      lines[maxLines - 1] = last.replace(/[\s.,;:]+$/, '') + '…';
    }
  }
  return lines;
}

export interface StaticRenderInput {
  headline: string;
  subline: string;
  badge: string;
  cta: string;
  /** Note moyenne sur 5. Le bloc disparaît du visuel si elle manque. */
  rating?: number | null;
  /** URL de la photo de couverture. Absente : fond uni de la charte. */
  photoUrl?: string | null;
  /** Décide la police et le sens de lecture. Français par défaut. */
  locale?: Locale;
}

export interface StaticRenderResult {
  buffer: Buffer;
  mime: 'image/jpeg';
  width: number;
  height: number;
  /** Vrai si aucune photo n'a pu être posée — le visuel est alors sur fond uni. */
  photoMissing: boolean;
}

/** Retire les régions <!--#if:nom--> … <!--/if:nom--> quand la donnée manque. */
function applyConditionals(svg: string, present: Record<string, boolean>): string {
  let out = svg;
  for (const [name, keep] of Object.entries(present)) {
    const region = new RegExp(
      `<!--#if:${name}-->[\\s\\S]*?<!--/if:${name}-->`,
      'g',
    );
    out = keep
      ? out.replace(new RegExp(`<!--/?#?if:${name}-->`, 'g'), '')
      : out.replace(region, '');
  }
  // Les balises d'ouverture conservées ci-dessus laissent leurs marqueurs.
  return out.replace(/<!--#if:[a-z]+-->|<!--\/if:[a-z]+-->/g, '');
}

function buildOverlay(input: StaticRenderInput): string {
  const template = readFileSync(join(here, 'templates', 'mida-square.svg'), 'utf8');
  const locale: Locale = input.locale ?? 'fr';
  const police = POLICES[locale];
  const sens = sensDeLecture(locale);

  const headlineLines = wrapText(
    input.headline,
    HEADLINE_SIZE,
    'extraBold',
    CONTENT_WIDTH,
    MAX_HEADLINE_LINES,
  );

  // Le bloc est calé sur sa dernière ligne : le pied de la composition ne bouge
  // pas, qu'il y ait une ligne ou deux.
  const firstBaseline =
    HEADLINE_BASELINE - (headlineLines.length - 1) * HEADLINE_LEADING;

  const headlineMarkup = headlineLines
    .map(
      (line, i) =>
        `<text x="${sens.debutX}" y="${firstBaseline + i * HEADLINE_LEADING}">${escapeXml(line)}</text>`,
    )
    .join('');

  // L'arabe n'a pas de casse : toUpperCase() n'y ferait rien, mais le dire
  // évite de croire plus tard que l'étiquette arabe a perdu ses capitales.
  const badge = locale === 'ar' ? input.badge : input.badge.toUpperCase();
  const badgeWidth = Math.round(
    Math.min(
      estimateWidth(badge, 24, locale === 'ar' ? 'semiBold' : 'semiBoldCaps', 1.2) + 56,
      620,
    ),
  );
  const badgeX = sens.rtl ? CANVAS - MARGIN - badgeWidth : MARGIN;
  const badgeTexteX = sens.rtl ? badgeX + badgeWidth - 28 : badgeX + 28;

  const hasRating = typeof input.rating === 'number' && input.rating > 0;
  // La note occupe le coin opposé à l'étiquette, quel que soit le sens.
  const ratingX = sens.rtl ? MARGIN : CANVAS - MARGIN - 132;

  // L'étoile se place du côté où commence la lecture. Le <text> n'a pas de
  // contexte bidirectionnel — un caractère neutre suivi d'un nombre reste en
  // ordre latin — donc on l'ordonne à la main, pour que l'image dise la même
  // chose que la vidéo, où Chromium le fait tout seul.
  const note = hasRating ? input.rating!.toFixed(1).replace('.', ',') : '';
  const ratingTexte = sens.rtl ? `${note} ★` : `★ ${note}`;

  const subline = wrapText(input.subline, 34, 'regular', CONTENT_WIDTH, 1)[0] ?? '';
  const cta = wrapText(input.cta, 28, 'semiBold', 620, 1)[0] ?? '';

  const svg = applyConditionals(template, { rating: hasRating })
    .replace(/\{\{FONT_XB\}\}/g, police.xb)
    .replace(/\{\{FONT_SB\}\}/g, police.sb)
    .replace(/\{\{FONT_RG\}\}/g, police.rg)
    .replace(/\{\{HEADLINE_LINES\}\}/g, headlineMarkup)
    .replace(/\{\{BADGE_WIDTH\}\}/g, String(badgeWidth))
    .replace(/\{\{BADGE_X\}\}/g, String(badgeX))
    .replace(/\{\{BADGE_TEXT_X\}\}/g, String(badgeTexteX))
    .replace(/\{\{BADGE_TEXT\}\}/g, escapeXml(badge))
    .replace(/\{\{RATING_X\}\}/g, String(ratingX))
    .replace(/\{\{RATING_TEXT_X\}\}/g, String(ratingX + 26))
    .replace(/\{\{RATING_TEXTE\}\}/g, ratingTexte)
    .replace(/\{\{SUBLINE\}\}/g, escapeXml(subline))
    .replace(/\{\{TEXT_X\}\}/g, String(sens.debutX))
    .replace(/\{\{TEXT_ANCHOR\}\}/g, sens.ancreDebut)
    .replace(/\{\{CTA_X\}\}/g, String(sens.finX))
    .replace(/\{\{CTA_ANCHOR\}\}/g, sens.ancreFin)
    .replace(/\{\{CTA\}\}/g, escapeXml(cta));

  // Garde-fou. direction="rtl" sur un <text> ne lève pas d'erreur dans librsvg :
  // il ne rend qu'un seul glyphe et le reste de la phrase disparaît. Mesuré sur
  // « احجز طاولتك هذا المساء » — 485 pixels allumés avec l'attribut, 11 890 sans.
  // Pango applique déjà le bidirectionnel d'après les caractères ; l'alignement
  // passe par text-anchor, jamais par direction.
  // Les commentaires XML sont retirés avant le contrôle : l'en-tête du gabarit
  // énonce l'interdiction, et se ferait prendre par sa propre règle.
  const sansCommentaires = svg.replace(/<!--[\s\S]*?-->/g, '');
  if (
    /\bdirection\s*=\s*"rtl"/.test(sansCommentaires) ||
    /direction\s*:\s*rtl/.test(sansCommentaires)
  ) {
    throw new Error(
      'Le gabarit pose direction="rtl" : librsvg n\'en rendrait qu\'un glyphe. ' +
        "Utiliser text-anchor pour l'alignement.",
    );
  }

  const restants = svg.match(/\{\{[A-Z_]+\}\}/g);
  if (restants) {
    throw new Error(`Jetons non remplacés dans le gabarit : ${[...new Set(restants)].join(', ')}`);
  }

  return svg;
}

const MAX_PHOTO_BYTES = 20 * 1024 * 1024;

async function fetchPhoto(url: string): Promise<Buffer | null> {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(15_000) });
    if (!response.ok) return null;
    const type = response.headers.get('content-type') ?? '';
    if (!type.startsWith('image/')) return null;
    const bytes = Buffer.from(await response.arrayBuffer());
    return bytes.byteLength > 0 && bytes.byteLength <= MAX_PHOTO_BYTES ? bytes : null;
  } catch {
    // Une photo injoignable ne doit pas faire tomber la campagne entière :
    // le visuel sortira sur fond uni, et l'appelant le saura par photoMissing.
    return null;
  }
}

const fontsChecked = new Set<Locale>();

export async function renderStatic(
  input: StaticRenderInput,
): Promise<StaticRenderResult> {
  ensureFonts();
  // sharp n'est chargé qu'après : libvips lit FONTCONFIG_FILE à son
  // initialisation, et ne la relit jamais ensuite.
  const sharp = (await import('sharp')).default;

  const locale: Locale = input.locale ?? 'fr';
  if (!fontsChecked.has(locale)) {
    await assertPolicesDisponibles(sharp, POLICES[locale].xb);
    fontsChecked.add(locale);
  }

  const photo = input.photoUrl ? await fetchPhoto(input.photoUrl) : null;

  const base = photo
    ? sharp(photo).resize(CANVAS, CANVAS, { fit: 'cover', position: 'attention' })
    : sharp({
        create: {
          width: CANVAS,
          height: CANVAS,
          channels: 3,
          background: '#191919',
        },
      });

  const buffer = await base
    .composite([{ input: Buffer.from(buildOverlay(input)), top: 0, left: 0 }])
    .jpeg({ quality: 88, chromaSubsampling: '4:4:4' })
    .toBuffer();

  return {
    buffer,
    mime: 'image/jpeg',
    width: CANVAS,
    height: CANVAS,
    photoMissing: photo === null,
  };
}
