// ─────────────────────────────────────────────────────────────
// Tasalle — Design System (spécifications §3)
// Toutes les valeurs de style de l'application viennent d'ici.
// Aucune couleur ni taille en dur ailleurs dans le code.
// ─────────────────────────────────────────────────────────────

// §3.1 — Tokens de couleur (thème clair)
//
// Migré depuis les fichiers réels du système « Modernist » publié sur Claude
// Design (styles.css, theme.json) — pas une réinterprétation : chaque valeur
// ci-dessous est copiée depuis une règle CSS précise de ce fichier, citée en
// commentaire. Le rouge de marque, #EC3013, ne peut pas tout faire : en aplat
// avec le texte de fond dessus (la vraie recette de `.btn-primary`) il ne
// tient que 3,76:1, sous le seuil de texte de corps (4,5:1). Il décore et
// remplit les aplats, il n'écrit pas les petits corps de texte.
export const lightColors = {
  // .btn-primary { background: var(--color-accent); color: var(--color-bg) }
  // :hover → --color-accent-600, :active → --color-accent-700. RN n'a pas de
  // :hover ; primaryDark sert à l'état pressé (:active).
  primary: '#EC3013',
  primaryLight: '#FFF2EF', // --color-accent-100
  primaryDark: '#AE1800', // --color-accent-700 (:active)
  /** Ce qui s'inscrit sur un aplat primaire — var(--color-bg), pas du blanc en dur. */
  onPrimary: '#F3F2F2',

  // .tag-accent-2 { background: var(--color-accent-2-100); color: var(--color-accent-2-800) }
  secondary: '#71261B', // --color-accent-2-800
  secondaryLight: '#FFF2EF', // --color-accent-2-100
  // .tag-accent { background: var(--color-accent-100); color: var(--color-accent-800) }
  gold: '#EC3013', // --color-accent, décor et grands éléments
  goldLight: '#FFF2EF', // --color-accent-100
  goldText: '#7C1405', // --color-accent-800, la couleur de texte réelle du tag
  // --color-accent-600 (:hover) : plus present que goldText, encore net sur
  // fond pâle — sert aux objets graphiques (étoiles, barres).
  goldMark: '#DD2B0F',

  // Le rouge d'erreur n'existe pas dans Modernist (un kit générique n'a pas
  // de rôle « danger ») — seul jeton de cette liste qui n'est pas repris tel
  // quel d'un fichier. Assombri à #B3341F pour tenir 4,5:1 sur la nouvelle
  // surface, plus grise que le blanc d'origine, et rester distinct du rouge
  // de marque pour ne pas confondre action principale et erreur.
  accent: '#B3341F',
  accentLight: '#FDECEA',
  // Même valeur qu'`accent` en thème clair : #B3341F sert déjà les deux
  // rôles ici (assez sombre pour porter du texte ET pour recevoir du blanc
  // en aplat). Les deux divergent en thème sombre — voir `darkColors`.
  accentInk: '#B3341F',
  info: '#3B82F6',

  // Neutres — var(--color-text), var(--color-bg), var(--color-surface)
  dark: '#201E1D',
  // .text-muted, figcaption { color: color-mix(in srgb, var(--color-text) 55%, transparent) }
  warmGray: 'rgba(32,30,29,0.55)',
  // --color-divider: color-mix(in srgb, var(--color-text) 40%, transparent).
  // Une superposition à 40%, pas un gris plat : elle se marque davantage sur
  // les fonds foncés que ne le ferait un neutre figé — la « recette »
  // exacte du séparateur Modernist, RN sait très bien composer une rgba.
  border: 'rgba(32,30,29,0.4)',
  cream: '#F3F2F2', // --color-bg
  surface: '#EAE9E9', // --color-surface
  surfaceElevated: '#F8F4F4', // --color-neutral-100

  // Dérivés (badges, overlays)
  successBg: 'rgba(174,24,0,0.10)',
  warningBg: 'rgba(236,48,19,0.18)',
  dangerBg: 'rgba(179,52,31,0.12)',
  infoBg: 'rgba(59,130,246,0.12)',
  overlay: 'rgba(0,0,0,0.55)',
  skeleton: '#EAE7E7', // --color-neutral-200

  // Logo : piste « Broadsheet », son propre fichier Claude Design (couleurs
  // et police distinctes de Modernist — la marque et l'interface sont deux
  // voix séparées, voir TasalleLogo.js).
  logoInk: '#0088B0', // --color-accent (Broadsheet)
  logoWordmark: '#201E1D',
  logoCanvas: '#F8F4F4',

  // --color-accent-700 (:active) : le rouge qui s'écrit vraiment (texte,
  // montants, onglet actif) — 5,91:1 sur les cartes.
  primaryInk: '#AE1800',

  // Marques de graphique : même encre. Séries mono-teinte, identité portée
  // par les libellés.
  chartInk: '#AE1800',
  chartGrid: 'rgba(32,30,29,0.08)',
};

