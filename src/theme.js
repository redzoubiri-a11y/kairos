// ─────────────────────────────────────────────
// MIDA — Design System Tokens
// Utiliser UNIQUEMENT ces valeurs dans tous les écrans
// Jamais de couleurs ou tailles en dur
// ─────────────────────────────────────────────

// Refonte Tabelog × OpenTable (16/08/2026) — remplace l'accent vert par un
// rouge/terracotta unique, cf. le projet claude.ai/design de référence.
const ACCENT = '#D8432B';

export const colors = {
  // Palette principale MIDA — accent unique (Tabelog × OpenTable, 16/08/2026)
  primary: ACCENT,
  primarySoft: 'rgba(216,67,43,0.10)',
  primaryDim: 'rgba(216,67,43,0.06)',
  // Vert pin historique — l'icône app/splash sont passées au rouge ACCENT le
  // 18/08/2026 (nouveau logo Claude Design), plus aucun usage. Gardé au cas où.
  anchorGreen: '#13502E',
  noir: '#191919',
  cream: '#F5EDD6',
  greyBg: '#F5F6F8',

  // Backgrounds
  bg: '#F5F5F3',
  card: '#FFFFFF',
  cardBorder: '#E7E6E1',
  cardHover: 'rgba(25,25,25,0.04)',

  // Neutral light — boutons et éléments UI (thème blanc)
  navy: 'transparent',
  navyBorder: '#E7E6E1',
  navyDeep: 'rgba(25,25,25,0.04)',

  // Accent UI — neutre sombre (remplace l'ancien stone #9B9088)
  accent: 'rgba(25,25,25,0.55)',
  accentSoft: 'rgba(25,25,25,0.08)',
  accentDim: 'rgba(25,25,25,0.35)',

  // CTA Pro — ambre, exclusif à l'univers restaurateur
  gold: '#c8975a',
  goldSoft: 'rgba(200,151,90,0.14)',

  // CTA Réservation — même accent que primary (harmonisation, plus de couleur distincte)
  resa: ACCENT,
  resaSoft: 'rgba(216,67,43,0.18)',

  // "Verre" blanc à faible transparence — barres de recherche, boutons, chips et
  // barres de navigation flottant sur du contenu, pour laisser deviner ce qu'il y a derrière
  glassBg: 'rgba(255,255,255,0.72)',
  // Variante plus opaque — blocs qui doivent se détacher nettement du contenu qui défile dessous
  glassBgStrong: 'rgba(255,255,255,0.94)',

  // Texte — refonte 16/08/2026 : hex littéraux du nouveau système (2 paliers de gris),
  // remplace les ~7 nuances de rgba(10,10,10,.38→.55) de l'ancien système "Marché"
  // (elles étaient calibrées sur un fond quasi-blanc, plus cohérentes avec le nouveau bg).
  text: '#191919',
  textMuted: '#5F5F5B',
  textDim: '#8F8F89',
  // Placeholder de champ de recherche
  textPlaceholder: '#8F8F89',
  // Libellés de section (ex. "AUJOURD'HUI")
  textFaint: '#8F8F89',
  // Libellés de champ de formulaire
  textLabel: '#5F5F5B',
  // Sous-titre header (ex. "Méditerranéen · Hydra")
  textCaption: '#5F5F5B',

  // États — valeurs littérales du nouveau système (16/08/2026)
  green: '#2E7D4F',
  greenSoft: '#E5F3EA',
  red: '#C23B2B',
  redSoft: '#FBE9E5',
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

  // ── Neutres papier — Lot 0 (15/08/2026) ─────────────────────────────
  // Demandés pour remplacer les hex codés en dur dans les composants.
  // Hex absolus distincts de text/textMuted/textDim/textSecondary/textTertiary
  // (ceux-ci sont des rgba sur noir, calibrés pour l'ancien bg quasi-blanc) —
  // noms suffixés "Paper" là où un nom sans suffixe existait déjà avec une
  // valeur différente, pour ne casser aucune clé existante.
  // 16/08/2026 : alignés sur les valeurs littérales définitives du nouveau système
  // (bg/text/textMuted/textDim ci-dessus portent maintenant les mêmes valeurs —
  // ces clés "Paper" restent pour ne rien casser côté appelants du Lot 1).
  bgPaper: '#F5F5F3',
  textPrimary: '#191919',
  textSecondaryPaper: '#5F5F5B',
  textTertiaryPaper: '#8F8F89', // texte discret
  borderPaper: '#E7E6E1',
  borderPaperStrong: '#C4C2B8',
  unavailable: '#C23B2B', // état indisponible / complet

  // Overlay
  overlay: 'rgba(0,0,0,0.5)',
  overlayLight: 'rgba(0,0,0,0.15)',

  // Statuts réservation/commande (pro) — 16/08/2026 : décorrélés de `primary`/ACCENT.
  // Un statut "confirmée" doit rester vert même si l'accent de marque devient rouge —
  // avant cette refonte, statusConfirmedText référençait GREEN (= primary), ce qui
  // aurait rendu "Confirmée" rouge une fois l'accent changé. Valeurs littérales fixes.
  statusPendingBg: '#FBF0D9',
  statusPendingText: '#96700E',
  statusConfirmedBg: '#E5F3EA',
  statusConfirmedText: '#2E7D4F',
  statusCancelledBg: '#FBE9E5',
  statusCancelledText: '#C23B2B',

  // Badge note + tag "Terrasse" — même teinte verte que tagGreenBg/statusConfirmedBg
  ratingBg: '#E5F3EA',

  // Restaurant cards design system — étoiles en accent rouge (motif OpenTable)
  star: ACCENT,
  separator: '#E7E6E1',
  tagGreenBg: '#E5F3EA',
  tagNeutralBg: '#EDECE7',
  // Badge "Table n°X" — Pro Commandes.dc.html / Suivi de commande.dc.html : tan neutre, pas de statut
  tableBadgeBg: '#F0EAD9',
  textSecondary: '#5F5F5B',
  textTertiary: '#8F8F89',

  // Dégradé de repli quand un restaurant n'a aucune photo — tons sable chauds
  // alignés sur la famille cream/cardBorder de la direction "Marché"
  // (remplace un mauve/bleu-gris hors palette trouvé dans 6 écrans).
  photoFallbackGradient: ['#EDE6D4', '#DED2B4', '#C7B78D'],

  // Hero décoratif — Réserver ou Commander.dc.html (pas de photo resto réelle à ce stade
  // du parcours, dégradé littéral de la maquette).
  heroWarmGradient: ['#C9925A', '#8A5A34'],

  // Fond plein écran chaud — Espace Manager (remplace le blanc plat de colors.bg,
  // couleur unie donc homogène quelle que soit la hauteur de scroll).
  warmBg: '#F9F1DF',
  // Halos décoratifs discrets posés sur warmBg (effet d'ambiance, faible opacité).
  glowGold: 'rgba(200,151,90,0.16)',
  glowWarm: 'rgba(216,150,104,0.13)',
};

