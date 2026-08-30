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

  it('le libellé des boutons pleins tient le seuil texte', () => {
    // Contrairement à Modernist, l'aplat primaire ici est noir (#1A1A1A) :
    // le blanc dessus tient très largement le seuil de texte, pas
    // seulement le seuil composant.
    expect(contrast(lightColors.onPrimary, lightColors.primary)).toBeGreaterThanOrEqual(AA_TEXTE);
  });

  /**
   * `gold` (= `logoInk`) ne tient NI le seuil composant NI le seuil texte
   * (2,63:1) — plus restrictif que Modernist : ce n'est pas un rouge de
   * marque utilisable en aplat texte, c'est une teinte de décor et de
   * logo, point. `goldText`/`primaryInk` existent séparément pour tout ce
   * qui doit vraiment s'écrire.
   */
  it('l’or de marque en aplat ne tient aucun des deux seuils', () => {
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

  /**
   * Trois ors, trois emplois (§2.1) :
   *   gold      — décor et logo uniquement. Ne tient aucun seuil (test ci-dessus).
   *   goldMark  — objets porteurs d'information (étoiles, barres). WCAG 2.1
   *               §1.4.11 exige 3:1.
   *   goldText  — texte doré, = `primaryInk`. 4,5:1.
   */
  it('l’or des objets graphiques atteint le seuil des composants', () => {
    expect(contrast(lightColors.goldMark, lightColors.surface)).toBeGreaterThanOrEqual(AA_COMPOSANT);
    // Y compris sur le fond pâle des puces et vignettes, où il est le plus mis
    // à l'épreuve.
    expect(contrast(lightColors.goldMark, lightColors.goldLight)).toBeGreaterThanOrEqual(AA_COMPOSANT);
  });

  it('les fonds pâles laissent lire l’encre de marque', () => {
    expect(contrast(lightColors.primaryInk, lightColors.primaryLight)).toBeGreaterThanOrEqual(AA_TEXTE);
  });

  /**
   * Angle mort révélé le 30/08/2026 : tous les tests ci-dessus mesurent sur
   * `surface`, le blanc des cartes. Le passage du fond de page à l'ivoire a
   * fait tomber le texte secondaire à 3,33:1 sur `surfaceElevated` sans
   * qu'aucun test ne bronche. Les trois fonds clairs sont désormais
   * éprouvés, en commençant par le plus sombre d'entre eux.
   */
  it('les textes tiennent sur les TROIS fonds clairs, pas seulement sur la carte', () => {
    const fonds = [lightColors.surface, lightColors.cream, lightColors.surfaceElevated];
    for (const fond of fonds) {
      expect(contrast(lightColors.dark, fond)).toBeGreaterThanOrEqual(AA_TEXTE);
      expect(contrast(lightColors.warmGray, fond)).toBeGreaterThanOrEqual(AA_TEXTE);
      expect(contrast(lightColors.secondary, fond)).toBeGreaterThanOrEqual(AA_TEXTE);
      expect(contrast(lightColors.primaryInk, fond)).toBeGreaterThanOrEqual(AA_TEXTE);
      expect(contrast(lightColors.accent, fond)).toBeGreaterThanOrEqual(AA_TEXTE);
    }
  });

  /**
   * `primary` n'est plus un aplat noir mais un or : il sert aussi de trait
   * (barre du Stepper) sur le fond de page, où il devient un objet porteur
   * d'information au sens de WCAG 1.4.11.
   */
  it('l’or d’aplat reste visible en trait sur le fond de page', () => {
    expect(contrast(lightColors.primary, lightColors.cream)).toBeGreaterThanOrEqual(AA_COMPOSANT);
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
   * `goldText` vaut littéralement `primaryInk` en thème clair — la doc
   * source (Claude Design, projet "Tasalle") ne redéfinit pas `goldText`
   * pour le thème sombre, mais cette identité doit tenir : sans
   * l'inversion, le texte doré se fondrait dans ses propres fonds
   * assombris (`goldLight`, `warningBg`).
   */
  it('l’or de badge reste lisible sur ses propres fonds', () => {
    expect(contrast(darkColors.goldText, flatten(darkColors.goldLight, darkColors.cream))).toBeGreaterThanOrEqual(AA_TEXTE);
    expect(contrast(darkColors.goldText, flatten(darkColors.warningBg, darkColors.cream))).toBeGreaterThanOrEqual(AA_TEXTE);
  });

  /**
   * Écart déclaré vis-à-vis de la doc source : celle-ci dit "accent reste
   * identique" en thème sombre, mais `accent` (#C0392B) tombe sous 3:1 sur
   * les fonds sombres (2,64:1 sur `surface`) — invisible en encre de texte
   * alors qu'il tient très bien comme aplat portant du blanc (test
   * suivant). `accentInk`, éclairci, porte le rôle d'encre séparément.
   */
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
   * L'or du monogramme (2,63:1 sur fond clair) ne tient même pas le seuil
   * composant — c'est un logotype exempté (WCAG 1.4.3), pas une couleur de
   * texte. `goldText` existe séparément pour tout ce qui doit vraiment
   * s'écrire, et lui tient largement le seuil texte.
   */
  it('l’or de la marque ne peut pas servir de couleur de texte de corps', () => {
    expect(contrast(lightColors.logoInk, lightColors.cream)).toBeLessThan(AA_COMPOSANT);
    expect(contrast(lightColors.goldText, lightColors.cream)).toBeGreaterThanOrEqual(AA_TEXTE);
  });

  it('le monogramme ressort sur le fond des icônes', () => {
    // Filet et lettres sur le fond sombre du thème inverse : seuil des
    // composants, l'or gagne même en lisibilité sur fond sombre (§2.3).
    expect(contrast(lightColors.logoInk, darkColors.cream)).toBeGreaterThanOrEqual(AA_COMPOSANT);
  });
});
