// ─────────────────────────────────────────────────────────────
// Tasale — Design System (spécifications §3)
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

  // Marques de graphique. Les séries sont mono-teinte : l'identité est portée
  // par les libellés de ligne, pas par la couleur, ce qui évite une palette
  // catégorielle dont les teintes chaudes (terracotta/or) sont trop proches
  // pour être distinguées (ΔE < 15 en vision normale).
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

  // Émeraude éclairci : #0B6E5F ne tient que 2.83:1 sur fond sombre.
  chartInk: '#14A38C',
  chartGrid: 'rgba(255,255,255,0.10)',
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
