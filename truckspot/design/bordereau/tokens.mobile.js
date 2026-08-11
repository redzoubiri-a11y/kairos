// TruckSpot — direction visuelle "Bordereau" (validee, tampon vert)
//
// Ce fichier a la meme forme que frontend_mobile/src/theme/index.js : memes
// noms de roles (colors, spacing, radii, typography, shadows, statusColors),
// seules les valeurs changent. Le jour de la migration, il remplace ce
// fichier sans toucher aux composants qui le consomment.

export const colors = {
  // Fond et surfaces — un bordereau pose a plat, pas une carte flottante.
  background: '#F4F5F3',
  surface: '#FFFFFF',
  surfaceMuted: '#F4F5F3',
  card: '#FFFFFF',
  cardMuted: '#F4F5F3',

  // Encre
  text: '#16202A',
  textInverse: '#FFFFFF',
  textMuted: '#57646D',
  // Cette direction n'a pas de fond sombre : reserve pour compatibilite avec
  // les ecrans qui reference encore ce role (onboarding notamment).
  textOnDark: '#FFFFFF',

  // Lignes de champ
  border: '#C9CDC6',
  borderDark: '#9AA096',

  // Autorite — accent de marque de cette direction (boutons, liens, en-tetes
  // de section). Remplace l'ambre.
  primary: '#0F3D5C',
  primaryDark: '#0B2E45',
  primarySoft: '#E2ECF2',

  // Semantique. Le vert du tampon "Acceptee" est la valeur validee — ne pas
  // la faire deriver d'une echelle generique, c'est la couleur de decision.
  success: '#2E7D5B',
  successSoft: '#E4EFE8',
  danger: '#A6342E',
  dangerSoft: '#F3E1DF',
  warning: '#9A6B14',
  warningSoft: '#F3EAD4',
  info: '#2C5C82',
  infoSoft: '#E2ECF2',

  overlay: 'rgba(22, 32, 42, 0.55)',
};

// Inchange : aucune des trois directions n'a remis en cause l'echelle
// d'espacement existante.
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

// Rayons quasi nuls : un document imprime ne s'arrondit pas. `pill` reste
// disponible pour les rares elements qui en ont vraiment besoin (avatar),
// mais n'est plus le vocabulaire par defaut des badges et boutons.
export const radii = {
  xs: 2,
  sm: 3,
  md: 4,
  lg: 6,
  pill: 999,
};

// Meme echelle que l'existant : aucune direction n'a justifie d'en changer.
// `caption` gagne des majuscules et une lettre plus espacee — c'est
// l'etiquette de champ du bordereau, elle doit se lire comme une instruction.
export const typography = {
  h1: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  h2: { fontSize: 22, fontWeight: '700', letterSpacing: -0.3 },
  h3: { fontSize: 18, fontWeight: '700' },
  body: { fontSize: 15, fontWeight: '400' },
  bodyStrong: { fontSize: 15, fontWeight: '600' },
  small: { fontSize: 13, fontWeight: '400' },
  caption: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
};

// Un bordereau pose a plat n'a pas d'ombre : la bordure suffit a le detacher
// du papier. Reserve aux elements qui flottent reellement au-dessus du
// contenu — une feuille modale, pas une carte de liste.
export const shadows = {
  sheet: {
    shadowColor: '#16202A',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 8,
  },
};

// Regle de decision, pas une palette arbitraire : seul un statut qui
// correspond a un jugement rendu recoit le traitement "tampon" (bordure
// epaisse, leger pivot dans le composant qui l'affiche) — ACCEPTED, REJECTED,
// COMPLETED, VERIFIED. Tout ce qui est encore en mouvement (PENDING,
// IN_PROGRESS, SCHEDULED) ou simplement retire (CANCELLED) reste une
// etiquette plate : rien n'a ete tranche, il n'y a donc rien a tamponner.
export const statusColors = {
  PENDING: { fg: colors.warning, border: colors.border, label: 'En attente', sealed: false },
  ACCEPTED: { fg: colors.success, border: colors.success, label: 'Acceptee', sealed: true },
  REJECTED: { fg: colors.danger, border: colors.danger, label: 'Refusee', sealed: true },
  IN_PROGRESS: { fg: colors.primary, border: colors.border, label: 'En cours', sealed: false },
  COMPLETED: { fg: colors.success, border: colors.success, label: 'Terminee', sealed: true },
  CANCELLED: { fg: colors.textMuted, border: colors.border, label: 'Annulee', sealed: false },
  SCHEDULED: { fg: colors.primary, border: colors.border, label: 'Planifie', sealed: false },
  VERIFIED: { fg: colors.success, border: colors.success, label: 'Verifie', sealed: true },
};

export default { colors, spacing, radii, typography, shadows, statusColors };
