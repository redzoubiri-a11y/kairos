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

  it('le libellé des boutons pleins est lisible', () => {
    expect(contrast(lightColors.onPrimary, lightColors.primary)).toBeGreaterThanOrEqual(AA_TEXTE);
  });

  /**
   * L'or de la marque ne peut pas remplir un bouton : le blanc n'y tiendrait
   * que 2,63:1. C'est la raison d'être des trois jetons — `primary` remplit
   * (noir), `primaryInk` écrit (or profond), `gold` décore.
   */
  it('l’or de marque en aplat porterait un libellé illisible', () => {
    expect(contrast('#FFFFFF', lightColors.gold)).toBeLessThan(AA_COMPOSANT);
  });

  it('le rouge d’erreur tient dans ses deux rôles', () => {
    // Texte sur blanc et aplat portant du blanc : les deux au-dessus du seuil.
    expect(contrast(lightColors.accent, lightColors.surface)).toBeGreaterThanOrEqual(AA_TEXTE);
    expect(contrast('#FFFFFF', lightColors.accent)).toBeGreaterThanOrEqual(AA_TEXTE);
  });

  it('le secondaire est assez sombre pour servir de texte', () => {
    expect(contrast(lightColors.secondary, lightColors.surface)).toBeGreaterThanOrEqual(AA_TEXTE);
  });

  it('les fonds pâles laissent lire l’encre de marque', () => {
    expect(contrast(lightColors.primaryInk, lightColors.primaryLight)).toBeGreaterThanOrEqual(AA_TEXTE);
  });
});

describe('contraste du thème sombre', () => {
  it('le texte principal ressort sur le fond de page', () => {
    expect(contrast(darkColors.dark, darkColors.cream)).toBeGreaterThanOrEqual(AA_TEXTE);
  });

  it('l’encre de marque est lisible sur les cartes', () => {
    expect(contrast(darkColors.primaryInk, darkColors.surface)).toBeGreaterThanOrEqual(AA_TEXTE);
  });

  it('l’encre de marque est lisible sur le fond de page', () => {
    expect(contrast(darkColors.primaryInk, darkColors.cream)).toBeGreaterThanOrEqual(AA_TEXTE);
  });

  /**
   * Les rôles s'inversent d'un thème à l'autre : sur fond sombre l'aplat noir
   * disparaîtrait, c'est donc l'or qui remplit et le noir qui s'y inscrit.
   * `onPrimary` existe pour que le libellé suive, au lieu d'être blanc en dur
   * — ce qui donnerait 2,63:1 sur l'or.
   */
  it('le libellé des boutons pleins suit l’inversion', () => {
    expect(contrast(darkColors.onPrimary, darkColors.primary)).toBeGreaterThanOrEqual(AA_TEXTE);
    expect(darkColors.onPrimary).not.toBe(lightColors.onPrimary);
  });

  it('un libellé blanc en dur y serait illisible', () => {
    expect(contrast('#FFFFFF', darkColors.primary)).toBeLessThan(AA_COMPOSANT);
  });

  it('les marques de graphique se détachent de la surface', () => {
    expect(contrast(darkColors.chartInk, darkColors.surface)).toBeGreaterThanOrEqual(AA_COMPOSANT);
  });

  it('le texte secondaire reste lisible', () => {
    expect(contrast(darkColors.warmGray, darkColors.surface)).toBeGreaterThanOrEqual(AA_COMPOSANT);
  });
});

describe('logo', () => {
  it('le monogramme garde le même or dans les deux thèmes', () => {
    // Une marque ne change pas de couleur avec l'apparence de l'interface.
    expect(darkColors.logoInk).toBe(lightColors.logoInk);
  });

  it('le mot-symbole s’inverse pour rester lisible', () => {
    expect(contrast(lightColors.logoWordmark, lightColors.cream)).toBeGreaterThanOrEqual(AA_TEXTE);
    expect(contrast(darkColors.logoWordmark, darkColors.cream)).toBeGreaterThanOrEqual(AA_TEXTE);
  });

  /**
   * L'or de la marque ne passe aucun seuil sur fond clair (2,63:1). C'est
   * admis pour un logotype, que WCAG 2.1 exempte explicitement (1.4.3) — mais
   * seulement pour lui. Ce test fige la frontière : si quelqu'un promeut
   * `logoInk` en couleur de texte, la marge dont il croit disposer n'existe
   * pas, et `goldText` est là pour ça.
   */
  it('l’or de la marque ne peut pas servir de couleur de texte', () => {
    expect(contrast(lightColors.logoInk, lightColors.cream)).toBeLessThan(AA_COMPOSANT);
    expect(contrast(lightColors.goldText, lightColors.cream)).toBeGreaterThanOrEqual(AA_TEXTE);
  });

  it('le monogramme ressort sur le fond des icônes', () => {
    // Filet et lettres sur le crème de marque : seuil des composants.
    expect(contrast(lightColors.logoInk, darkColors.cream)).toBeGreaterThanOrEqual(AA_COMPOSANT);
  });
});