export const typography = {
  // Familles — refonte Tabelog × OpenTable (16/08/2026) : une seule famille sans-serif
  // (Work Sans) partout, remplace la paire Space Grotesk (titres) + DM Sans (reste) —
  // ni Tabelog ni OpenTable n'utilisent de serif éditorial, cf. maquettes de référence.
  // Chaque nom = un fichier de poids précis chargé dans App.js (RN ignore fontWeight
  // sur une police custom statique, surtout Android).
  display: 'Work Sans ExtraBold',        // = WorkSans_800ExtraBold — titres, chiffres clés
  displayMedium: 'Work Sans Bold',       // = WorkSans_700Bold
  body: 'Work Sans',                     // = WorkSans_400Regular — texte courant
  bodyMedium: 'Work Sans Medium',        // = WorkSans_500Medium
  bodySemibold: 'Work Sans SemiBold',    // = WorkSans_600SemiBold
  bodyBold: 'Work Sans Bold',            // = WorkSans_700Bold

  // Tailles — augmentées d'un cran (retour utilisateur du 16/08/2026, "police plus grande
  // partout"), même échelle relative, valeurs arrondies.
  size: {
    xs: 10,
    sm: 11,
    caption: 12,
    body: 13,
    bodyLg: 14,
    subheading: 16,
    heading3: 17,
    heading2: 18,
    heading1: 21,
    title: 26,
    hero: 31,
    display: 35,
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
  // Barre panier flottante — Click and Collect.dc.html / Suivi de commande.dc.html : border-radius 14px
  floating: 14,
};

export const shadows = {
  // xs — hairline (doc: 0 1px 2px rgba(10,10,10,.05)), palier manquant jusqu'ici
  xs: {
    shadowColor: '#191919',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: '#191919',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 2,
  },
  md: {
    shadowColor: '#191919',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 28,
    elevation: 4,
  },
  lg: {
    shadowColor: '#191919',
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.28,
    shadowRadius: 48,
    elevation: 8,
  },
  accent: {
    shadowColor: '#191919',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
  // Pin de mini-carte — Explorer.dc.html : 0 4px 10px rgba(10,10,10,.25)
  mapPin: {
    shadowColor: '#191919',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 3,
  },
  // Bouton de recentrage sur mini-carte — Explorer.dc.html : 0 4px 10px rgba(10,10,10,.15)
  mapControl: {
    shadowColor: '#191919',
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
// (padding 16px/26px, radius 12, DM Sans 700 15px). `bodyBold` (police
// chargée séparément, pas fontWeight) car RN ignore fontWeight sur une
// police custom statique.
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
  // "Ajouter un créneau" — exclusif aux actions restaurateur — fond or retiré sur demande,
  // aligné sur l'accent vert de marque au lieu du gold
  pro: {
    container: {
      backgroundColor: colors.primary,
      borderRadius: radius.lg,
      paddingVertical: spacing.xl,
      paddingHorizontal: spacing.xxl + 2,
      alignItems: 'center',
    },
    text: { ...BTN_TEXT_BASE, color: '#FFFFFF' },
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
  // text: statusConfirmedText (vert fixe), pas `colors.primary` — un tag "positif" doit
  // rester vert même si l'accent de marque devient rouge (16/08/2026).
  cuisineInfo:    { bg: colors.tagGreenBg, text: colors.statusConfirmedText },
  cuisineNeutral: { bg: colors.tagNeutralBg, text: colors.textMuted },

  // Statuts réservation/commande (pro) — mêmes couleurs que colors.statusXxx
  statusPending:   { bg: colors.statusPendingBg, text: colors.statusPendingText },
  statusConfirmed: { bg: colors.statusConfirmedBg, text: colors.statusConfirmedText },
  statusCancelled: { bg: colors.statusCancelledBg, text: colors.statusCancelledText },

  // Aménité mise en avant ("Terrasse") — Fiche Restaurant.dc.html
  amenityHighlight: { bg: colors.ratingBg, text: colors.statusConfirmedText },

  // Variantes additionnelles (hors fichier source, besoins réels de l'app)
  default: { bg: colors.tagNeutralBg, text: colors.text },
  success: { bg: colors.tagGreenBg, text: colors.statusConfirmedText },
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

