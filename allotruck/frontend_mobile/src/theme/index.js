export const colors = {
  primary: '#E8593C',
  primaryDark: '#C9431F',
  primarySoft: 'rgba(232, 89, 60, 0.12)',

  background: '#F5F0EB',
  surface: '#FFFFFF',
  surfaceRaised: '#FFFFFF',
  card: '#FFFFFF',
  cardMuted: '#EDE7DC',

  text: '#1A1A2E',
  textInverse: '#FFFFFF',
  textMuted: 'rgba(26, 26, 46, 0.55)',
  textOnDark: '#FFFFFF',

  border: 'rgba(26, 26, 46, 0.09)',
  borderDark: 'rgba(255, 255, 255, 0.14)',

  success: '#16A34A',
  successSoft: '#DCFCE7',
  danger: '#DC2626',
  dangerSoft: '#FEE2E2',
  warning: '#D97706',
  warningSoft: '#FEF3C7',
  info: '#1A1A2E',
  infoSoft: 'rgba(26, 26, 46, 0.08)',

  overlay: 'rgba(26, 26, 46, 0.55)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const radii = {
  sm: 8,
  md: 12,
  lg: 20,
  xl: 24,
  pill: 999,
  button: 13,
  buttonLg: 18,
  input: 11,
};

export const fonts = {
  display: 'BricolageGrotesque_700Bold',
  displayBlack: 'BricolageGrotesque_800ExtraBold',
  displaySemiBold: 'BricolageGrotesque_600SemiBold',
  body: 'HankenGrotesk_400Regular',
  bodyMedium: 'HankenGrotesk_500Medium',
  bodySemiBold: 'HankenGrotesk_600SemiBold',
  bodyBold: 'HankenGrotesk_700Bold',
  mono: 'SpaceMono_400Regular',
  monoBold: 'SpaceMono_700Bold',
};

export const typography = {
  h1: { fontFamily: fonts.displayBlack, fontSize: 28, letterSpacing: -0.5 },
  h2: { fontFamily: fonts.display, fontSize: 22, letterSpacing: -0.3 },
  h3: { fontFamily: fonts.displaySemiBold, fontSize: 18 },
  body: { fontFamily: fonts.body, fontSize: 15 },
  bodyStrong: { fontFamily: fonts.bodySemiBold, fontSize: 15 },
  small: { fontFamily: fonts.body, fontSize: 13 },
  caption: { fontFamily: fonts.mono, fontSize: 11, letterSpacing: 0.4 },
};

export const shadows = {
  card: {
    shadowColor: '#1A1A2E',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  accent: {
    shadowColor: '#E8593C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 6,
  },
  sheet: {
    shadowColor: '#1A1A2E',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.16,
    shadowRadius: 20,
    elevation: 16,
  },
};

export const statusColors = {
  PENDING: { bg: colors.primarySoft, fg: colors.primary, label: 'En attente' },
  ACCEPTED: { bg: colors.successSoft, fg: colors.success, label: 'Acceptee' },
  REJECTED: { bg: colors.dangerSoft, fg: colors.danger, label: 'Refusee' },
  IN_PROGRESS: { bg: colors.infoSoft, fg: colors.info, label: 'En cours' },
  COMPLETED: { bg: colors.successSoft, fg: colors.success, label: 'Terminee' },
  CANCELLED: { bg: colors.dangerSoft, fg: colors.danger, label: 'Annulee' },
  SCHEDULED: { bg: colors.infoSoft, fg: colors.info, label: 'Planifie' },
  VERIFIED: { bg: colors.successSoft, fg: colors.success, label: 'Verifie' },
};

export default { colors, spacing, radii, fonts, typography, shadows, statusColors };
