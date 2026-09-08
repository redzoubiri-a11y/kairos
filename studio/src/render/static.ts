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
import { ensureFonts, assertWorkSansAvailable } from './fonts.ts';

const here = dirname(fileURLToPath(import.meta.url));

export const CANVAS = 1080;
const MARGIN = 72;
const CONTENT_WIDTH = CANVAS - MARGIN * 2;

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
        `<text x="${MARGIN}" y="${firstBaseline + i * HEADLINE_LEADING}">${escapeXml(line)}</text>`,
    )
    .join('');

  const badge = input.badge.toUpperCase();
  const badgeWidth = Math.round(
    Math.min(estimateWidth(badge, 24, 'semiBoldCaps', 1.2) + 56, 620),
  );

  const hasRating = typeof input.rating === 'number' && input.rating > 0;
  const ratingX = CANVAS - MARGIN - 132;

  const subline = wrapText(input.subline, 34, 'regular', CONTENT_WIDTH, 1)[0] ?? '';
  const cta = wrapText(input.cta, 28, 'semiBold', 620, 1)[0] ?? '';

  return applyConditionals(template, { rating: hasRating })
    .replace(/\{\{HEADLINE_LINES\}\}/g, headlineMarkup)
    .replace(/\{\{BADGE_WIDTH\}\}/g, String(badgeWidth))
    .replace(/\{\{BADGE_TEXT_X\}\}/g, String(MARGIN + 28))
    .replace(/\{\{BADGE_TEXT\}\}/g, escapeXml(badge))
    .replace(/\{\{RATING_X\}\}/g, String(ratingX))
    .replace(/\{\{RATING_TEXT_X\}\}/g, String(ratingX + 26))
    .replace(/\{\{RATING\}\}/g, hasRating ? input.rating!.toFixed(1).replace('.', ',') : '')
    .replace(/\{\{SUBLINE\}\}/g, escapeXml(subline))
    .replace(/\{\{CTA\}\}/g, escapeXml(cta));
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

let fontsChecked = false;

export async function renderStatic(
  input: StaticRenderInput,
): Promise<StaticRenderResult> {
  ensureFonts();
  // sharp n'est chargé qu'après : libvips lit FONTCONFIG_FILE à son
  // initialisation, et ne la relit jamais ensuite.
  const sharp = (await import('sharp')).default;

  if (!fontsChecked) {
    await assertWorkSansAvailable(sharp);
    fontsChecked = true;
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
