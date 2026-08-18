// ─────────────────────────────────────────────────────────────
// Tasalle — Design System (spécifications §3)
// Toutes les valeurs de style de l'application viennent d'ici.
// Aucune couleur ni taille en dur ailleurs dans le code.
// ─────────────────────────────────────────────────────────────

// §3.1 — Tokens de couleur (thème clair)
//
// Migration de la palette noir/or vers la direction « Modernist » (rouge
// grotesque, angles droits) explorée dans Claude Design — décision du
// 2026-08-17. Le rouge de marque, #EC3013, ne peut pas tout faire : en aplat
// avec du blanc dessus il ne tient que 4,20:1, sous le seuil de texte (4,5:1).
// Il décore, il n'écrit pas. D'où trois jetons distincts là où un seul
// suffirait à une couleur plus sombre :
//   · `primary`    — les aplats. Le rouge profond #AE1800 (palier 700 de la
//                    rampe), blanc dessus à 7,17:1.
//   · `primaryInk` — ce qui s'écrit : même #AE1800, 5,91:1 sur les cartes.
//   · `gold`       — le rouge vif de marque lui-même (#EC3013), décor et
//                    grands éléments uniquement (nom historique conservé
//                    pour ne pas retoucher chaque composant qui le consomme).
export const lightColors = {
  // Primaires — rouge profond (palier 700 de la rampe Modernist)
  primary: '#AE1800',
  primaryLight: '#FFF2EF',
  primaryDark: '#7C1405',
  /** Ce qui s'inscrit sur un aplat primaire. */
  onPrimary: '#FFFFFF',

  // Secondaires — second accent Modernist, assombri pour servir de texte (5,79:1)
  secondary: '#9E3526',
  secondaryLight: '#FFF2EF',
  gold: '#EC3013',
  goldLight: '#FFF2EF',
  goldText: '#AE1800',
  // Rouge des objets graphiques porteurs d'information — les étoiles de
  // notation au premier chef. `gold` (le rouge vif) tient 3,47:1 sur la
  // surface, au-dessus du seuil composant (3:1) mais pas du seuil texte.
  // `goldMark` (palier 600 du second accent) vise le même seuil composant
  // avec plus de marge sur les fonds pâles (4,22:1 sur `goldLight`).
  goldMark: '#C94B39',

  // Accents — rouge d'erreur assombri à #B3341F pour tenir 5,06:1 sur la
  // nouvelle surface Modernist (#EAE9E9, plus grise que le blanc d'origine) ;
  // distinct du rouge de marque pour ne pas confondre action principale et
  // état d'erreur.
  accent: '#B3341F',
  accentLight: '#FDECEA',
  info: '#3B82F6',

  // Neutres
  dark: '#201E1D',
  warmGray: '#7D7979',
  border: '#D7D3D3',
  // Fond de page gris très clair Modernist. Les cartes sont sur un gris
  // légèrement différent (`surface`), détachées par leur propre teinte plutôt
  // que par une ombre.
  cream: '#F3F2F2',
  surface: '#EAE9E9',
  surfaceElevated: '#F8F4F4',

  // Dérivés (badges, overlays)
  successBg: 'rgba(174,24,0,0.10)',
  warningBg: 'rgba(236,48,19,0.18)',
  dangerBg: 'rgba(179,52,31,0.12)',
  infoBg: 'rgba(59,130,246,0.12)',
  overlay: 'rgba(0,0,0,0.55)',
  skeleton: '#EAE7E7',

  // Logo : piste « Broadsheet » (bleu pétrole), en attente du dessin réel du
  // monogramme — `logoInk` est un jeton provisoire tant que la marque n'a pas
  // été redessinée dans cette direction (voir §3 du plan de migration).
  logoInk: '#0088B0',
  // Le mot-symbole reste dans l'encre du texte : c'est lui qui porte la
  // lisibilité de la marque, et il passe partout.
  logoWordmark: '#201E1D',
  // Fond des icônes d'application et de l'écran de lancement.
  logoCanvas: '#F8F4F4',

  // Le rouge qui s'écrit : texte, icônes, onglet actif, montants. 5,91:1 sur
  // les cartes, là où le rouge vif de marque n'atteint que 3,47:1.
  primaryInk: '#AE1800',

  // Marques de graphique : même encre. Les séries restent mono-teinte —
  // l'identité est portée par les libellés, pas par la couleur.
  chartInk: '#AE1800',
  chartGrid: 'rgba(32,30,29,0.08)',
};

