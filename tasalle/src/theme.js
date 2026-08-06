// ─────────────────────────────────────────────────────────────
// Tasalle — Design System (spécifications §3)
// Toutes les valeurs de style de l'application viennent d'ici.
// Aucune couleur ni taille en dur ailleurs dans le code.
// ─────────────────────────────────────────────────────────────

// §3.1 — Tokens de couleur (thème clair)
//
// La palette est celle du logo : noir et or. L'émeraude d'origine du cahier
// des charges a été écartée — la marque ne la porte pas.
//
// L'or de marque, #BE9A5E, ne peut pas tout faire : il ne fait que 2,63:1 sur
// blanc. Il décore, il n'écrit pas. D'où trois jetons distincts là où le vert
// n'en demandait qu'un :
//   · `primary`    — les aplats. Le noir du mot-symbole, blanc dessus à 17,4:1.
//   · `primaryInk` — ce qui s'écrit : or profond #8B6914, 5,09:1 sur blanc.
//   · `gold`       — l'or de marque lui-même, décor et logo uniquement.
export const lightColors = {
  // Primaires — le noir du mot-symbole
  primary: '#1A1A1A',
  primaryLight: '#F7F2E8',
  primaryDark: '#000000',
  /** Ce qui s'inscrit sur un aplat primaire. */
  onPrimary: '#FFFFFF',

  // Secondaires — brun doré, assez sombre pour servir aussi de texte (4,77:1)
  secondary: '#8C6D4A',
  secondaryLight: '#F6F0E7',
  gold: '#BE9A5E',
  goldLight: '#FAF5EC',
  goldText: '#8B6914',
  // Or des objets graphiques porteurs d'information — les étoiles de notation
  // au premier chef. `gold` ne fait que 2,63:1 sur blanc, sous le seuil de
  // 3:1 que WCAG 2.1 (1.4.11) demande à un élément non textuel dont la forme
  // véhicule une donnée. Celui-ci atteint 3,49:1 tout en restant de l'or.
  goldMark: '#A8834A',

  // Accents — le rouge d'erreur est assombri de #D94E3B à #C0392B : l'ancien
  // ne faisait que 4,12:1, sous le seuil, aussi bien en texte sur blanc qu'en
  // aplat portant du blanc. Le nouveau tient 5,44:1 dans les deux rôles.
  accent: '#C0392B',
  accentLight: '#FDECEA',
  info: '#3B82F6',

  // Neutres
  dark: '#1A1A1A',
  warmGray: '#8B7E72',
  border: '#E8E4DF',
  // Fond de page blanc. Les cartes sont blanches elles aussi : leur contour
  // 1px les détache, conformément à la définition de carte du §3.3.
  cream: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceElevated: '#FAFAF8',

  // Dérivés (badges, overlays)
  successBg: 'rgba(139,105,20,0.10)',
  warningBg: 'rgba(190,154,94,0.18)',
  dangerBg: 'rgba(192,57,43,0.12)',
  infoBg: 'rgba(59,130,246,0.12)',
  overlay: 'rgba(0,0,0,0.55)',
  skeleton: '#EFEBE5',

  // Logo : monogramme TS et filet circulaire dans l'or de la marque, sur fond
  // libre — le mot-symbole ne porte plus de pavé coloré.
  //
  // Cet or ne fait que 2,63:1 sur blanc. C'est délibéré et sans conséquence :
  // WCAG 2.1 exempte les logotypes du critère de contraste (1.4.3). Il ne doit
  // en revanche JAMAIS servir de couleur de texte d'interface — `goldText`
  // (#8B6914, 5,09:1) est là pour ça.
  logoInk: '#BE9A5E',
  // Le mot-symbole reste dans l'encre du texte : c'est lui qui porte la
  // lisibilité de la marque, et il passe partout.
  logoWordmark: '#1A1A1A',
  // Fond des icônes d'application et de l'écran de lancement : le crème du
  // document de marque, que les écrans de l'app n'utilisent plus.
  logoCanvas: '#F1EFEA',

  // L'or qui s'écrit : texte, icônes, onglet actif, montants. 5,09:1 sur
  // blanc, là où l'or de marque n'atteint que 2,63:1.
  primaryInk: '#8B6914',

  // Marques de graphique : même encre. Les séries sont mono-teinte —
  // l'identité est portée par les libellés, pas par la couleur, ce qui évite
  // une palette catégorielle dont les teintes chaudes (or, brun doré) sont
  // trop proches pour être distinguées (ΔE < 15 en vision normale).
  chartInk: '#8B6914',
  chartGrid: 'rgba(26,26,26,0.08)',
};

