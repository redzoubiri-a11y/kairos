import { describe, expect, it } from 'vitest';

import {
  LIVE_POSITION_MINUTES,
  formatDistance,
  formatPrice,
  formatWeight,
  initials,
  isPositionLive,
} from './format';

function minutesAgo(minutes) {
  return new Date(Date.now() - minutes * 60000).toISOString();
}

describe('fraicheur de position', () => {
  it('considere en direct une position toute recente', () => {
    expect(isPositionLive(minutesAgo(1))).toBe(true);
  });

  it('bascule hors direct au-dela du seuil', () => {
    expect(isPositionLive(minutesAgo(LIVE_POSITION_MINUTES + 1))).toBe(false);
  });

  it('accepte une position pile sur le seuil', () => {
    // Une seconde de marge : le test ne doit pas dependre de la duree d'execution.
    expect(isPositionLive(minutesAgo(LIVE_POSITION_MINUTES - 0.02))).toBe(true);
  });

  // Un camion declare sans position ne doit pas passer pour un camion qui roule.
  it('traite une position absente comme non diffusee', () => {
    expect(isPositionLive(null)).toBe(false);
    expect(isPositionLive(undefined)).toBe(false);
  });
});

describe('formatage', () => {
  it('bascule les kilos en tonnes au-dela de la tonne', () => {
    expect(formatWeight(3500)).toMatch(/3,5\s*t/);
    expect(formatWeight(800)).toMatch(/800\s*kg/);
  });

  it('bascule les kilometres en metres en dessous du kilometre', () => {
    expect(formatDistance(0.4)).toBe('400 m');
    expect(formatDistance(12.34)).toMatch(/12,3\s*km/);
  });

  it('ne montre pas de distance quand elle est inconnue', () => {
    expect(formatDistance(null)).toBe('');
    expect(formatDistance(undefined)).toBe('');
  });

  // Un prix absent veut dire « a discuter », pas « gratuit ».
  it('distingue un prix absent d un prix nul', () => {
    expect(formatPrice(null)).toBe('A negocier');
    expect(formatPrice(0)).toMatch(/0\s*DA/);
  });

  it('reduit un nom a deux initiales', () => {
    expect(initials('Karim Benali')).toBe('KB');
    expect(initials('Sofiane')).toBe('S');
    expect(initials('')).toBe('');
  });
});
