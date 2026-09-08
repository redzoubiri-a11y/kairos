/**
 * Les compositions que le studio sait rendre.
 *
 * Une seule pour l'instant. Les valeurs par défaut ne servent qu'à l'aperçu
 * (`npx remotion studio`) : en production, tout vient du générateur de texte.
 */

import React from 'react';
import { Composition } from 'remotion';
import {
  MidaStory,
  DUREE_SECONDES,
  FPS,
  LARGEUR,
  HAUTEUR,
  type MidaStoryProps,
} from './compositions/MidaStory';

export const Root: React.FC = () => (
  <Composition
    id="mida-story"
    component={MidaStory}
    durationInFrames={DUREE_SECONDES * FPS}
    fps={FPS}
    width={LARGEUR}
    height={HAUTEUR}
    defaultProps={
      {
        headline: 'La terrasse ouvre ce soir',
        subline: 'Le Jasmin — Hydra, Alger',
        badge: 'Terrasse',
        cta: 'Réserver sur Mida',
        rating: 4.6,
        photoUrl: null,
      } satisfies MidaStoryProps
    }
  />
);
