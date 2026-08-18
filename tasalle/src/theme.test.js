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

/**
 * Aplatit une couleur `rgba(...)` sur un fond opaque — les jetons de fond
 * du thème sombre (`goldLight`, `warningBg`, `dangerBg`, `accentLight`)
 * sont des rgba translucides (RN les compose nativement), que `luminance`
 * ne sait pas lire directement.
 */
function flatten(rgbaOrHex, bgHex) {
  const m = rgbaOrHex.match(/rgba\((\d+),(\d+),(\d+),([\d.]+)\)/);
  if (!m) return rgbaOrHex;
  const [, r, g, b, a] = m.map(Number);
  const bg = bgHex.replace('#', '');
  const [br, bgc, bb] = [0, 2, 4].map((i) => parseInt(bg.slice(i, i + 2), 16));
  const mix = (fg, bgv) => Math.round(fg * a + bgv * (1 - a));
  return '#' + [mix(r, br), mix(g, bgc), mix(b, bb)].map((v) => v.toString(16).padStart(2, '0')).join('');
}

describe('contraste du thème clair', () => {
  it('le texte principal ressort sur le fond de page', () => {
    expect(contrast(lightColors.dark, lightColors.cream)).toBeGreaterThanOrEqual(AA_TEXTE);
  });

  it('l’encre de marque est lisible sur les cartes', () => {
    expect(contrast(lightColors.primaryInk, lightColors.surface)).toBeGreaterThanOrEqual(AA_TEXTE);
  });

  /**
   * `.btn-primary { background: var(--color-accent); color: var(--color-bg) }`
   * — la recette réelle de Modernist, pas une réinterprétation : le libellé
   * tient le seuil composant/grand texte (3,76:1 ≥ 3) mais pas le seuil texte
   * de corps (< 4,5:1). Un bouton n'est pas du texte de paragraphe ; c'est
   * pour ça que `primaryInk` (même rouge, sur `surface`) existe séparément
   * pour tout ce qui doit vraiment s'écrire.
   */
  it('le libellé des boutons pleins tient le seuil composant', () => {
    expect(contrast(lightColors.onPrimary, lightColors.primary)).toBeGreaterThanOrEqual(AA_COMPOSANT);
    expect(contrast(lightColors.onPrimary, lightColors.primary)).toBeLessThan(AA_TEXTE);
  });

  /**
   * `primary` et `gold` sont littéralement la même valeur (--color-accent) —
   * le rouge vif de marque tient le seuil composant avec du blanc dessus
   * (4,20:1 ≥ 3) mais pas le seuil texte de corps (< 4,5:1).
   */
  it('l’or de marque en aplat ne suffit pas pour du texte de corps', () => {
    expect(contrast('#FFFFFF', lightColors.gold)).toBeGreaterThanOrEqual(AA_COMPOSANT);
    expect(contrast('#FFFFFF', lightColors.gold)).toBeLessThan(AA_TEXTE);
  });

  it('le rouge d’erreur tient dans ses deux rôles', () => {
    // Texte sur blanc et aplat portant du blanc : les deux au-dessus du seuil.
    expect(contrast(lightColors.accent, lightColors.surface)).toBeGreaterThanOrEqual(AA_TEXTE);
    expect(contrast('#FFFFFF', lightColors.accent)).toBeGreaterThanOrEqual(AA_TEXTE);
  });

  it('le secondaire est assez sombre pour servir de texte', () => {
    expect(contrast(lightColors.secondary, lightColors.surface)).toBeGreaterThanOrEqual(AA_TEXTE);
  });

  /**
   * Trois rouges, trois emplois, tous copiés d'une règle réelle de
   * styles.css :
   *   gold      — --color-accent, décor et grands éléments. Tient le seuil
   *               composant, pas le seuil texte de corps (test ci-dessus).
   *   goldMark  — --color-accent-600 (`:hover`), objets graphiques porteurs
   *               d'information (étoiles, barres). WCAG 2.1 §1.4.11 exige 3:1.
   *   goldText  — --color-accent-800 (`.tag-accent`'s vraie couleur de texte). 4,5:1.
   */
  it('l’or des objets graphiques atteint le seuil des composants', () => {
    expect(contrast(lightColors.goldMark, lightColors.surface)).toBeGreaterThanOrEqual(AA_COMPOSANT);
    // Y compris sur le fond pâle des puces et vignettes, où il est le plus mis
    // à l'épreuve.
    expect(contrast(lightColors.goldMark, lightColors.goldLight)).toBeGreaterThanOrEqual(AA_COMPOSANT);
  });

  it('l’or de marque tient le seuil composant sur la surface', () => {
    expect(contrast(lightColors.gold, lightColors.surface)).toBeGreaterThanOrEqual(AA_COMPOSANT);
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

  it('l’or des objets graphiques tient aussi sur fond sombre', () => {
    expect(contrast(darkColors.goldMark, darkColors.surface)).toBeGreaterThanOrEqual(AA_COMPOSANT);
    expect(contrast(darkColors.goldMark, darkColors.cream)).toBeGreaterThanOrEqual(AA_COMPOSANT);
  });

  it('les marques de graphique se détachent de la surface', () => {
    expect(contrast(darkColors.chartInk, darkColors.surface)).toBeGreaterThanOrEqual(AA_COMPOSANT);
  });

  it('le texte secondaire reste lisible', () => {
    expect(contrast(darkColors.warmGray, darkColors.surface)).toBeGreaterThanOrEqual(AA_COMPOSANT);
  });

  /**
   * Bug trouvé en device réel (18/08/2026) : `goldText`/`accent` reprenaient
   * tels quels du thème clair alors que leurs fonds (`goldLight`,
   * `warningBg`, `dangerBg`, `accentLight`) s'assombrissent en thème sombre
   * — le texte devenait quasi invisible (rouge sombre sur rouge quasi
   * noir). `goldText` est réinversé comme `primaryInk` ; `accent` garde son
   * rôle d'aplat plein (bouton "accent", badge de notif — texte blanc
   * dessus) et `accentInk` prend le rôle d'encre.
   */
  it('l’or de badge reste lisible sur ses propres fonds', () => {
    expect(contrast(darkColors.goldText, flatten(darkColors.goldLight, darkColors.cream))).toBeGreaterThanOrEqual(AA_TEXTE);
    expect(contrast(darkColors.goldText, flatten(darkColors.warningBg, darkColors.cream))).toBeGreaterThanOrEqual(AA_TEXTE);
  });

  it('l’encre d’erreur reste lisible sur ses propres fonds', () => {
    expect(contrast(darkColors.accentInk, flatten(darkColors.dangerBg, darkColors.cream))).toBeGreaterThanOrEqual(AA_TEXTE);
    expect(contrast(darkColors.accentInk, flatten(darkColors.accentLight, darkColors.cream))).toBeGreaterThanOrEqual(AA_TEXTE);
    expect(contrast(darkColors.accentInk, darkColors.surface)).toBeGreaterThanOrEqual(AA_TEXTE);
  });

  it('l’aplat "accent" reste assez sombre pour porter du blanc', () => {
    // MButton (variant="accent") et le badge de notif (HomeScreen) posent
    // du texte blanc en dur sur `accent` — il ne doit PAS suivre
    // l'inversion des autres rôles, contrairement à `accentInk`.
    expect(darkColors.accent).toBe(lightColors.accent);
    expect(contrast('#FFFFFF', darkColors.accent)).toBeGreaterThanOrEqual(AA_TEXTE);
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
   * L'encre du monogramme (--color-accent de Broadsheet, bleu pétrole) tient
   * le seuil composant sur fond clair (3,65:1 ≥ 3) mais pas le seuil texte
   * (< 4,5:1). Ce test fige la frontière : si quelqu'un promeut `logoInk` en
   * couleur de texte de corps, la marge dont il croit disposer n'existe pas,
   * et `goldText` est là pour ça.
   */
  it('l’or de la marque ne peut pas servir de couleur de texte de corps', () => {
    expect(contrast(lightColors.logoInk, lightColors.cream)).toBeGreaterThanOrEqual(AA_COMPOSANT);
    expect(contrast(lightColors.logoInk, lightColors.cream)).toBeLessThan(AA_TEXTE);
    expect(contrast(lightColors.goldText, lightColors.cream)).toBeGreaterThanOrEqual(AA_TEXTE);
  });

  it('le monogramme ressort sur le fond des icônes', () => {
    // Filet et lettres sur le crème de marque : seuil des composants.
    expect(contrast(lightColors.logoInk, darkColors.cream)).toBeGreaterThanOrEqual(AA_COMPOSANT);
  });
});
