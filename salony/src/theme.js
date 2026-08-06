// ============================================================================
// SALONY — Design tokens
// Palette placeholder inspirée beauté/soin (à remplacer par l'identité de marque)
// Tous les écrans/composants doivent EXCLUSIVEMENT utiliser ces tokens.
// ============================================================================

export const colors = {
  // Marque
  primary: '#B8556B',       // rose vieilli — CTA, éléments actifs
  primaryDark: '#8F3F51',
  primaryLight: '#F3DEE3',
  secondary: '#2F2B3A',     // prune profond — headers, textes forts
  accent: '#D8A857',        // doré — badges, notes, mise en avant

  // Surfaces
  background: '#FAF7F5',
  surface: '#FFFFFF',
  surfaceAlt: '#F1EAE7',
  border: '#E7DEDA',

  // Texte
  textPrimary: '#241F2B',
  textSecondary: '#6E6672',
  textInverse: '#FFFFFF',
  textDisabled: '#B3ABB0',

  // États
  success: '#3C8A5B',
  successLight: '#E1F2E7',
  warning: '#C98A2E',
  warningLight: '#FBEAD2',
  error: '#C24444',
  errorLight: '#F8E2E2',
  info: '#3B6FA6',
  infoLight: '#E2ECF7',

  // Statuts réservation
  statutEnAttente: '#C98A2E',
  statutConfirme: '#3B6FA6',
  statutTermine: '#3C8A5B',
  statutAnnule: '#8A828C',
  statutNoShow: '#C24444',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 8,
  md: 14,
  lg: 20,
  pill: 999,
};

export const typography = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
  },
  size: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 22,
    xxl: 28,
    display: 34,
  },
  weight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  lineHeight: {
    tight: 1.15,
    normal: 1.4,
    relaxed: 1.6,
  },
};

export const shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
};

// Correspondance statut réservation -> couleurs.
// Les libellés viennent de src/i18n (clés `statuts.*`), pas d'ici.
export const bookingStatusMeta = {
  en_attente: { color: colors.statutEnAttente, bg: colors.warningLight },
  confirme: { color: colors.statutConfirme, bg: colors.infoLight },
  termine: { color: colors.statutTermine, bg: colors.successLight },
  annule: { color: colors.statutAnnule, bg: colors.surfaceAlt },
  no_show: { color: colors.statutNoShow, bg: colors.errorLight },
};

export const theme = { colors, spacing, radius, typography, shadow, bookingStatusMeta };

export default theme;
