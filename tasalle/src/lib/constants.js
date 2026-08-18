// Constantes métier — alignées sur les specs §8 (enums) et §10 (règles).

export const ROLES = { CLIENT: 'client', PRO: 'pro', ADMIN: 'admin' };

export const EVENT_TYPES = ['mariage', 'fiancailles', 'anniversaire', 'conference', 'autre'];

export const EVENT_EMOJI = {
  mariage: '💍',
  fiancailles: '💐',
  anniversaire: '🎂',
  conference: '🏢',
  autre: '🎉',
};

export const RESERVATION_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
};

export const REVIEW_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  FLAGGED: 'flagged',
};

export const SUBSCRIPTION_STATUS = {
  TRIAL: 'trial',
  ACTIVE: 'active',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
};

export const PAYMENT_METHODS = ['ccp', 'baridimob', 'edahabia'];

export const AMENITIES = ['clim', 'cuisine', 'sono', 'parking', 'terrasse', 'pmr', 'traiteur', 'wifi'];

export const AMENITY_ICONS = {
  clim: 'snow-outline',
  cuisine: 'restaurant-outline',
  sono: 'musical-notes-outline',
  parking: 'car-outline',
  terrasse: 'sunny-outline',
  pmr: 'accessibility-outline',
  traiteur: 'fast-food-outline',
  wifi: 'wifi-outline',
};

// Wilayas les plus demandées pour les salles des fêtes
export const CITIES = [
  'Alger', 'Oran', 'Constantine', 'Blida', 'Annaba', 'Sétif',
  'Tizi Ouzou', 'Béjaïa', 'Batna', 'Tlemcen', 'Tipaza', 'Boumerdès',
];

// §10.3 — Abonnement
export const TRIAL_DAYS = 90;
export const SUBSCRIPTION_PRICE = 500;

// §10.1 — Réservations
export const PRO_RESPONSE_HOURS = 48;
export const DEPOSIT_MIN_RATE = 0.3;
export const DEPOSIT_MAX_RATE = 0.5;

// §10.2 — Avis
export const REVIEW_DELAY_HOURS = 48;
export const REVIEW_MODERATION_HOURS = 24;
export const REVIEW_MAX_PHOTOS = 5;

// §5.5 — Photos salle
export const SALLE_MAX_PHOTOS = 10;

// §10.4 — Notifications
export const SMS_QUIET_START = 22;
export const SMS_QUIET_END = 8;
export const SMS_MAX_PER_DAY = 3;

/**
 * Préfixe des clés AsyncStorage.
 *
 * Il conserve l'orthographe d'origine « tasale » alors que la marque s'écrit
 * désormais Tasalle. Ces clés ne sont jamais vues par personne, et les
 * renommer viderait ce qui est déjà enregistré sur les appareils — session,
 * langue, thème, planning hors ligne — pour un gain purement cosmétique.
 */
export const STORAGE_PREFIX = 'tasale.';

// §12 Phase 4 — codes promotionnels
export const PROMO_KINDS = { PERCENT: 'percent', AMOUNT: 'amount' };
export const PROMO_CODE_MAX_LENGTH = 24;

// §13 — traiteurs et halouadjis (pâtissiers traditionnels), deux verticales
// partenaires en plus des salles.
export const PARTNER_TYPES = ['salle', 'traiteur', 'halouadji'];

export const SPECIALITES_TRAITEUR = [
  'cuisine_algerienne',
  'cuisine_internationale',
  'buffet',
  'service_a_table',
  'mechoui',
  'livraison',
];

export const SPECIALITES_HALOUADJI = [
  'patisserie_traditionnelle',
  'patisserie_moderne',
  'gateau_mariage',
  'plateau_individuel',
  'piece_montee',
];

export const DEVIS_STATUS = { PENDING: 'pending', ACCEPTED: 'accepted', DECLINED: 'declined' };

// §12 Phase 4 — parrainage entre propriétaires
export const REFERRAL_CODE_LENGTH = 6;
/** Jours d'abonnement offerts, au parrain comme au filleul. */
export const REFERRAL_DAYS = 30;
/**
 * Plafond de jours qu'un même parrain peut accumuler. Sans lui, l'engagement
 * de Tasalle envers un parrain très actif serait sans limite.
 */
export const REFERRAL_MAX_DAYS = 365;
export const REFERRAL_STATUS = { PENDING: 'pending', REWARDED: 'rewarded', REJECTED: 'rejected' };
