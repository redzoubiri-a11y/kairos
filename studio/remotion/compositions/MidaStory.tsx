/**
 * Gabarit vidéo Mida — 1080 × 1920, 6 s.
 *
 * Le format story/reel, celui qui compte sur Instagram et TikTok. Le pied est
 * remonté à 240 px du bas : c'est la bande où ces deux applications posent
 * leur propre interface, et un appel à l'action qui s'y cache ne sert à rien.
 *
 * Mêmes entrées que le gabarit statique (spec § 3.3) plus la durée : ce qui
 * tient dans un carré tient dans une story, l'inverse serait à démontrer.
 * Couleurs et polices : src/theme.js de Mida, à l'identique.
 *
 * Aucune image n'est fabriquée. La photo vient du restaurant, elle est
 * seulement recadrée et lentement rapprochée ; tout le reste est du texte et
 * des aplats.
 */

import React from 'react';
import { AbsoluteFill, Img, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { attendreWorkSans } from '../fonts';

export const DUREE_SECONDES = 6;
export const FPS = 30;
export const LARGEUR = 1080;
export const HAUTEUR = 1920;

const MARGE = 80;
/** Bande réservée à l'interface d'Instagram et TikTok. */
const PIED = 240;

/**
 * Alias et non interface : `Composition` de Remotion contraint ses props à
 * `Record<string, unknown>`, qu'un alias d'objet satisfait par signature
 * d'index implicite, jamais une interface.
 */
export type MidaStoryProps = {
  headline: string;
  subline: string;
  badge: string;
  cta: string;
  rating: number | null;
  photoUrl: string | null;
};

/**
 * Entrée décalée : chaque élément arrive après le précédent, jamais tous
 * ensemble. `opaciteMax` sert aux éléments qui ne doivent pas monter jusqu'à
 * l'opaque — la poser à part serait écrasée par ce que rend cette fonction.
 */
function apparition(frame: number, fps: number, retardSecondes: number, opaciteMax = 1) {
  const s = spring({
    frame: frame - retardSecondes * fps,
    fps,
    config: { damping: 200 },
    durationInFrames: 20,
  });
  return {
    opacity: s * opaciteMax,
    transform: `translateY(${interpolate(s, [0, 1], [24, 0])}px)`,
  };
}

export const MidaStory: React.FC<MidaStoryProps> = ({
  headline,
  subline,
  badge,
  cta,
  rating,
  photoUrl,
}) => {
  attendreWorkSans();

  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Rapprochement lent et continu : 4 % sur toute la durée. Assez pour que
  // l'image ne paraisse pas figée, assez peu pour ne pas distraire du texte.
  const zoom = interpolate(frame, [0, durationInFrames], [1, 1.04]);

  return (
    <AbsoluteFill style={{ backgroundColor: '#191919' }}>
      {photoUrl ? (
        <AbsoluteFill style={{ overflow: 'hidden' }}>
          <Img
            src={photoUrl}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: `scale(${zoom})`,
            }}
          />
        </AbsoluteFill>
      ) : null}

      {/* Deux voiles : le haut porte l'étiquette et la note, le bas tout le texte. */}
      <AbsoluteFill
        style={{
          background:
            'linear-gradient(to bottom, rgba(25,25,25,0.55) 0%, rgba(25,25,25,0) 22%, ' +
            'rgba(25,25,25,0) 38%, rgba(25,25,25,0.72) 62%, rgba(25,25,25,0.95) 100%)',
        }}
      />

      <AbsoluteFill style={{ padding: MARGE, paddingBottom: PIED }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div
            style={{
              backgroundColor: '#D8432B',
              color: '#FFFFFF',
              fontFamily: 'Work Sans SemiBold',
              fontSize: 30,
              letterSpacing: 1.4,
              padding: '16px 36px',
              borderRadius: 40,
              ...apparition(frame, fps, 0.1),
            }}
          >
            {badge.toUpperCase()}
          </div>

          {rating !== null && rating > 0 ? (
            <div
              style={{
                backgroundColor: 'rgba(25,25,25,0.72)',
                color: '#F5EDD6',
                fontFamily: 'Work Sans SemiBold',
                fontSize: 30,
                padding: '16px 30px',
                borderRadius: 40,
                ...apparition(frame, fps, 0.3),
              }}
            >
              ★ {rating.toFixed(1).replace('.', ',')}
            </div>
          ) : null}
        </div>

        <div style={{ flex: 1 }} />

        <div
          style={{
            color: '#FFFFFF',
            fontFamily: 'Work Sans ExtraBold',
            fontSize: 92,
            lineHeight: 1.08,
            ...apparition(frame, fps, 0.9),
          }}
        >
          {headline}
        </div>

        <div
          style={{
            color: '#F5F5F3',
            fontFamily: 'Work Sans Regular',
            fontSize: 40,
            marginTop: 28,
            ...apparition(frame, fps, 1.4, 0.88),
          }}
        >
          {subline}
        </div>

        <div
          style={{
            height: 2,
            backgroundColor: 'rgba(245,245,243,0.22)',
            marginTop: 44,
            ...apparition(frame, fps, 1.8),
          }}
        />

        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            marginTop: 36,
            ...apparition(frame, fps, 2.0),
          }}
        >
          <div style={{ color: '#D8432B', fontFamily: 'Work Sans ExtraBold', fontSize: 48 }}>
            mida
          </div>
          <div style={{ color: '#F5F5F3', fontFamily: 'Work Sans SemiBold', fontSize: 34 }}>
            {cta}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
