// ─────────────────────────────────────────────────────────────
// Tasalle — Design System (spécifications §3)
// Toutes les valeurs de style de l'application viennent d'ici.
// Aucune couleur ni taille en dur ailleurs dans le code.
// ─────────────────────────────────────────────────────────────

// §3.1 — Tokens de couleur (thème clair)
//
// Migré littéralement depuis le projet Claude Design « Tasalle »
// (DESIGN_SYSTEM.md §2) — la palette du logo, noir et or, rien d'autre.
// L'or de marque, #BE9A5E, ne peut pas tout faire : il ne fait que 2,63:1
// sur blanc, sous le seuil de 4,5:1 que WCAG 2.1 demande à du texte. D'où
// des jetons distincts pour chaque rôle (§2.1) plutôt qu'une seule couleur.
export const lightColors = {
  primary: '#1A1A1A',
  primaryDark: '#000000',
  onPrimary: '#FFFFFF',
  primaryLight: '#F7F2E8',
  primaryInk: '#8B6914',

  gold: '#BE9A5E', // décor et logo uniquement — jamais de texte
  goldMark: '#A8834A', // objets graphiques porteurs d'information (étoiles, barres)
  goldText: '#8B6914', // = primaryInk, texte doré
  goldLight: '#FAF5EC',

  secondary: '#8C6D4A',
  secondaryLight: '#F6F0E7',
  // Assombri de #D94E3B (4,12:1, sous le seuil) à #C0392B (5,44:1) —
  // l'ancien rouge échouait aussi bien en texte sur blanc qu'en aplat
  // portant du blanc.
  accent: '#C0392B',
  accentLight: '#FDECEA',
  // Même valeur qu'`accent` en thème clair : #C0392B sert déjà les deux
  // rôles (assez sombre pour porter du texte ET pour recevoir du blanc en
  // aplat). Les deux divergent en thème sombre — voir `darkColors`.
  accentInk: '#C0392B',
  info: '#3B82F6',

  dark: '#1A1A1A',
  warmGray: '#8B7E72',
  // Écart déclaré vs DESIGN_SYSTEM.md §2 (qui fixe #E8E4DF, 1,27:1) :
  // assombri à #BDB3A4 (2,07:1). Le contour est le SEUL signal qui détache
  // une carte — fond de page et fond de carte sont tous deux #FFFFFF — et à
  // 1,27:1 sur 1 px il est imperceptible sur un écran de téléphone (constaté
  // en test sur device réel le 30/08/2026). Reste sous le 3:1 de WCAG 1.4.11,
  // mais visible.
  border: '#BDB3A4',
  // Fond de page et fond de carte — identiques ; c'est le contour de 1px
  // qui détache une carte, pas une ombre.
  cream: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceElevated: '#FAFAF8',

  successBg: 'rgba(139,105,20,0.10)',
  warningBg: 'rgba(190,154,94,0.18)',
  dangerBg: 'rgba(192,57,43,0.12)',
  infoBg: 'rgba(59,130,246,0.12)',
  overlay: 'rgba(0,0,0,0.55)',
  skeleton: '#EFEBE5',

  logoInk: '#BE9A5E', // monogramme et filet — 2,63:1, exempté (logotype, WCAG 1.4.3)
  logoWordmark: '#1A1A1A',
  logoCanvas: '#F1EFEA',

  chartInk: '#8B6914', // toutes les séries dans la même encre
  chartGrid: 'rgba(26,26,26,0.08)',
};

// §3.5 — Dark mode
//
// Seuls les neutres changent ; les accents (`accent`, `info`) restent
// identiques au départ. Les rôles de la marque s'inversent : un aplat noir
// disparaîtrait sur fond sombre, donc c'est l'or qui remplit, et le noir
// qui s'y inscrit.
export const darkColors = {
  ...lightColors,
  primary: '#BE9A5E', // l'or remplit les aplats
  onPrimary: '#1A1A1A', // le noir s'y inscrit
  primaryDark: '#A8834A',
  primaryInk: '#BE9A5E', // 6,61:1 sur fond / 5,45:1 sur carte
  secondary: '#C9A96A', // éclairci pour rester lisible
  goldMark: '#BE9A5E', // les étoiles reprennent la teinte pleine

  // `goldText` et `chartInk` (§2.1, §2.2) valent littéralement `primaryInk`
  // en thème clair — la doc source ne les liste pas explicitement pour le
  // thème sombre, mais cette identité tient : même inversion que
  // `primaryInk`, sinon les séries de graphique retombent à 2,82:1 sur
  // `surface` (la valeur claire héritée sans être redéfinie).
  goldText: '#BE9A5E',
  chartInk: '#BE9A5E',

  dark: '#FFFFFF',
  surface: '#2A2A2A',
  surfaceElevated: '#1A1A1A',
  border: '#5A5A5A', // même écart qu'en clair : 1,26:1 → 2,08:1 sur `surface`
  cream: '#1A1A1A',
  warmGray: '#A9A099',

  primaryLight: 'rgba(190,154,94,0.20)',
  secondaryLight: 'rgba(190,154,94,0.14)',
  goldLight: 'rgba(190,154,94,0.14)',
  accentLight: 'rgba(192,57,43,0.20)',
  successBg: 'rgba(190,154,94,0.18)',
  warningBg: 'rgba(190,154,94,0.18)',
  skeleton: '#3A3A3A',

  // Écart déclaré : la doc source dit "accent reste identique" en thème
  // sombre, mais `accent` (#C0392B) tombe sous 3:1 sur les fonds sombres
  // (mesuré : 2,64:1 sur `surface`, 2,93:1 sur `dangerBg`) — invisible en
  // encre de texte/icône, alors qu'il tient très bien comme aplat portant
  // du blanc (5,44:1, inchangé). Même pattern que le rouge d'erreur du
  // système Modernist précédent : `accent` garde son rôle d'aplat plein
  // (bouton "accent", badge de notif — texte blanc dessus), `accentInk`
  // porte le rôle d'encre partout ailleurs, éclairci à 40% vers le blanc
  // (5,3-5,9:1 sur ses propres fonds assombris).
  accentInk: '#D98880',

  logoWordmark: '#FFFFFF', // le mot-symbole s'inverse : noir devient blanc
  logoCanvas: '#1A1A1A',
  // `logoInk` n'est pas redéfini : le monogramme garde le même or dans les
  // deux thèmes, comme toute marque — il y gagne même en lisibilité.
};

// §3.2 — Typographie
//
// Police système uniquement — aucune fonte n'est embarquée (parc Android
// d'entrée de gamme et connexions lentes, cœur de cible). Aucun poids en
// dehors de 400/500 : pas de gras appuyé, cohérent avec le ton sobre de la
// marque.
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

// §3.4 — Radii — sept valeurs, du carré adouci à la pastille
export const radii = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 10,
  xl: 12,
  xxl: 16,
  pill: 999,
};

// Deux ombres seulement, et l'usage par défaut est de NE PAS en mettre : le
// fond de page et le fond des cartes sont tous deux blancs en thème clair,
// c'est le contour de 1px (`border`) qui détache une carte, pas une ombre.
export const shadows = {
  card: {
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  sticky: {
    shadowColor: '#000000',
    shadowOpacity: 0.10,
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
