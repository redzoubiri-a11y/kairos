// ─────────────────────────────────────────────────────────────
// Tasalle — Design System (spécifications §3)
// Toutes les valeurs de style de l'application viennent d'ici.
// Aucune couleur ni taille en dur ailleurs dans le code.
// ─────────────────────────────────────────────────────────────

// §3.1 — Tokens de couleur (thème clair)
export const lightColors = {
  // Primaires
  primary: '#0B6E5F',
  primaryLight: '#E8F5F2',
  primaryDark: '#084F44',

  // Secondaires
  secondary: '#C8956C',
  secondaryLight: '#FBF3EC',
  gold: '#D4A853',
  goldLight: '#FDF8EC',
  goldText: '#8B6914',

  // Accents
  accent: '#D94E3B',
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
  successBg: 'rgba(11,110,95,0.12)',
  warningBg: 'rgba(212,168,83,0.15)',
  dangerBg: 'rgba(217,78,59,0.12)',
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

  // `primary` remplit les boutons, `primaryInk` écrit dessus les surfaces.
  // Deux besoins opposés : un aplat veut être sombre pour porter du blanc,
  // un texte veut se détacher du fond. Sur fond clair, la même teinte fait
  // les deux (6,16:1 dans les deux sens) ; en thème sombre, non.
  primaryInk: '#0B6E5F',

  // Marques de graphique : même encre. Les séries sont mono-teinte —
  // l'identité est portée par les libellés, pas par la couleur, ce qui évite
  // une palette catégorielle dont les teintes chaudes (terracotta/or) sont
  // trop proches pour être distinguées (ΔE < 15 en vision normale).
  chartInk: '#0B6E5F',
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
  primaryLight: 'rgba(11,110,95,0.22)',
  secondaryLight: 'rgba(200,149,108,0.16)',
  goldLight: 'rgba(212,168,83,0.14)',
  accentLight: 'rgba(217,78,59,0.16)',
  skeleton: '#333333',

  // Émeraude éclairci pour tout ce qui s'écrit sur une surface sombre :
  // #0B6E5F n'y tient que 2,33:1, très en dessous du seuil de 4,5:1.
  // #14A38C atteint 4,54:1. Les aplats de bouton gardent #0B6E5F, sur
  // lequel le blanc reste à 6,16:1 — l'éclaircir le ferait tomber à 3,16:1.
  // C'est un écart assumé au §3.5, qui suppose les accents inchangés.
  primaryInk: '#14A38C',
  chartInk: '#14A38C',
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
