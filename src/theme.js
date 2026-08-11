// ─────────────────────────────────────────────
// MIDA — Design System Tokens
// Utiliser UNIQUEMENT ces valeurs dans tous les écrans
// Jamais de couleurs ou tailles en dur
// ─────────────────────────────────────────────

export const colors = {
  // Palette principale MIDA — direction "Marché" (refonte 08/2026)
  primary: '#0D6B3F',
  primarySoft: 'rgba(13,107,63,0.10)',
  primaryDim: 'rgba(13,107,63,0.06)',
  noir: '#0A0A0A',
  cream: '#F5EDD6',
  greyBg: '#F5F6F8',

  // Backgrounds
  bg: '#FDFCF9',
  card: '#FFFFFF',
  cardBorder: '#ECE7DC',
  cardHover: 'rgba(10,10,10,0.04)',

  // Neutral light — boutons et éléments UI (thème blanc)
  navy: 'transparent',
  navyBorder: '#ECE7DC',
  navyDeep: 'rgba(10,10,10,0.04)',

  // Accent UI — neutre sombre (remplace l'ancien stone #9B9088)
  accent: 'rgba(10,10,10,0.55)',
  accentSoft: 'rgba(10,10,10,0.08)',
  accentDim: 'rgba(10,10,10,0.35)',

  // CTA Pro — ambre, exclusif à l'univers restaurateur
  gold: '#c8975a',
  goldSoft: 'rgba(200,151,90,0.14)',

  // CTA Réservation — terracotta, exclusif à l'action de réserver
  resa: '#C87860',
  resaSoft: 'rgba(200,120,96,0.18)',

  // Texte
  text: '#0A0A0A',
  textMuted: 'rgba(10,10,10,0.55)',
  textDim: 'rgba(10,10,10,0.38)',

  // États
  green: '#4CAF82',
  greenSoft: 'rgba(76, 175, 130, 0.15)',
  red: '#E05A5A',
  redSoft: 'rgba(224, 90, 90, 0.15)',
  blue: '#5A9BE0',
  blueSoft: 'rgba(90, 155, 224, 0.15)',
  purple: '#9B7FE8',
  purpleSoft: 'rgba(155, 127, 232, 0.15)',

  // Turquoise réservation (héritage, écrans non encore migrés)
  teal: '#3A96A8',
  tealLight: '#6BBDCB',
  tealSoft: 'rgba(58,150,168,0.20)',
  tealMid: 'rgba(58,150,168,0.35)',
  tealDark: '#1A3D44',

  // Overlay
  overlay: 'rgba(0,0,0,0.5)',
  overlayLight: 'rgba(0,0,0,0.15)',

  // Statuts réservation/commande (pro)
  statusPendingBg: '#F6ECDD',
  statusPendingText: '#8a6a35',
  statusConfirmedBg: '#E8F1EB',
  statusConfirmedText: '#0D6B3F',
  statusCancelledBg: '#F3E3DE',
  statusCancelledText: '#8a4633',

  // Restaurant cards design system
  star: '#f5c842',
  separator: '#ECE7DC',
  tagGreenBg: '#E8F1EB',
  tagNeutralBg: '#F1EEE6',
  textSecondary: 'rgba(10,10,10,0.55)',
  textTertiary: 'rgba(10,10,10,0.45)',
};

export const typography = {
  // Familles — direction "Marché" : Space Grotesk (titres/chiffres) + DM Sans (tout le reste)
  display: 'Space Grotesk',       // Titres d'écran, noms de restaurants, chiffres clés
  body: 'DM Sans',                // Texte courant, interface

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
    heading1: 19,
    title: 24,
    hero: 28,
    display: 32,
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
  sm: 8,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  xxxl: 24,
  section: 32,
};

export const radius = {
  sm: 4,
  md: 8,
  card: 16,
  lg: 12,
  xl: 16,
  xxl: 22,
  pill: 999,
  full: 999,
};

export const shadows = {
  sm: {
    shadowColor: '#0A0A0A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 2,
  },
  md: {
    shadowColor: '#0A0A0A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 28,
    elevation: 4,
  },
  lg: {
    shadowColor: '#0A0A0A',
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.28,
    shadowRadius: 48,
    elevation: 8,
  },
  accent: {
    shadowColor: '#0A0A0A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
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
    borderRadius: radius.card,
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
    fontFamily: typography.display,
    fontSize: typography.size.heading1,
    fontWeight: typography.weight.bold,
    color: colors.text,
    marginBottom: spacing.lg,
    letterSpacing: -0.3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  seeAll: {
    fontSize: typography.size.caption,
    color: colors.primary,
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
      backgroundColor: colors.noir,
      borderRadius: radius.lg,
      padding: spacing.xl,
      alignItems: 'center',
    },
    text: {
      fontFamily: typography.body,
      color: '#FFFFFF',
      fontSize: typography.size.subheading,
      fontWeight: typography.weight.bold,
      letterSpacing: 0.3,
    },
  },
  confirm: {
    container: {
      backgroundColor: colors.primary,
      borderRadius: radius.lg,
      padding: spacing.xl,
      alignItems: 'center',
    },
    text: {
      fontFamily: typography.body,
      color: '#FFFFFF',
      fontSize: typography.size.subheading,
      fontWeight: typography.weight.bold,
    },
  },
  reserve: {
    container: {
      backgroundColor: colors.resa,
      borderRadius: radius.lg,
      padding: spacing.xl,
      alignItems: 'center',
    },
    text: {
      fontFamily: typography.body,
      color: '#FFFFFF',
      fontSize: typography.size.subheading,
      fontWeight: typography.weight.bold,
    },
  },
  pro: {
    container: {
      backgroundColor: colors.gold,
      borderRadius: radius.lg,
      padding: spacing.xl,
      alignItems: 'center',
    },
    text: {
      fontFamily: typography.body,
      color: colors.noir,
      fontSize: typography.size.subheading,
      fontWeight: typography.weight.bold,
    },
  },
  secondary: {
    container: {
      backgroundColor: 'transparent',
      borderRadius: radius.lg,
      padding: spacing.xl,
      alignItems: 'center',
      borderWidth: 1.5,
      borderColor: colors.noir,
    },
    text: {
      fontFamily: typography.body,
      color: colors.noir,
      fontSize: typography.size.subheading,
      fontWeight: typography.weight.bold,
    },
  },
  ghost: {
    container: {
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      padding: spacing.xl,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    text: {
      fontFamily: typography.body,
      color: colors.text,
      fontSize: typography.size.subheading,
      fontWeight: typography.weight.bold,
    },
  },
  danger: {
    container: {
      backgroundColor: colors.redSoft,
      borderRadius: radius.lg,
      padding: spacing.xl,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'rgba(224, 90, 90, 0.3)',
    },
    text: {
      fontFamily: typography.body,
      color: colors.red,
      fontSize: typography.size.subheading,
      fontWeight: typography.weight.bold,
    },
  },
  disabled: {
    container: {
      backgroundColor: colors.tagNeutralBg,
      borderRadius: radius.lg,
      padding: spacing.xl,
      alignItems: 'center',
    },
    text: {
      fontFamily: typography.body,
      color: colors.accentDim,
      fontSize: typography.size.subheading,
      fontWeight: typography.weight.bold,
    },
  },
};

// Tags / Badges
export const tagVariants = {
  default: { bg: colors.tagNeutralBg, text: colors.text },
  success: { bg: colors.tagGreenBg, text: colors.primary },
  error: { bg: colors.statusCancelledBg, text: colors.statusCancelledText },
  pending: { bg: colors.statusPendingBg, text: colors.statusPendingText },
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