// §3.5 — Dark mode : seuls les neutres changent, les accents restent identiques
export const darkColors = {
  ...lightColors,
  dark: '#FFFFFF',
  surface: '#2A2A2A',
  surfaceElevated: '#1A1A1A',
  border: '#3A3A3A',
  cream: '#1A1A1A',
  warmGray: '#A9A099',
  primaryLight: 'rgba(190,154,94,0.20)',
  secondaryLight: 'rgba(190,154,94,0.14)',
  goldLight: 'rgba(190,154,94,0.14)',
  accentLight: 'rgba(192,57,43,0.20)',
  successBg: 'rgba(190,154,94,0.18)',
  warningBg: 'rgba(190,154,94,0.18)',
  skeleton: '#333333',

  // Les rôles s'inversent. En thème clair l'aplat est noir et l'or écrit ;
  // sur fond sombre un aplat noir disparaîtrait, alors c'est l'or de marque
  // qui remplit — et le noir qui s'y inscrit (6,61:1). L'or devient aussi
  // lisible en texte (6,61:1 sur le fond, 5,45:1 sur les cartes), ce qu'il
  // n'est pas sur blanc.
  primary: '#BE9A5E',
  primaryDark: '#A8834A',
  onPrimary: '#1A1A1A',
  primaryInk: '#BE9A5E',
  secondary: '#C9A96A',
  // Sur fond sombre, l'or de marque dépasse largement le seuil : les étoiles
  // reprennent la teinte pleine.
  goldMark: '#BE9A5E',
  chartInk: '#BE9A5E',
  chartGrid: 'rgba(255,255,255,0.10)',

  // Le mot-symbole s'inverse : noir sur crème devient blanc sur fond sombre.
  // Le monogramme, lui, garde son or — il y gagne même (6,61:1).
  logoWordmark: '#FFFFFF',
  logoCanvas: '#1A1A1A',
  // `logoInk` n'est pas redéfini : le monogramme garde le même or dans les
  // deux thèmes, comme toute marque.
};

// §3.2 — Typographie (police système uniquement)
export const typography = {
  hero: { fontSize: 42, fontWeight: '500', lineHeight: 46 },
  h1: { fontSize: 32, fontWeight: '500', lineHeight: 37 },
  h2: { fontSize: 24, fontWeight: '500', lineHeight: 29 },
  h3: { fontSize: 20, fontWeight: '500', lineHeight: 26 },
  title: { fontSize: 17, fontWeight: '500', lineHeight: 24 },
  body: { fontSize: 16, fontWeight: '400', lineHeight: 24 },
  secondary: { fontSize: 14, fontWeight: '400', lineHeight: 21 },
  caption: { fontSize: 12, fontWeight: '500', lineHeight: 17 },
};

// §3.4 — Spacing
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

// §3.4 — Radii
export const radii = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 10,
  xl: 12,
  xxl: 16,
  pill: 999,
};

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  sticky: {
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -2 },
    elevation: 8,
  },
};

// Hauteurs de référence issues des specs (§4.1 carte salle, §5.1 sidebar)
export const sizes = {
  cardPhoto: 140,
  rowPhoto: 140,
  galleryHeight: 260,
  avatar: 40,
  tabBar: 62,
};

export default { lightColors, darkColors, typography, spacing, radii, shadows, sizes };
