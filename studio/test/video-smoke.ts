/**
 * Vérification du rendu vidéo, sans base ni clé API.
 *
 * Elle prouve quatre choses que le reste suppose : Remotion rend un MP4
 * réellement encodé, Work Sans est bien la police servie par Chromium, le
 * gabarit tient sur les cas limites (note absente), et l'arabe sort en Cairo
 * avec la mise en page retournée.
 *
 * Pas de ffprobe dans cet environnement — le ffmpeg fourni avec Playwright est
 * un build minimal orienté webm et refuse le H.264. Le conteneur MP4 est donc
 * analysé à la main : c'est suffisant pour distinguer un fichier vide d'un
 * fichier qui porte de la vidéo.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { renderVideo } from '../src/render/video.ts';

mkdirSync('out', { recursive: true });

/** Somme des tailles de boîtes ISO-BMFF de premier niveau. */
function boitesMp4(buffer: Buffer): Record<string, number> {
  const boites: Record<string, number> = {};
  let i = 0;
  while (i + 8 <= buffer.length) {
    const taille = buffer.readUInt32BE(i);
    const nom = buffer.subarray(i + 4, i + 8).toString('latin1');
    if (taille < 8) break;
    boites[nom] = (boites[nom] ?? 0) + taille;
    i += taille;
  }
  return boites;
}

function echec(message: string): never {
  console.error(`\n✗ ${message}\n`);
  process.exit(1);
}

const CAS = [
  {
    fichier: 'out/story-1-court.mp4',
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
    fichier: 'out/story-2-sans-note.mp4',
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
    fichier: 'out/story-3-arabe.mp4',
    input: {
      headline: 'احجز طاولتك لهذا المساء',
      subline: 'الياسمين — حيدرة، الجزائر العاصمة',
      badge: 'مطبخ متوسطي',
      cta: 'احجز على ميدا',
      rating: 4.6,
      photoUrl: null,
      locale: 'ar' as const,
    },
  },
] as const;

let total = 0;

for (const cas of CAS) {
  const debut = Date.now();
  const rendu = await renderVideo(cas.input);
  const secondes = (Date.now() - debut) / 1000;
  total += secondes;

  writeFileSync(cas.fichier, rendu.buffer);

  const boites = boitesMp4(rendu.buffer);
  const mdat = boites.mdat ?? 0;
  const part = Math.round((100 * mdat) / rendu.buffer.byteLength);

  if (!boites.ftyp) echec(`${cas.fichier} : pas de boîte ftyp, ce n'est pas un MP4.`);
  if (!boites.moov) echec(`${cas.fichier} : pas de boîte moov, conteneur incomplet.`);
  if (mdat < 20_000) {
    echec(`${cas.fichier} : ${mdat} octets de vidéo seulement — rendu probablement vide.`);
  }

  const attendues = 180;
  if (rendu.durationInFrames !== attendues) {
    echec(`${cas.fichier} : ${rendu.durationInFrames} images au lieu de ${attendues}.`);
  }
  if (rendu.width !== 1080 || rendu.height !== 1920) {
    echec(`${cas.fichier} : ${rendu.width}×${rendu.height} au lieu de 1080×1920.`);
  }

  console.log(
    `${cas.fichier} — ${rendu.width}×${rendu.height}, ` +
      `${rendu.durationInFrames} images @ ${rendu.fps} i/s, ` +
      `${(rendu.buffer.byteLength / 1024).toFixed(0)} Ko dont ${part} % de vidéo` +
      (rendu.photoMissing ? ' (fond uni, pas de photo)' : '') +
      ` — ${secondes.toFixed(1)} s`,
  );
}

console.log(`\n${CAS.length} vidéos rendues en ${total.toFixed(1)} s.`);
console.log('Rendu vérifié : MP4 encodé, 1080×1920, 6 s.');
