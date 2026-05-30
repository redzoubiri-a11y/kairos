// ─────────────────────────────────────────────
// MIDA — Design System Tokens
// Utiliser UNIQUEMENT ces valeurs dans tous les écrans
// Jamais de couleurs ou tailles en dur
// ─────────────────────────────────────────────

export const colors = {
  // Backgrounds
  bg: '#0F0D0B',
  card: '#1A1714',
  cardBorder: '#2A2520',
  cardHover: '#221E1A',

  // Accent principal
  accent: '#E8A045',
  accentSoft: 'rgba(232, 160, 69, 0.12)',
  accentDim: '#C4863A',

  // Texte
  text: '#F0EBE3',
  textMuted: '#8A7F74',
  textDim: '#5A5148',

  // États
  green: '#4CAF82',
  greenSoft: 'rgba(76, 175, 130, 0.12)',
  red: '#E05A5A',
  redSoft: 'rgba(224, 90, 90, 0.12)',
  blue: '#5A9BE0',
  blueSoft: 'rgba(90, 155, 224, 0.12)',
  purple: '#9B7FE8',
  purpleSoft: 'rgba(155, 127, 232, 0.12)',

  // Overlay
  overlay: 'rgba(0,0,0,0.6)',
  overlayLight: 'rgba(0,0,0,0.3)',
};

export const typography = {
  // Familles
  display: 'Georgia',       // Logo et titres hero
  body: 'System',           // Texte courant (utilise la police système)

  // Tailles
  size: {
    xs: 9,
    sm: 10,
    caption: 11,
    body: 12,
    bodyLg: 13,
    subheading: 14,
    heading3: 15,
    heading2: 16,
    heading1: 18,
    title: 20,
    hero: 28,
    display: 36,
  },

  // Poids
  weight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },

  // Interlignage
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.7,
  },
};

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 20,
  xxxl: 24,
  section: 32,
};

export const radius = {
  sm: 8,
  md: 10,
  lg: 12,
  xl: 14,
  xxl: 16,
  pill: 20,
  full: 999,
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  accent: {
    shadowColor: '#E8A045',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
};

// Styles réutilisables communs
export const common = {
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: typography.size.bodyLg,
    fontWeight: typography.weight.bold,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  seeAll: {
    fontSize: typography.size.caption,
    color: colors.accent,
    fontWeight: typography.weight.bold,
  },
  separator: {
    height: 1,
    backgroundColor: colors.cardBorder,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.section,
  },
};

// Variantes de boutons
export const buttonVariants = {
  primary: {
    container: {
      backgroundColor: colors.accent,
      borderRadius: radius.xl,
      padding: spacing.xl,
      alignItems: 'center',
    },
    text: {
      color: '#000000',
      fontSize: typography.size.subheading,
      fontWeight: typography.weight.extrabold,
      letterSpacing: 0.3,
    },
  },
  secondary: {
    container: {
      backgroundColor: 'transparent',
      borderRadius: radius.xl,
      padding: spacing.xl,
      alignItems: 'center',
      borderWidth: 1.5,
      borderColor: colors.accent,
    },
    text: {
      color: colors.accent,
      fontSize: typography.size.subheading,
      fontWeight: typography.weight.extrabold,
    },
  },
  ghost: {
    container: {
      backgroundColor: colors.card,
      borderRadius: radius.xl,
      padding: spacing.xl,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    text: {
      color: colors.textMuted,
      fontSize: typography.size.subheading,
      fontWeight: typography.weight.bold,
    },
  },
  danger: {
    container: {
      backgroundColor: colors.redSoft,
      borderRadius: radius.xl,
      padding: spacing.xl,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'rgba(224, 90, 90, 0.3)',
    },
    text: {
      color: colors.red,
      fontSize: typography.size.subheading,
      fontWeight: typography.weight.extrabold,
    },
  },
};

// Tags / Badges
export const tagVariants = {
  default: { bg: colors.accentSoft, text: colors.accent },
  success: { bg: colors.greenSoft, text: colors.green },
  error: { bg: colors.redSoft, text: colors.red },
  info: { bg: colors.blueSoft, text: colors.blue },
  purple: { bg: colors.purpleSoft, text: colors.purple },
  muted: { bg: colors.cardBorder, text: colors.textMuted },
};

export default {
  colors,
  typography,
  spacing,
  radius,
  shadows,
  common,
  buttonVariants,
  tagVariants,
};
