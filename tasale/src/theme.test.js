import { lightColors, darkColors } from './theme';

/** Luminance relative selon WCAG 2.1. */
function luminance(hex) {
  const c = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4]
    .map((i) => parseInt(c.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Rapport de contraste entre deux couleurs opaques, de 1:1 à 21:1. */
export function contrast(a, b) {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (high + 0.05) / (low + 0.05);
}

// Seuils WCAG 2.1
const AA_TEXTE = 4.5;
const AA_COMPOSANT = 3;

describe('contraste du thème clair', () => {
  it('le texte principal ressort sur le fond de page', () => {
    expect(contrast(lightColors.dark, lightColors.cream)).toBeGreaterThanOrEqual(AA_TEXTE);
  });

  it('l’encre de marque est lisible sur les cartes', () => {
    expect(contrast(lightColors.primaryInk, lightColors.surface)).toBeGreaterThanOrEqual(AA_TEXTE);
  });

  it('le blanc reste lisible sur les boutons pleins', () => {
    expect(contrast('#FFFFFF', lightColors.primary)).toBeGreaterThanOrEqual(AA_TEXTE);
  });

  it('l’encre vaut la couleur primaire : le thème clair ne dévie pas', () => {
    // Le correctif de lisibilité ne devait toucher que le thème sombre.
    expect(lightColors.primaryInk).toBe(lightColors.primary);
  });
});

describe('contraste du thème sombre', () => {
  it('le texte principal ressort sur le fond de page', () => {
    expect(contrast(darkColors.dark, darkColors.cream)).toBeGreaterThanOrEqual(AA_TEXTE);
  });

  it('l’encre de marque est lisible sur les cartes', () => {
    // C'est précisément le défaut corrigé : #0B6E5F n'y tenait que 2,33:1.
    expect(contrast(darkColors.primaryInk, darkColors.surface)).toBeGreaterThanOrEqual(AA_TEXTE);
  });

  it('l’encre de marque est lisible sur le fond de page', () => {
    expect(contrast(darkColors.primaryInk, darkColors.cream)).toBeGreaterThanOrEqual(AA_TEXTE);
  });

  it('la couleur primaire brute serait insuffisante en texte', () => {
    // Documente la raison d'être du token : sans lui, on repasse sous le seuil.
    expect(contrast(darkColors.primary, darkColors.surface)).toBeLessThan(AA_TEXTE);
  });

  it('le blanc reste lisible sur les boutons pleins', () => {
    // L'aplat garde #0B6E5F : l'éclaircir ferait tomber le blanc à 3,16:1.
    expect(contrast('#FFFFFF', darkColors.primary)).toBeGreaterThanOrEqual(AA_TEXTE);
  });

  it('les marques de graphique se détachent de la surface', () => {
    expect(contrast(darkColors.chartInk, darkColors.surface)).toBeGreaterThanOrEqual(AA_COMPOSANT);
  });

  it('le texte secondaire reste lisible', () => {
    expect(contrast(darkColors.warmGray, darkColors.surface)).toBeGreaterThanOrEqual(AA_COMPOSANT);
  });
});

describe('logo', () => {
  it('l’initiale se détache de son aplat', () => {
    // Glyphe de grande taille : le seuil des gros textes s'applique.
    expect(contrast(lightColors.logoInk, lightColors.logoBg)).toBeGreaterThanOrEqual(AA_COMPOSANT);
  });

  it('garde les mêmes couleurs dans les deux thèmes', () => {
    expect(darkColors.logoBg).toBe(lightColors.logoBg);
    expect(darkColors.logoInk).toBe(lightColors.logoInk);
  });
});