// §3.5 — Dark mode
//
// Modernist ne publie pas de variante sombre (band: "light" uniquement) —
// seul ce bloc reste une extrapolation, construite sur les mêmes paliers de
// rampe que le thème clair (accent-100…900), pas sur des valeurs inventées.
export const darkColors = {
  ...lightColors,
  dark: '#F8F4F4', // --color-neutral-100
  surface: '#2D2B2B', // --color-neutral-900
  surfaceElevated: '#201E1D',
  border: '#444141', // --color-neutral-800
  cream: '#201E1D',
  warmGray: '#9B9797', // --color-neutral-500
  primaryLight: 'rgba(236,48,19,0.20)',
  secondaryLight: 'rgba(236,48,19,0.14)',
  goldLight: 'rgba(236,48,19,0.14)',
  accentLight: 'rgba(179,52,31,0.20)',
  successBg: 'rgba(236,48,19,0.18)',
  warningBg: 'rgba(236,48,19,0.18)',
  skeleton: '#444141',

  // Les rôles s'inversent. En thème clair l'aplat est le rouge profond
  // (--color-accent-700) et le fond clair s'y inscrit ; sur fond sombre ce
  // même rouge se fondrait dans le fond, alors c'est un palier clair de la
  // rampe (--color-accent-300) qui remplit — et le texte sombre qui s'y
  // inscrit.
  primary: '#FFC4B8', // --color-accent-300
  primaryDark: '#FF9783', // --color-accent-400
  onPrimary: '#201E1D',
  primaryInk: '#FFC4B8',
  secondary: '#FFC4B8',
  goldMark: '#FF9783',
  chartInk: '#FFC4B8',
  chartGrid: 'rgba(248,244,244,0.10)',

  // `goldText` (§3.1) est taillé pour porter du texte sur un fond CLAIR
  // (`.tag-accent`, l'aplat pâle des badges) — sur `goldLight`/`warningBg`
  // assombris pour le thème sombre, ce même texte s'y fondrait (rouge
  // sombre sur rouge quasi noir). Même inversion que `primary` ci-dessus :
  // un palier clair de la rampe remplit le rôle d'encre.
  goldText: '#FFC4B8', // --color-accent-300

  // `accent` sert deux rôles incompatibles en thème sombre : aplat plein
  // portant du texte blanc (bouton "accent", badge de notif — voir
  // MButton.js, HomeScreen.js) où il doit RESTER sombre pour que le blanc
  // s'y détache, et encre de texte/icône à même le fond (erreurs, badge
  // "danger", cœur favori actif) où le même rouge sombre tombe sous 3:1
  // sur les fonds sombres (mesuré : 2,3:1 sur `surface`). `accentInk`
  // porte ce second rôle, un palier clair de la rampe comme `goldText` —
  // volontairement pas le même palier (accent-400, pas 300), pour rester
  // distinct du rouge de marque comme en thème clair.
  accentInk: '#FF9783', // --color-accent-400

  // Le mot-symbole s'inverse : sombre sur clair devient clair sur fond
  // sombre. Le monogramme (piste Broadsheet) garde son bleu pétrole.
  logoWordmark: '#F8F4F4',
  logoCanvas: '#201E1D',
  // `logoInk` n'est pas redéfini : le monogramme garde la même teinte dans
  // les deux thèmes, comme toute marque.
};

// §3.2 — Typographie
//
// Copié de styles.css (Modernist) : h1 42/32/25/20, `--font-heading-weight:
// 800`, body 400. hero/h1/h2/h3 suivent les tailles réelles de h1-h4 ;
// `title` reprend `.card-title` (17px, 800) ; `caption` reprend h6 (13px,
// capitales et tracking large dans la source — non repris ici, déjà géré au
// cas par cas par les écrans qui en ont besoin).
export const typography = {
  hero: { fontSize: 42, fontWeight: '800', fontFamily: 'Archivo_800ExtraBold', lineHeight: 46 }, // h1
  h1: { fontSize: 32, fontWeight: '800', fontFamily: 'Archivo_800ExtraBold', lineHeight: 37 }, // h2
  h2: { fontSize: 25, fontWeight: '800', fontFamily: 'Archivo_800ExtraBold', lineHeight: 30 }, // h3
  h3: { fontSize: 20, fontWeight: '800', fontFamily: 'Archivo_800ExtraBold', lineHeight: 26 }, // h4
  title: { fontSize: 17, fontWeight: '800', fontFamily: 'Archivo_800ExtraBold', lineHeight: 20 }, // .card-title
  body: { fontSize: 15, fontWeight: '400', fontFamily: 'Archivo_400Regular', lineHeight: 23 }, // body { font-size:15; line-height:1.55 }
  secondary: { fontSize: 14, fontWeight: '400', fontFamily: 'Archivo_400Regular', lineHeight: 21 }, // .input/.btn
  caption: { fontSize: 13, fontWeight: '400', fontFamily: 'Archivo_400Regular', lineHeight: 18 }, // h6
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
//
// styles.css (Modernist) : --radius-sm/md/lg: 0px, les trois. `pill` (999)
// n'existe pas dans la source — Modernist n'a aucune forme en pilule, pas
// même ses boutons ni ses champs — et ne sert plus ici qu'aux formes
// réellement circulaires (avatars, pastilles), jamais aux capsules texte.
export const radii = {
  xs: 0,
  sm: 0,
  md: 0,
  lg: 0,
  xl: 0,
  xxl: 0,
  pill: 999,
};

// --shadow-md/lg (Modernist) : teintées de --color-neutral-900 (#2D2B2B), pas
// de noir pur — « soft ink-tinted shadows », comme le dit le fichier source.
export const shadows = {
  card: {
    shadowColor: '#2D2B2B',
    shadowOpacity: 0.16,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  sticky: {
    shadowColor: '#2D2B2B',
    shadowOpacity: 0.22,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: -12 },
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
