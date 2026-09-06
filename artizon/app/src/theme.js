/**
 * Design tokens de l'app Artizon.
 *
 * Palette neutre par défaut, à remplacer par l'identité visuelle réelle
 * dès qu'elle existe — aucune valeur ici n'est une décision de marque figée.
 * Règle du dépôt : les écrans ne posent jamais de couleur ou de taille en
 * dur, ils passent par ces tokens.
 */

export const colors = {
  primary: '#2A4B7C',
  primaryDark: '#1B3252',
  secondary: '#3E7C59',
  background: '#F6F7F9',
  surface: '#FFFFFF',
  border: '#DDE1E6',
  text: '#1C1F24',
  textMuted: '#5B6470',
  danger: '#B3261E',
  success: '#1B7A43',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const radius = {
  sm: 6,
  md: 10,
  lg: 16,
};

export const typography = {
  title: { fontSize: 22, fontWeight: '700', color: colors.text },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
  label: { fontSize: 13, fontWeight: '500', color: colors.textMuted },
  body: { fontSize: 15, color: colors.text },
  hint: { fontSize: 12, color: colors.textMuted },
};

const theme = { colors, spacing, radius, typography };

export default theme;
