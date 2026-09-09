/**
 * Rendu vidéo — Remotion.
 *
 * Jumeau de static.ts : mêmes entrées, même charte, autre moteur. Là où le
 * rendu statique compose un SVG au-dessus d'une photo avec Sharp, celui-ci
 * fait tourner un vrai Chromium sur une composition React et encode le
 * résultat en H.264.
 *
 * Deux choses coûtent cher et ne sont donc faites qu'une fois par processus :
 * la construction du paquet Remotion, et la vérification des polices. Une
 * campagne de sept restaurants ne doit pas les payer sept fois.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ici = dirname(fileURLToPath(import.meta.url));
const RACINE = join(ici, '..', '..');

export const LARGEUR = 1080;
export const HAUTEUR = 1920;
export const FPS = 30;
export const DUREE_SECONDES = 6;

/**
 * Chromium.
 *
 * Remotion télécharge le sien au premier rendu. Quand la machine en a déjà un
 * — un runner de CI, un conteneur avec Playwright — autant s'en servir :
 * 150 Mo et une minute de moins par environnement neuf.
 */
function chromium(): string | null {
  const impose = process.env.STUDIO_CHROMIUM?.trim();
  if (impose) return impose;

  const playwright = process.env.PLAYWRIGHT_BROWSERS_PATH?.trim();
  if (playwright) {
    // Le nom du dossier porte le numéro de révision, qui change à chaque
    // mise à jour de Playwright : on ne le code pas en dur.
    const candidats = ['chromium_headless_shell', 'chromium'];
    for (const prefixe of candidats) {
      try {
        const sortie = execFileSync('sh', [
          '-c',
          `ls -d ${playwright}/${prefixe}-*/chrome-linux/headless_shell ` +
            `${playwright}/${prefixe}-*/chrome-linux/chrome 2>/dev/null | head -1`,
        ])
          .toString()
          .trim();
        if (sortie && existsSync(sortie)) return sortie;
      } catch {
        // Rien trouvé pour ce préfixe : on essaie le suivant.
      }
    }
  }
  // null : Remotion se débrouille, quitte à télécharger.
  return null;
}

export interface VideoRenderInput {
  headline: string;
  subline: string;
  badge: string;
  cta: string;
  rating?: number | null;
  photoUrl?: string | null;
}

export interface VideoRenderResult {
  buffer: Buffer;
  mime: 'video/mp4';
  width: number;
  height: number;
  durationInFrames: number;
  fps: number;
  photoMissing: boolean;
}

let paquet: Promise<string> | null = null;

/** Construit le paquet Remotion une seule fois par processus. */
async function serveUrl(): Promise<string> {
  if (paquet) return paquet;

  paquet = (async () => {
    // Les polices doivent être dans remotion/public/ avant la construction :
    // le bundler les y sert, il ne va pas les chercher dans node_modules.
    await import(join(RACINE, 'prepare-fonts.mjs'));

    const { bundle } = await import('@remotion/bundler');
    return bundle({
      entryPoint: join(RACINE, 'remotion', 'index.ts'),
      // Sans ce chemin, Remotion cherche un `public/` à la racine du projet et
      // sert des 404 sur les polices — constaté : le rendu s'interrompt sur
      // « A network error occurred », ce qui est le bon comportement mais une
      // mauvaise piste. Le dossier vit à côté du point d'entrée, on le dit.
      publicDir: join(RACINE, 'remotion', 'public'),
    });
  })();

  return paquet;
}

export async function renderVideo(input: VideoRenderInput): Promise<VideoRenderResult> {
  const { selectComposition, renderMedia } = await import('@remotion/renderer');

  const url = await serveUrl();
  const browserExecutable = chromium();

  const inputProps = {
    headline: input.headline,
    subline: input.subline,
    badge: input.badge,
    cta: input.cta,
    rating: input.rating ?? null,
    photoUrl: input.photoUrl ?? null,
  };

  const composition = await selectComposition({
    serveUrl: url,
    id: 'mida-story',
    inputProps,
    browserExecutable,
  });

  const dossier = mkdtempSync(join(tmpdir(), 'kairos-studio-video-'));
  const fichier = join(dossier, 'story.mp4');

  try {
    await renderMedia({
      composition,
      serveUrl: url,
      codec: 'h264',
      outputLocation: fichier,
      inputProps,
      browserExecutable,
    });

    return {
      buffer: readFileSync(fichier),
      mime: 'video/mp4',
      width: composition.width,
      height: composition.height,
      durationInFrames: composition.durationInFrames,
      fps: composition.fps,
      photoMissing: !input.photoUrl,
    };
  } finally {
    rmSync(dossier, { recursive: true, force: true });
  }
}
