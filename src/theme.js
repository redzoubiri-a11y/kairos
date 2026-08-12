// ─────────────────────────────────────────────
// MIDA — Design System Tokens
// Utiliser UNIQUEMENT ces valeurs dans tous les écrans
// Jamais de couleurs ou tailles en dur
// ─────────────────────────────────────────────

// Rebrand Cyan/Magenta (08/2026) — remplace le vert/terracotta de la direction "Marché"
const CYAN = '#00B4D8';
const MAGENTA = '#E8006F';

export const colors = {
  // Palette principale MIDA — rebrand Cyan/Magenta (08/2026)
  primary: CYAN,
  primarySoft: 'rgba(0,180,216,0.10)',
  primaryDim: 'rgba(0,180,216,0.06)',
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

  // CTA Réservation — magenta, exclusif à l'action de réserver
  resa: MAGENTA,
  resaSoft: 'rgba(232,0,111,0.18)',

  // Texte
  text: '#0A0A0A',
  textMuted: 'rgba(10,10,10,0.55)',
  textDim: 'rgba(10,10,10,0.38)',
  // Placeholder de champ de recherche — Explorer.dc.html : rgba(10,10,10,.42), distinct de textDim
  textPlaceholder: 'rgba(10,10,10,0.42)',
  // Libellés de section (ex. "AUJOURD'HUI") — Notifications.dc.html : rgba(10,10,10,.4), distinct de textDim (.38)
  textFaint: 'rgba(10,10,10,0.4)',
  // Libellés de champ de formulaire — Inscription Restaurateur.dc.html : rgba(10,10,10,.45)
  textLabel: 'rgba(10,10,10,0.45)',

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
  statusConfirmedBg: '#E0F7FA',
  statusConfirmedText: CYAN,
  statusCancelledBg: '#F3E3DE',
  statusCancelledText: '#8a4633',

  // Badge note + tag "Terrasse" — Fiche Restaurant.dc.html : #E8F1EB (distinct de tagGreenBg #E0F7FA,
  // valeur différente dans ce fichier source, pas fusionnée avec le token existant)
  ratingBg: '#E8F1EB',

  // Restaurant cards design system
  star: '#f5c842',
  separator: '#ECE7DC',
  tagGreenBg: '#E0F7FA',
  tagNeutralBg: '#F1EEE6',
  textSecondary: 'rgba(10,10,10,0.55)',
  textTertiary: 'rgba(10,10,10,0.45)',
};

export const typography = {
  // Familles — direction "Marché" : Space Grotesk (titres/chiffres) + DM Sans (tout le reste)
  // Chaque famille = un fichier de poids précis (RN ignore fontWeight sur une police custom,
  // surtout Android) — display/body couvrent les usages dominants (gras pour les titres,
  // regular pour le texte courant) ; les variantes ci-dessous sont dispo pour les cas précis.
  display: 'Space Grotesk',           // = SpaceGrotesk_700Bold — titres d'écran, chiffres clés
  displayMedium: 'Space Grotesk Medium', // = SpaceGrotesk_500Medium
  body: 'DM Sans',                    // = DMSans_400Regular — texte courant, interface
  bodyMedium: 'DM Sans Medium',       // = DMSans_500Medium
  bodySemibold: 'DM Sans SemiBold',   // = DMSans_600SemiBold
  bodyBold: 'DM Sans Bold',           // = DMSans_700Bold

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

// Échelle littérale du design system (base 4) : 4/8/12/16/24/32/48.
// xxs=2 et xxxl=24 restent des utilitaires hors échelle déjà largement consommés
// (ne pas les faire disparaître sans migrer chaque appelant) ; `huge` complète
// l'échelle avec la valeur 48 manquante jusqu'ici.
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
  huge: 48,
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
  // Bouton de recentrage sur mini-carte — Explorer.dc.html : border-radius 10px
  control: 10,
  // Badge "N restaurants ici" sur mini-carte — Explorer.dc.html : border-radius 20px
  badgeSm: 20,
};