// §3.5 — Dark mode : seuls les neutres changent, les accents restent identiques
export const darkColors = {
  ...lightColors,
  dark: '#F8F4F4',
  surface: '#2D2B2B',
  surfaceElevated: '#201E1D',
  border: '#444141',
  cream: '#201E1D',
  warmGray: '#9B9797',
  primaryLight: 'rgba(236,48,19,0.20)',
  secondaryLight: 'rgba(236,48,19,0.14)',
  goldLight: 'rgba(236,48,19,0.14)',
  accentLight: 'rgba(179,52,31,0.20)',
  successBg: 'rgba(236,48,19,0.18)',
  warningBg: 'rgba(236,48,19,0.18)',
  skeleton: '#444141',

  // Les rôles s'inversent. En thème clair l'aplat est le rouge profond et un
  // blanc dessus lit ; sur fond sombre ce même rouge profond se fondrait dans
  // le fond, alors c'est un rouge clair (palier 300 de la rampe) qui remplit
  // — et le texte sombre qui s'y inscrit. Un libellé blanc en dur y serait
  // illisible (1,52:1) : c'est la raison d'être de `onPrimary`.
  primary: '#FFC4B8',
  primaryDark: '#FF9783',
  onPrimary: '#201E1D',
  primaryInk: '#FFC4B8',
  secondary: '#FFC4B8',
  // Sur fond sombre, un palier plus clair de la rampe dépasse largement le
  // seuil composant : les étoiles restent lisibles sans être criardes.
  goldMark: '#FF9783',
  chartInk: '#FFC4B8',
  chartGrid: 'rgba(248,244,244,0.10)',

  // Le mot-symbole s'inverse : sombre sur clair devient clair sur fond
  // sombre. Le monogramme, lui, garde son bleu pétrole — il y gagne même
  // en lisibilité (4,07:1 contre 3,65:1 en thème clair).
  logoWordmark: '#F8F4F4',
  logoCanvas: '#201E1D',
  // `logoInk` n'est pas redéfini : le monogramme garde la même teinte dans
  // les deux thèmes, comme toute marque.
};

// §3.2 — Typographie
//
// Archivo (piste Modernist), chargée par ThemeContext.js — voir la note à cet
// endroit sur pourquoi App.js n'a pas à changer. Trois paliers seulement,
// comme dans la source : 800 (ExtraBold) pour tout ce qui a valeur de titre,
// 600 (SemiBold) pour les libellés qui doivent se détacher sans être un
// titre, 400 (Regular) pour le corps de texte.
export const typography = {
  hero: { fontSize: 42, fontWeight: '800', fontFamily: 'Archivo_800ExtraBold', lineHeight: 46 },
  h1: { fontSize: 32, fontWeight: '800', fontFamily: 'Archivo_800ExtraBold', lineHeight: 37 },
  h2: { fontSize: 24, fontWeight: '800', fontFamily: 'Archivo_800ExtraBold', lineHeight: 29 },
  h3: { fontSize: 20, fontWeight: '800', fontFamily: 'Archivo_800ExtraBold', lineHeight: 26 },
  title: { fontSize: 17, fontWeight: '600', fontFamily: 'Archivo_600SemiBold', lineHeight: 24 },
  body: { fontSize: 16, fontWeight: '400', fontFamily: 'Archivo_400Regular', lineHeight: 24 },
  secondary: { fontSize: 14, fontWeight: '400', fontFamily: 'Archivo_400Regular', lineHeight: 21 },
  caption: { fontSize: 12, fontWeight: '600', fontFamily: 'Archivo_600SemiBold', lineHeight: 17 },
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
export const radii = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 10,
  xl: 12,
  xxl: 16,
  pill: 999,
};

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  sticky: {
    shadowColor: '#000',
    shadowOpacity: 0.1,
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
