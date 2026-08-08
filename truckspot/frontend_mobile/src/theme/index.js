export const colors = {
  primary: '#F4A521',
  primaryDark: '#D98A0B',
  primarySoft: '#FEF3E0',

  background: '#0B1220',
  surface: '#131C2E',
  surfaceRaised: '#1B263D',
  card: '#FFFFFF',
  cardMuted: '#F5F7FA',

  text: '#0B1220',
  textInverse: '#FFFFFF',
  textMuted: '#6B7A90',
  textOnDark: '#C7D1E0',

  border: '#E2E8F0',
  borderDark: '#2A3853',

  success: '#16A34A',
  successSoft: '#DCFCE7',
  danger: '#DC2626',
  dangerSoft: '#FEE2E2',
  warning: '#D97706',
  warningSoft: '#FEF3C7',
  info: '#2563EB',
  infoSoft: '#DBEAFE',

  overlay: 'rgba(11, 18, 32, 0.55)',
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
  lg: 16,
  xl: 24,
  pill: 999,
};

export const typography = {
  h1: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  h2: { fontSize: 22, fontWeight: '700', letterSpacing: -0.3 },
  h3: { fontSize: 18, fontWeight: '700' },
  body: { fontSize: 15, fontWeight: '400' },
  bodyStrong: { fontSize: 15, fontWeight: '600' },
  small: { fontSize: 13, fontWeight: '400' },
  caption: { fontSize: 11, fontWeight: '600', letterSpacing: 0.4 },
};

export const shadows = {
  card: {
    shadowColor: '#0B1220',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  sheet: {
    shadowColor: '#0B1220',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.16,
    shadowRadius: 20,
    elevation: 16,
  },
};

export const statusColors = {
  PENDING: { bg: colors.warningSoft, fg: colors.warning, label: 'En attente' },
  ACCEPTED: { bg: colors.successSoft, fg: colors.success, label: 'Acceptee' },
  REJECTED: { bg: colors.dangerSoft, fg: colors.danger, label: 'Refusee' },
  IN_PROGRESS: { bg: colors.infoSoft, fg: colors.info, label: 'En cours' },
  COMPLETED: { bg: colors.successSoft, fg: colors.success, label: 'Terminee' },
  CANCELLED: { bg: colors.dangerSoft, fg: colors.danger, label: 'Annulee' },
  SCHEDULED: { bg: colors.infoSoft, fg: colors.info, label: 'Planifie' },
  VERIFIED: { bg: colors.successSoft, fg: colors.success, label: 'Verifie' },
};

export default { colors, spacing, radii, typography, shadows, statusColors };