export const shadows = {
  // xs — hairline (doc: 0 1px 2px rgba(10,10,10,.05)), palier manquant jusqu'ici
  xs: {
    shadowColor: '#0A0A0A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
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
  // Pin de mini-carte — Explorer.dc.html : 0 4px 10px rgba(10,10,10,.25)
  mapPin: {
    shadowColor: '#0A0A0A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 3,
  },
  // Bouton de recentrage sur mini-carte — Explorer.dc.html : 0 4px 10px rgba(10,10,10,.15)
  mapControl: {
    shadowColor: '#0A0A0A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 2,
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
    fontFamily: typography.bodyBold,
    fontSize: typography.size.subheading + 2,
    color: colors.primary,
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

// Variantes de boutons — section 05 du design system, valeurs littérales
// (padding 16px/26px, radius 12, DM Sans 700 15px), vert/terracotta remplacés
// par cyan/magenta (rebrand acté). `bodyBold` (police chargée séparément, pas
// fontWeight) car RN ignore fontWeight sur une police custom statique.
const BTN_TEXT_BASE = {
  fontFamily: typography.bodyBold,
  fontSize: typography.size.subheading + 2, // 15px, doc : "DM Sans 700 15px"
};

export const buttonVariants = {
  // "Continuer" — action principale de navigation/premium
  primary: {
    container: {
      backgroundColor: colors.noir,
      borderRadius: radius.lg,
      paddingVertical: spacing.xl,
      paddingHorizontal: spacing.xxl + 2, // 26
      alignItems: 'center',
    },
    text: { ...BTN_TEXT_BASE, color: '#FFFFFF' },
  },
  // "Confirmer" — confirmation de marque
  confirm: {
    container: {
      backgroundColor: colors.primary,
      borderRadius: radius.lg,
      paddingVertical: spacing.xl,
      paddingHorizontal: spacing.xxl + 2,
      alignItems: 'center',
    },
    text: { ...BTN_TEXT_BASE, color: '#FFFFFF' },
  },
  // "Réserver" — exclusif à l'action de réserver
  reserve: {
    container: {
      backgroundColor: colors.resa,
      borderRadius: radius.lg,
      paddingVertical: spacing.xl,
      paddingHorizontal: spacing.xxl + 2,
      alignItems: 'center',
    },
    text: { ...BTN_TEXT_BASE, color: '#FFFFFF' },
  },
  // "Ajouter un créneau" — exclusif aux actions restaurateur, texte NOIR sur fond ambre
  pro: {
    container: {
      backgroundColor: colors.gold,
      borderRadius: radius.lg,
      paddingVertical: spacing.xl,
      paddingHorizontal: spacing.xxl + 2,
      alignItems: 'center',
    },
    text: { ...BTN_TEXT_BASE, color: colors.noir },
  },
  // "Plus tard" — outline, padding vertical réduit de 1.5px (largeur de bordure)
  // pour garder la même hauteur totale que les boutons pleins
  secondary: {
    container: {
      backgroundColor: 'transparent',
      borderRadius: radius.lg,
      paddingVertical: spacing.xl - 1.5,
      paddingHorizontal: spacing.xxl + 2,
      alignItems: 'center',
      borderWidth: 1.5,
      borderColor: colors.noir,
    },
    text: { ...BTN_TEXT_BASE, color: colors.noir },
  },
  // "Tout voir" — lien texte seul, aucun fond ni bordure
  link: {
    container: {
      paddingVertical: spacing.xl,
      paddingHorizontal: spacing.sm,
      alignSelf: 'flex-start',
    },
    text: { ...BTN_TEXT_BASE, color: colors.primary },
  },
  // "Indisponible" — désactivé
  disabled: {
    container: {
      backgroundColor: colors.tagNeutralBg,
      borderRadius: radius.lg,
      paddingVertical: spacing.xl,
      paddingHorizontal: spacing.xxl + 2,
      alignItems: 'center',
    },
    text: { ...BTN_TEXT_BASE, color: colors.accentDim },
  },

  // Variantes additionnelles (hors les 7 du fichier source, besoins réels de l'app)
  ghost: {
    container: {
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      padding: spacing.xl,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    text: { ...BTN_TEXT_BASE, color: colors.text },
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
    text: { ...BTN_TEXT_BASE, color: colors.red },
  },
};

// Tags / Badges — section 06 du design system
// Taxonomie littérale du fichier source : filtres (actif/inactif), tags
// cuisine/info, statuts réservation/commande (pending/confirmed/cancelled déjà
// alignés dans `colors`, cf. statusPendingBg/statusConfirmedBg/statusCancelledBg).
export const tagVariants = {
  // Filtres — doc : DM Sans 500 11px, radius 7, padding 7px 11px
  filterActive:   { bg: colors.noir, text: '#FFFFFF' },
  filterInactive: { bg: colors.tagNeutralBg, text: colors.noir },

  // Tags cuisine / info — doc : DM Sans 700 10px tracké .04em, radius 6, padding 6px 9px
  cuisineInfo:    { bg: colors.tagGreenBg, text: colors.primary },
  cuisineNeutral: { bg: colors.tagNeutralBg, text: colors.textMuted },

  // Statuts réservation/commande (pro) — mêmes couleurs que colors.statusXxx
  statusPending:   { bg: colors.statusPendingBg, text: colors.statusPendingText },
  statusConfirmed: { bg: colors.statusConfirmedBg, text: colors.statusConfirmedText },
  statusCancelled: { bg: colors.statusCancelledBg, text: colors.statusCancelledText },

  // Aménité mise en avant ("Terrasse") — Fiche Restaurant.dc.html
  amenityHighlight: { bg: colors.ratingBg, text: colors.primary },

  // Variantes additionnelles (hors fichier source, besoins réels de l'app)
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

