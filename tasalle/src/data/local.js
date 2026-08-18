// Adaptateur "local" — backend de démonstration persistant (AsyncStorage).
// Il implémente exactement la même interface que l'adaptateur Supabase et
// applique les mêmes règles métier (§10). Utilisé quand aucune URL Supabase
// n'est configurée, ce qui permet de faire tourner l'app de bout en bout.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { buildSeed } from './seed';
import { buildNotifications, SMS_TEMPLATES } from '../services/notify';
import {
  todayISO,
  addDays,
  toISODate,
  makeReference,
  normalizePhone,
  formatDA,
} from '../lib/format';
import {
  RESERVATION_STATUS,
  REVIEW_STATUS,
  SUBSCRIPTION_STATUS,
  PRO_RESPONSE_HOURS,
  REVIEW_DELAY_HOURS,
  REVIEW_MODERATION_HOURS,
  TRIAL_DAYS,
  SUBSCRIPTION_PRICE,
  SMS_MAX_PER_DAY,
  ROLES,
  STORAGE_PREFIX,
  REFERRAL_STATUS,
} from '../lib/constants';
import { normalizePromoCode, checkPromo, validatePromoPayload } from '../lib/promo';
import {
  generateReferralCode,
  normalizeReferralCode,
  checkReferral,
  referralGrant,
  extendedDeadline,
} from '../lib/referral';

const STORAGE_KEY = `${STORAGE_PREFIX}db.v1`;
export const DEMO_OTP = '123456';

let db = null;
let writeTimer = null;

function uid(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
}

function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

/**
 * Complète une base enregistrée par une version antérieure.
 *
 * Les données de démonstration vivent dans AsyncStorage : un appareil qui
 * avait déjà utilisé l'application relit sa propre copie, dépourvue des
 * collections ajoutées depuis. Sans ce complément, le premier accès à une
 * nouveauté — les codes promo, le parrainage — lit `undefined` et lève.
 */
function completerCollections(stockee) {
  const neuve = buildSeed();
  Object.keys(neuve).forEach((cle) => {
    if (stockee[cle] === undefined) stockee[cle] = neuve[cle];
  });
  return stockee;
}

async function load() {
  if (db) return db;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    db = raw ? completerCollections(JSON.parse(raw)) : buildSeed();
  } catch {
    db = buildSeed();
  }
  return db;
}

/** Écriture différée : évite un appel AsyncStorage par mutation. */
function persist() {
  if (writeTimer) clearTimeout(writeTimer);
  writeTimer = setTimeout(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(db)).catch(() => {});
  }, 150);
}

export async function resetDemoData() {
  db = buildSeed();
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

function currentUser() {
  if (!db?.session) return null;
  return db.users.find((u) => u.id === db.session) || null;
}

function requireUser() {
  const user = currentUser();
  if (!user) throw new Error('NOT_AUTHENTICATED');
  return user;
}

/**
 * Nombre de SMS déjà programmés pour un destinataire un jour donné.
 * On compte sur le jour d'envoi effectif, pas sur le jour de création : un SMS
 * produit à 23 h part le lendemain à 08 h et pèse sur le quota du lendemain.
 */
function smsScheduledOn(userId, day) {
  return db.notifications.filter(
    (n) => n.user_id === userId && n.channel === 'sms' && n.sent_at && n.sent_at.slice(0, 10) === day
  ).length;
}

function pushNotifications(records) {
  records.forEach((r) => {
    const record = { ...r };
    // §10.4 — plafond de 3 SMS par jour et par utilisateur. Le quota dépend de
    // l'historique, il s'applique donc ici et non dans le moteur (qui est pur) :
    // la notification reste tracée, mais ne partira pas.
    if (record.channel === 'sms' && record.sent_at) {
      const day = record.sent_at.slice(0, 10);
      if (smsScheduledOn(record.user_id, day) >= SMS_MAX_PER_DAY) {
        record.sent_at = null;
      }
    }
    db.notifications.unshift({ id: uid('notif'), ...record });
  });
}

// ── Enrichissement ────────────────────────────────────────────────────────

function tarifsOf(salleId) {
  return db.tarifs.filter((t) => t.salle_id === salleId).sort((a, b) => a.sort_order - b.sort_order);
}

/** Un avis "pending" depuis plus de 24 h est publié automatiquement (§10.2). */
function isPubliclyVisible(review) {
  if (review.status === REVIEW_STATUS.APPROVED) return true;
  if (review.status !== REVIEW_STATUS.PENDING) return false;
  const ageH = (Date.now() - new Date(review.created_at).getTime()) / 3_600_000;
  return ageH >= REVIEW_MODERATION_HOURS;
}

function publicReviewsOf(salleId) {
  return db.reviews.filter((r) => r.salle_id === salleId && isPubliclyVisible(r));
}

function ratingOf(salleId) {
  const list = publicReviewsOf(salleId);
  if (!list.length) return { rating: null, reviews_count: 0 };
  const sum = list.reduce((acc, r) => acc + (r.rating_overall || 0), 0);
  return { rating: Math.round((sum / list.length) * 10) / 10, reviews_count: list.length };
}

function decorateSalle(salle) {
  const tarifs = tarifsOf(salle.id);
  const live = ratingOf(salle.id);
  return {
    ...clone(salle),
    tarifs,
    price_from: tarifs.length ? Math.min(...tarifs.map((t) => t.price)) : null,
    // La note du seed sert de base historique ; les avis réels la complètent.
    rating: live.reviews_count ? live.rating : salle.rating,
    reviews_count: salle.reviews_count + live.reviews_count,
  };
}

// ── Authentification (§9.1) ───────────────────────────────────────────────

export async function sendOtp(phone) {
  await load();
  const normalized = normalizePhone(phone);
  db.pending_otp = { phone: normalized, code: DEMO_OTP, at: Date.now() };
  persist();
  return { ok: true, demoCode: DEMO_OTP };
}

export async function verifyOtp(phone, code) {
  await load();
  const normalized = normalizePhone(phone);
  if (code !== DEMO_OTP) {
    const err = new Error('INVALID_OTP');
    err.code = 'INVALID_OTP';
    throw err;
  }

  let user = db.users.find((u) => u.phone === normalized);
  let isNew = false;
  if (!user) {
    user = {
      id: uid('user'),
      phone: normalized,
      full_name: null,
      role: null,
      created_at: new Date().toISOString(),
    };
    db.users.push(user);
    isNew = true;
  }

  db.session = user.id;
  persist();
  return { user: clone(user), isNew };
}

export async function getSession() {
  await load();
  const user = currentUser();
  return user ? clone(user) : null;
}

export async function signOut() {
  await load();
  db.session = null;
  persist();
  return { ok: true };
}

export async function updateProfile(patch) {
  await load();
  const user = requireUser();
  Object.assign(user, patch);
  persist();
  return clone(user);
}

/** Création de la salle lors de l'inscription pro (§2.3, §5.5). */
export async function registerSalle(payload) {
  await load();
  const user = requireUser();

  const salle = {
    id: uid('salle'),
    owner_id: user.id,
    name: payload.name,
    city: payload.city,
    address: payload.address || '',
    capacity_max: Number(payload.capacity_max) || 0,
    parking_places: Number(payload.parking_places) || 0,
    description: payload.description || '',
    amenities: payload.amenities || [],
    photos: payload.photos || [],
    latitude: payload.latitude ?? null,
    longitude: payload.longitude ?? null,
    status: 'pending',
    is_premium: false,
    rating: null,
    reviews_count: 0,
    created_at: new Date().toISOString(),
  };
  db.salles.push(salle);

  (payload.tarifs || []).forEach((t, i) => {
    db.tarifs.push({
      id: uid('tarif'),
      salle_id: salle.id,
      name: t.name,
      description: t.description || '',
      price: Number(t.price) || 0,
      sort_order: i,
    });
  });

  user.role = ROLES.PRO;
  // Pas de `user.salle_id` : le lien va dans l'autre sens (salles.owner_id),
  // sinon un propriétaire à deux salles n'en garderait qu'une.
  user.pin = payload.pin || null;
  user.ccp = payload.ccp || null;

  // Chaque propriétaire porte son propre code, attribué une fois.
  if (!user.referral_code) user.referral_code = uniqueReferralCode();

  // §12 Phase 4 — le lien de parrainage se noue ici, mais la récompense
  // attend la validation de la salle : sans ce délai, quelques comptes
  // fictifs suffiraient à s'offrir des mois d'abonnement.
  if (payload.referral_code) {
    const parrain = findByReferralCode(payload.referral_code);
    const verdict = checkReferral({
      parrain,
      filleul: user,
      dejaParraine: db.referrals.some((r) => r.referred_id === user.id),
    });
    if (!verdict.ok) {
      const err = new Error('REFERRAL_REFUSED');
      err.code = 'REFERRAL_REFUSED';
      err.reason = verdict.reason;
      throw err;
    }
    db.referrals.push({
      id: uid('parr'),
      referrer_id: parrain.id,
      referred_id: user.id,
      code: parrain.referral_code,
      status: REFERRAL_STATUS.PENDING,
      days_granted: 0,
      rewarded_at: null,
      created_at: new Date().toISOString(),
    });
  }

  // §10.3 — un seul essai par propriétaire : ajouter une deuxième salle ne
  // relance pas les 90 jours et ne double pas la facture.
  const dejaAbonne = db.subscriptions.some((s) => s.pro_id === user.id);
  if (!dejaAbonne) db.subscriptions.push({
    id: uid('sub'),
    pro_id: user.id,
    salle_id: null,
    status: SUBSCRIPTION_STATUS.TRIAL,
    trial_started_at: todayISO(),
    trial_ends_at: addDays(todayISO(), TRIAL_DAYS),
    current_period_start: null,
    current_period_end: null,
    amount: SUBSCRIPTION_PRICE,
    payment_method: null,
    payment_details: null,
    created_at: new Date().toISOString(),
  });

  persist();
  return { salle: clone(salle), user: clone(user) };
}

// ── Salles (§9.2) ─────────────────────────────────────────────────────────

export async function listSalles(filters = {}) {
  await load();
  const { query, city, eventType, minCapacity, amenities, maxPrice } = filters;

  let rows = db.salles.filter((s) => s.status === 'active').map(decorateSalle);

  if (query) {
    const q = query.trim().toLowerCase();
    rows = rows.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.city.toLowerCase().includes(q) ||
        (s.address || '').toLowerCase().includes(q)
    );
  }
  if (city) rows = rows.filter((s) => s.city === city);
  if (minCapacity) rows = rows.filter((s) => (s.capacity_max || 0) >= minCapacity);
  if (maxPrice) rows = rows.filter((s) => s.price_from != null && s.price_from <= maxPrice);
  if (amenities?.length) {
    rows = rows.filter((s) => amenities.every((a) => (s.amenities || []).includes(a)));
  }
  // Le type d'événement n'exclut pas une salle mais remonte les plus adaptées.
  if (eventType === 'conference') {
    rows = rows.filter((s) => (s.amenities || []).includes('sono'));
  }

  // §10.3 — une salle sans abonnement à jour passe en "non prioritaire".
  // L'abonnement est porté par le propriétaire : ses salles se déclassent
  // donc ensemble.
  const rank = (s) => {
    const sub = db.subscriptions.find((x) => x.pro_id === s.owner_id);
    const lapsed = sub && sub.status === SUBSCRIPTION_STATUS.EXPIRED;
    return (lapsed ? 2 : 0) - (s.is_premium ? 1 : 0);
  };
  rows.sort((a, b) => rank(a) - rank(b) || (b.rating || 0) - (a.rating || 0));

  return rows;
}

export async function getSalle(id) {
  await load();
  const salle = db.salles.find((s) => s.id === id);
  if (!salle) throw new Error('SALLE_NOT_FOUND');
  return decorateSalle(salle);
}

export async function getSalleReviews(salleId, { eventType } = {}) {
  await load();
  let rows = publicReviewsOf(salleId);
  if (eventType && eventType !== 'all') rows = rows.filter((r) => r.event_type === eventType);
  return clone(rows).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

/**
 * §9.2 / §10.1 — état de chaque jour du mois pour une salle.
 * 'past' | 'blocked' | 'booked' | 'held' | 'available'
 */
export async function getAvailability(salleId, year, month) {
  await load();
  const today = todayISO();
  const map = {};

  // Marge d'un mois de part et d'autre : la grille déborde sur les mois voisins
  const monthEnd = new Date(year, month + 2, 0);

  for (let d = new Date(year, month - 1, 1); d <= monthEnd; d.setDate(d.getDate() + 1)) {
    const iso = toISODate(d);
    if (iso < today) {
      map[iso] = 'past';
      continue;
    }
    map[iso] = 'available';
  }

  db.blocked_days
    .filter((b) => b.salle_id === salleId)
    .forEach((b) => {
      if (map[b.day] && map[b.day] !== 'past') map[b.day] = 'blocked';
    });

  db.reservations
    .filter((r) => r.salle_id === salleId)
    .forEach((r) => {
      if (!map[r.event_date] || map[r.event_date] === 'past') return;
      if (r.status === RESERVATION_STATUS.CONFIRMED) {
        map[r.event_date] = 'booked';
      } else if (r.status === RESERVATION_STATUS.PENDING) {
        // Une demande en attente bloque le jour pendant 48 h (§10.1)
        const ageH = (Date.now() - new Date(r.created_at).getTime()) / 3_600_000;
        if (ageH < PRO_RESPONSE_HOURS && map[r.event_date] === 'available') {
          map[r.event_date] = 'held';
        }
      }
    });

  return map;
}

// ── Réservations client (§9.3) ────────────────────────────────────────────

export async function createReservation(payload) {
  await load();
  const user = requireUser();
  const salle = db.salles.find((s) => s.id === payload.salle_id);
  if (!salle) throw new Error('SALLE_NOT_FOUND');

  // §10.1 — une seule réservation confirmée par jour et par salle
  const conflict = db.reservations.find(
    (r) =>
      r.salle_id === payload.salle_id &&
      r.event_date === payload.event_date &&
      r.status === RESERVATION_STATUS.CONFIRMED
  );
  if (conflict) {
    const err = new Error('DAY_TAKEN');
    err.code = 'DAY_TAKEN';
    throw err;
  }

  const tarif = db.tarifs.find((t) => t.id === payload.formula_id);
  const montant = tarif ? tarif.price : 0;

  // §12 Phase 4 — le code est revalidé ici, jamais repris tel que l'écran l'a
  // calculé : entre la saisie et l'envoi, le quota a pu être épuisé.
  let promo = null;
  let remise = 0;
  if (payload.promo_code) {
    promo = findPromo(payload.salle_id, payload.promo_code);
    const verdict = checkPromo(promo, { amount: montant });
    if (!verdict.ok) {
      const err = new Error('PROMO_REFUSED');
      err.code = 'PROMO_REFUSED';
      err.reason = verdict.reason;
      throw err;
    }
    remise = verdict.discount;
  }

  db.counters.reservation += 1;

  const reservation = {
    id: uid('resa'),
    reference: makeReference(db.counters.reservation),
    client_id: user.id,
    client_name: payload.client_name || user.full_name,
    client_phone: normalizePhone(payload.client_phone || user.phone),
    salle_id: payload.salle_id,
    event_date: payload.event_date,
    event_type: payload.event_type,
    guest_count: Number(payload.guest_count) || 0,
    formula_id: payload.formula_id,
    promo_code_id: promo ? promo.id : null,
    promo_code: promo ? promo.code : null,
    discount_amount: remise,
    // `total_amount` est le montant réellement dû : c'est lui que suivent les
    // revenus du tableau de bord, l'acompte et le contrat.
    total_amount: montant - remise,
    deposit_amount: null,
    deposit_paid: false,
    deposit_paid_at: null,
    status: RESERVATION_STATUS.PENDING,
    client_message: payload.client_message || '',
    pro_notes: null,
    source: 'app',
    signed_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  db.reservations.unshift(reservation);

  // Le compteur avance à la demande, pas à la confirmation : sinon dix
  // familles pourraient réserver le même jour avec un code limité à une
  // utilisation, et neuf seraient déçues après coup.
  if (promo) promo.used_count = (promo.used_count ?? 0) + 1;

  // Notifications client + pro (§4.4 « Après envoi »)
  pushNotifications(
    buildNotifications({
      type: 'reservation_sent',
      userId: user.id,
      title: 'Demande transmise',
      body: `Votre demande pour ${salle.name} le ${reservation.event_date} a été transmise. Réf. ${reservation.reference}.`,
      data: { reservation_id: reservation.id },
      smsText: `Tasalle : Votre demande pour ${salle.name} le ${reservation.event_date} a bien été transmise. Réf : ${reservation.reference}.`,
    })
  );
  pushNotifications(
    buildNotifications({
      type: 'reservation_new',
      userId: salle.owner_id,
      title: 'Nouvelle demande de réservation',
      body: `${reservation.client_name} souhaite réserver le ${reservation.event_date} (${reservation.event_type}, ${reservation.guest_count} invités).`,
      data: { reservation_id: reservation.id },
      smsText: SMS_TEMPLATES.reservation_new({
        client: reservation.client_name,
        date: reservation.event_date,
      }),
    })
  );

  persist();
  return clone(reservation);
}

export async function listMyReservations() {
  await load();
  const user = requireUser();
  return db.reservations
    .filter((r) => r.client_id === user.id)
    .map((r) => ({
      ...clone(r),
      salle: clone(db.salles.find((s) => s.id === r.salle_id)) || null,
      formula: clone(db.tarifs.find((t) => t.id === r.formula_id)) || null,
      has_review: db.reviews.some((rev) => rev.reservation_id === r.id),
    }))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

export async function getReservation(id) {
  await load();
  const r = db.reservations.find((x) => x.id === id);
  if (!r) throw new Error('RESERVATION_NOT_FOUND');
  return {
    ...clone(r),
    salle: clone(db.salles.find((s) => s.id === r.salle_id)) || null,
    formula: clone(db.tarifs.find((t) => t.id === r.formula_id)) || null,
    has_review: db.reviews.some((rev) => rev.reservation_id === r.id),
  };
}

export async function cancelReservation(id) {
  await load();
  const user = requireUser();
  const r = db.reservations.find((x) => x.id === id && x.client_id === user.id);
  if (!r) throw new Error('RESERVATION_NOT_FOUND');
  // §10.1 — annulation gratuite tant que la demande est en attente
  if (r.status !== RESERVATION_STATUS.PENDING) {
    const err = new Error('NOT_CANCELLABLE');
    err.code = 'NOT_CANCELLABLE';
    throw err;
  }
  r.status = RESERVATION_STATUS.CANCELLED;
  r.updated_at = new Date().toISOString();

  // La place reprise sur le quota est rendue : sans cela, une demande créée
  // puis annulée consommerait une utilisation pour rien, et quelques
  // allers-retours suffiraient à épuiser un code.
  if (r.promo_code_id) {
    const promo = db.promo_codes.find((p) => p.id === r.promo_code_id);
    if (promo) promo.used_count = Math.max(0, (promo.used_count ?? 0) - 1);
  }

  const salle = db.salles.find((s) => s.id === r.salle_id);
  if (salle) {
    pushNotifications(
      buildNotifications({
        type: 'reservation_cancelled',
        userId: salle.owner_id,
        title: 'Demande annulée',
        body: `${r.client_name} a annulé sa demande du ${r.event_date}.`,
        data: { reservation_id: r.id },
      })
    );
  }
  persist();
  return clone(r);
}

/** §11.1 étape 4 — le client signale son versement. */
export async function declareDeposit(id) {
  await load();
  const user = requireUser();
  const r = db.reservations.find((x) => x.id === id && x.client_id === user.id);
  if (!r) throw new Error('RESERVATION_NOT_FOUND');
  r.deposit_declared = true;
  r.updated_at = new Date().toISOString();

  const salle = db.salles.find((s) => s.id === r.salle_id);
  if (salle) {
    pushNotifications(
      buildNotifications({
        type: 'deposit_declared',
        userId: salle.owner_id,
        title: 'Acompte signalé',
        body: `${r.client_name} déclare avoir versé l'acompte pour la réf. ${r.reference}. Vérifiez votre compte CCP.`,
        data: { reservation_id: r.id },
      })
    );
  }
  persist();
  return clone(r);
}

// ── Favoris ───────────────────────────────────────────────────────────────

export async function listFavorites() {
  await load();
  const user = currentUser();
  if (!user) return [];
  const ids = db.favorites.filter((f) => f.user_id === user.id).map((f) => f.salle_id);
  return db.salles.filter((s) => ids.includes(s.id)).map(decorateSalle);
}

export async function listFavoriteIds() {
  await load();
  const user = currentUser();
  if (!user) return [];
  return db.favorites.filter((f) => f.user_id === user.id).map((f) => f.salle_id);
}

export async function toggleFavorite(salleId) {
  await load();
  const user = requireUser();
  const idx = db.favorites.findIndex((f) => f.user_id === user.id && f.salle_id === salleId);
  if (idx >= 0) db.favorites.splice(idx, 1);
  else db.favorites.push({ user_id: user.id, salle_id: salleId });
  persist();
  return idx < 0;
}

// ── Traiteurs et halouadjis (§13) ────────────────────────────────────────
//
// Deux verticales sœurs de « salle », pas de réservation à date bloquée :
// le prix dépend du menu/du nombre d'invités, donc le client envoie une
// demande de devis (`devis_requests`) plutôt que de bloquer un jour.
// Implémentation générique (`PARTNER_COLLECTIONS`) partagée par les deux
// tables, exposée sous des noms spécifiques pour que les écrans appellent
// `listTraiteurs`/`listHalouadjis` sans connaître ce détail interne.

const PARTNER_COLLECTIONS = { traiteur: 'traiteurs', halouadji: 'halouadjis' };

function registerPartner(type, payload) {
  const user = requireUser();
  const partner = {
    id: uid(type),
    owner_id: user.id,
    name: payload.name,
    city: payload.city,
    description: payload.description || '',
    specialites: payload.specialites || [],
    prix_min: payload.prix_min != null ? Number(payload.prix_min) : null,
    prix_max: payload.prix_max != null ? Number(payload.prix_max) : null,
    photos: payload.photos || [],
    status: 'pending',
    is_premium: false,
    created_at: new Date().toISOString(),
  };
  db[PARTNER_COLLECTIONS[type]].push(partner);

  user.role = ROLES.PRO;

  // Même règle que pour une salle (§10.3) : un abonnement par personne,
  // pas par fiche — la table est déjà partagée (`subscriptions.salle_id`
  // reste simplement null ici).
  const dejaAbonne = db.subscriptions.some((s) => s.pro_id === user.id);
  if (!dejaAbonne) {
    db.subscriptions.push({
      id: uid('sub'),
      pro_id: user.id,
      salle_id: null,
      status: SUBSCRIPTION_STATUS.TRIAL,
      trial_started_at: todayISO(),
      trial_ends_at: addDays(todayISO(), TRIAL_DAYS),
      current_period_start: null,
      current_period_end: null,
      amount: SUBSCRIPTION_PRICE,
      payment_method: null,
      payment_details: null,
      created_at: new Date().toISOString(),
    });
  }

  persist();
  return { partner: clone(partner), user: clone(user) };
}

function decoratePartner(partner) {
  return { ...clone(partner) };
}

function listPartners(type, filters = {}) {
  const { query, city } = filters;
  let rows = db[PARTNER_COLLECTIONS[type]].filter((p) => p.status === 'active').map(decoratePartner);

  if (query) {
    const q = query.trim().toLowerCase();
    rows = rows.filter((p) => p.name.toLowerCase().includes(q) || p.city.toLowerCase().includes(q));
  }
  if (city) rows = rows.filter((p) => p.city === city);

  rows.sort((a, b) => (b.is_premium ? 1 : 0) - (a.is_premium ? 1 : 0));
  return rows;
}

function getPartner(type, id) {
  const partner = db[PARTNER_COLLECTIONS[type]].find((p) => p.id === id);
  if (!partner) throw new Error('PARTNER_NOT_FOUND');
  return decoratePartner(partner);
}

export async function registerTraiteur(payload) {
  await load();
  return registerPartner('traiteur', payload);
}
export async function registerHalouadji(payload) {
  await load();
  return registerPartner('halouadji', payload);
}
export async function listTraiteurs(filters = {}) {
  await load();
  return listPartners('traiteur', filters);
}
export async function listHalouadjis(filters = {}) {
  await load();
  return listPartners('halouadji', filters);
}
export async function getTraiteur(id) {
  await load();
  return getPartner('traiteur', id);
}
export async function getHalouadji(id) {
  await load();
  return getPartner('halouadji', id);
}

/** Fiche(s) du propriétaire connecté, quel qu'en soit le type. */
export async function proListPartners(type) {
  await load();
  const user = requireUser();
  return db[PARTNER_COLLECTIONS[type]]
    .filter((p) => p.owner_id === user.id)
    .map(decoratePartner);
}

export async function proUpdatePartner(type, id, patch) {
  await load();
  const user = requireUser();
  const partner = db[PARTNER_COLLECTIONS[type]].find((p) => p.id === id);
  if (!partner) throw new Error('PARTNER_NOT_FOUND');
  if (partner.owner_id !== user.id) throw new Error('FORBIDDEN');
  Object.assign(partner, patch);
  persist();
  return decoratePartner(partner);
}

/** §13 — demande de devis envoyée par un client à un traiteur ou un halouadji. */
export async function createDevisRequest(payload) {
  await load();
  const user = requireUser();
  const { traiteurId, halouadjiId, eventDate, guestCount, message } = payload;
  if (!traiteurId === !halouadjiId) {
    // Les deux absents ou les deux présents : ni l'un ni l'autre n'est valide.
    throw new Error('INVALID_PARTNER');
  }

  const devis = {
    id: uid('devis'),
    client_id: user.id,
    traiteur_id: traiteurId || null,
    halouadji_id: halouadjiId || null,
    event_date: eventDate || null,
    guest_count: guestCount != null ? Number(guestCount) : null,
    message: message || '',
    status: 'pending',
    pro_reply: null,
    created_at: new Date().toISOString(),
    responded_at: null,
  };
  db.devis_requests.push(devis);

  const ownerId = traiteurId
    ? db.traiteurs.find((t) => t.id === traiteurId)?.owner_id
    : db.halouadjis.find((h) => h.id === halouadjiId)?.owner_id;
  if (ownerId) {
    pushNotifications(
      buildNotifications({
        type: 'new_devis_request',
        userId: ownerId,
        title: 'Nouvelle demande de devis',
        body: 'Une nouvelle demande vous attend.',
        data: { devis_id: devis.id },
      })
    );
  }

  persist();
  return clone(devis);
}

export async function listMyDevisRequests() {
  await load();
  const user = requireUser();
  return db.devis_requests
    .filter((d) => d.client_id === user.id)
    .map(clone)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

/** Demandes reçues par la fiche `partnerId` du propriétaire connecté. */
export async function proListDevisRequests(type, partnerId) {
  await load();
  const user = requireUser();
  const partner = db[PARTNER_COLLECTIONS[type]].find((p) => p.id === partnerId);
  if (!partner || partner.owner_id !== user.id) throw new Error('FORBIDDEN');

  const key = type === 'traiteur' ? 'traiteur_id' : 'halouadji_id';
  return db.devis_requests
    .filter((d) => d[key] === partnerId)
    .map(clone)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

export async function respondDevisRequest(id, status, reply) {
  await load();
  const user = requireUser();
  if (!['accepted', 'declined'].includes(status)) throw new Error('INVALID_STATUS');

  const devis = db.devis_requests.find((d) => d.id === id);
  if (!devis) throw new Error('DEVIS_NOT_FOUND');
  if (devis.status !== 'pending') throw new Error('DEVIS_ALREADY_ANSWERED');

  const owner = devis.traiteur_id
    ? db.traiteurs.find((t) => t.id === devis.traiteur_id)?.owner_id
    : db.halouadjis.find((h) => h.id === devis.halouadji_id)?.owner_id;
  if (owner !== user.id) throw new Error('FORBIDDEN');

  devis.status = status;
  devis.pro_reply = reply || null;
  devis.responded_at = new Date().toISOString();

  pushNotifications(
    buildNotifications({
      type: status === 'accepted' ? 'devis_accepted' : 'devis_declined',
      userId: devis.client_id,
      title: status === 'accepted' ? 'Devis accepté' : 'Devis refusé',
      body:
        reply ||
        (status === 'accepted'
          ? 'Le professionnel a accepté votre demande de devis.'
          : "Le professionnel n’a pas pu donner suite à votre demande."),
      data: { devis_id: devis.id },
    })
  );

  persist();
  return clone(devis);
}

export async function adminListPendingPartners() {
  await load();
  requireAdmin();

  const pending = (type) =>
    db[PARTNER_COLLECTIONS[type]]
      .filter((p) => p.status === 'pending')
      .map((p) => ({ ...decoratePartner(p), type, owner: clone(db.users.find((u) => u.id === p.owner_id)) || null }));

  return [...pending('traiteur'), ...pending('halouadji')].sort(
    (a, b) => new Date(a.created_at) - new Date(b.created_at)
  );
}

export async function adminReviewPartner(type, id, approved) {
  await load();
  requireAdmin();

  const partner = db[PARTNER_COLLECTIONS[type]].find((p) => p.id === id);
  if (!partner) throw new Error('PARTNER_NOT_FOUND');

  partner.status = approved ? 'active' : 'inactive';
  if (approved) rewardReferral(partner.owner_id);

  pushNotifications(
    buildNotifications({
      type: approved ? 'partner_approved' : 'partner_rejected',
      userId: partner.owner_id,
      title: approved ? 'Votre fiche est en ligne' : 'Votre fiche n’a pas été validée',
      body: approved
        ? `${partner.name} est désormais visible par les familles.`
        : `${partner.name} n’a pas pu être validée. Contactez le support pour en connaître la raison.`,
      data: { partner_type: type, partner_id: partner.id },
    })
  );

  persist();
  return decoratePartner(partner);
}

// ── Réservations pro (§9.4) ───────────────────────────────────────────────

/** Toutes les salles du propriétaire connecté, dans l'ordre de création. */
export async function proListSalles() {
  await load();
  const user = requireUser();
  return db.salles
    .filter((s) => s.owner_id === user.id)
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    .map(decorateSalle);
}

/**
 * Résout la salle sur laquelle porte l'appel et vérifie qu'elle appartient
 * bien au propriétaire connecté. Sans identifiant, on retombe sur sa première
 * salle — le cas courant, un pro n'en ayant souvent qu'une.
 */
function proSalle(salleId) {
  const user = requireUser();
  const miennes = db.salles.filter((s) => s.owner_id === user.id);
  if (miennes.length === 0) throw new Error('NO_SALLE');

  if (!salleId) return { user, salle: miennes[0] };

  const salle = miennes.find((s) => s.id === salleId);
  if (!salle) {
    // La salle existe peut-être, mais pas pour ce propriétaire.
    const err = new Error('FORBIDDEN');
    err.code = 'FORBIDDEN';
    throw err;
  }
  return { user, salle };
}

/** Vérifie la propriété d'une salle désignée indirectement (par une réservation, un avis). */
function assertOwns(salleId) {
  const user = requireUser();
  const salle = db.salles.find((s) => s.id === salleId && s.owner_id === user.id);
  if (!salle) {
    const err = new Error('FORBIDDEN');
    err.code = 'FORBIDDEN';
    throw err;
  }
  return { user, salle };
}

export async function proListReservations(salleId, filter = 'all') {
  await load();
  const { salle } = proSalle(salleId);
  const today = todayISO();

  let rows = db.reservations.filter((r) => r.salle_id === salle.id);
  if (filter === 'pending') rows = rows.filter((r) => r.status === RESERVATION_STATUS.PENDING);
  if (filter === 'confirmed') rows = rows.filter((r) => r.status === RESERVATION_STATUS.CONFIRMED);
  if (filter === 'cancelled') rows = rows.filter((r) => r.status === RESERVATION_STATUS.CANCELLED);
  if (filter === 'past') rows = rows.filter((r) => r.event_date < today);

  return rows
    .map((r) => ({ ...clone(r), formula: clone(db.tarifs.find((t) => t.id === r.formula_id)) || null }))
    .sort((a, b) => new Date(a.event_date) - new Date(b.event_date));
}

/** §9.4 + §10.1 — confirmation avec acompte et signature PIN. */
export async function proConfirmReservation(id, { depositAmount, ccp, pin }) {
  await load();
  const cible = db.reservations.find((x) => x.id === id);
  if (!cible) throw new Error('RESERVATION_NOT_FOUND');
  // La salle est celle de la réservation : c'est elle qui doit appartenir au pro.
  const { user, salle } = assertOwns(cible.salle_id);

  if (user.pin && String(pin) !== String(user.pin)) {
    const err = new Error('WRONG_PIN');
    err.code = 'WRONG_PIN';
    throw err;
  }
  if (!user.pin) user.pin = String(pin); // premier usage : le PIN est défini

  const r = db.reservations.find((x) => x.id === id && x.salle_id === salle.id);
  if (!r) throw new Error('RESERVATION_NOT_FOUND');

  const conflict = db.reservations.find(
    (x) =>
      x.salle_id === salle.id &&
      x.event_date === r.event_date &&
      x.status === RESERVATION_STATUS.CONFIRMED &&
      x.id !== r.id
  );
  if (conflict) {
    const err = new Error('DAY_TAKEN');
    err.code = 'DAY_TAKEN';
    throw err;
  }

  r.status = RESERVATION_STATUS.CONFIRMED;
  r.deposit_amount = Number(depositAmount) || null;
  r.signed_at = new Date().toISOString();
  r.updated_at = r.signed_at;
  if (ccp) user.ccp = ccp;

  pushNotifications(
    buildNotifications({
      type: 'reservation_confirmed',
      userId: r.client_id,
      title: 'Réservation confirmée',
      body: `Votre réservation à ${salle.name} le ${r.event_date} est confirmée. Réf. ${r.reference}.`,
      data: { reservation_id: r.id },
      smsText: SMS_TEMPLATES.reservation_confirmed({
        salle: salle.name,
        date: r.event_date,
        ref: r.reference,
      }),
    })
  );

  if (r.deposit_amount) {
    pushNotifications(
      buildNotifications({
        type: 'deposit_requested',
        userId: r.client_id,
        title: 'Acompte demandé',
        body: `${salle.name} demande un acompte de ${formatDA(r.deposit_amount)}. CCP : ${user.ccp || '—'}.`,
        data: { reservation_id: r.id },
        smsText: SMS_TEMPLATES.deposit_requested({
          pro: salle.name,
          amount: r.deposit_amount,
          ccp: user.ccp || '—',
          ref: r.reference,
        }),
      })
    );
  }

  persist();
  return clone(r);
}

export async function proCancelReservation(id, reason) {
  await load();
  const r = db.reservations.find((x) => x.id === id);
  if (!r) throw new Error('RESERVATION_NOT_FOUND');
  const { salle } = assertOwns(r.salle_id);

  r.status = RESERVATION_STATUS.CANCELLED;
  r.pro_notes = reason || null;
  r.updated_at = new Date().toISOString();

  pushNotifications(
    buildNotifications({
      type: 'reservation_cancelled',
      userId: r.client_id,
      title: 'Demande refusée',
      body: `Votre demande pour ${salle.name} le ${r.event_date} n'a pas pu être retenue.${reason ? ` Motif : ${reason}` : ''}`,
      data: { reservation_id: r.id },
      smsText: SMS_TEMPLATES.reservation_cancelled({
        salle: salle.name,
        date: r.event_date,
        ref: r.reference,
      }),
    })
  );
  persist();
  return clone(r);
}

export async function proVerifyDeposit(id) {
  await load();
  const r = db.reservations.find((x) => x.id === id);
  if (!r) throw new Error('RESERVATION_NOT_FOUND');
  const { salle } = assertOwns(r.salle_id);

  r.deposit_paid = true;
  r.deposit_paid_at = new Date().toISOString();
  r.updated_at = r.deposit_paid_at;

  pushNotifications(
    buildNotifications({
      type: 'deposit_verified',
      userId: r.client_id,
      title: 'Acompte reçu',
      body: `${salle.name} confirme la réception de votre acompte. Réf. ${r.reference}.`,
      data: { reservation_id: r.id },
    })
  );
  persist();
  return clone(r);
}

// ── Planning pro (§5.3) ───────────────────────────────────────────────────

export async function proGetPlanning(salleId, year, month) {
  await load();
  const { salle } = proSalle(salleId);
  const availability = await getAvailability(salle.id, year, month);
  const reservations = db.reservations.filter(
    (r) => r.salle_id === salle.id && r.status !== RESERVATION_STATUS.CANCELLED
  );

  const byDay = {};
  reservations.forEach((r) => {
    byDay[r.event_date] = {
      ...clone(r),
      formula: clone(db.tarifs.find((t) => t.id === r.formula_id)) || null,
    };
  });

  return { availability, byDay, salleId: salle.id, salleName: salle.name };
}

export async function proToggleBlockedDay(salleId, day) {
  await load();
  const { salle } = proSalle(salleId);
  const idx = db.blocked_days.findIndex((b) => b.salle_id === salle.id && b.day === day);
  if (idx >= 0) db.blocked_days.splice(idx, 1);
  else db.blocked_days.push({ salle_id: salle.id, day });
  persist();
  return idx < 0;
}

// ── Dashboard & statistiques pro (§5.2, §5.6) ─────────────────────────────

function monthKey(iso) {
  return iso.slice(0, 7);
}

export async function proGetDashboard(salleId) {
  await load();
  const { user, salle } = proSalle(salleId);
  const today = todayISO();
  const thisMonth = monthKey(today);
  const prevMonth = monthKey(addDays(`${thisMonth}-01`, -1));

  const all = db.reservations.filter((r) => r.salle_id === salle.id);
  const inMonth = (m) => all.filter((r) => monthKey(r.event_date) === m);

  const current = inMonth(thisMonth);
  const previous = inMonth(prevMonth);

  const revenue = (rows) =>
    rows
      .filter((r) => r.status === RESERVATION_STATUS.CONFIRMED || r.status === RESERVATION_STATUS.COMPLETED)
      .reduce((acc, r) => acc + (r.total_amount || 0), 0);

  const confirmRate = (rows) => {
    const decided = rows.filter((r) => r.status !== RESERVATION_STATUS.PENDING);
    if (!decided.length) return null;
    const ok = decided.filter(
      (r) => r.status === RESERVATION_STATUS.CONFIRMED || r.status === RESERVATION_STATUS.COMPLETED
    );
    return Math.round((ok.length / decided.length) * 100);
  };

  const rating = ratingOf(salle.id);
  const pending = all.filter((r) => r.status === RESERVATION_STATUS.PENDING);

  const sub = db.subscriptions.find((s) => s.pro_id === user.id);
  const trialDaysLeft = sub?.trial_ends_at
    ? Math.max(0, Math.round((new Date(sub.trial_ends_at) - new Date(today)) / 86_400_000))
    : 0;

  // 6 derniers mois de revenus (§5.2 graphique)
  const revenueSeries = [];
  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    const key = toISODate(d).slice(0, 7);
    revenueSeries.push({ month: d.getMonth(), key, value: revenue(inMonth(key)) });
  }

  const upcoming = all
    .filter((r) => r.event_date >= today && r.status !== RESERVATION_STATUS.CANCELLED)
    .sort((a, b) => new Date(a.event_date) - new Date(b.event_date))
    .slice(0, 6)
    .map((r) => ({ ...clone(r), formula: clone(db.tarifs.find((t) => t.id === r.formula_id)) || null }));

  const pendingReviews = db.reviews.filter(
    (r) => r.salle_id === salle.id && r.status === REVIEW_STATUS.PENDING && !isPubliclyVisible(r)
  ).length;

  return {
    salle: decorateSalle(salle),
    pro: clone(user),
    kpis: {
      reservations: { value: current.length, delta: current.length - previous.length },
      revenue: { value: revenue(current), delta: percentDelta(revenue(current), revenue(previous)) },
      confirmRate: { value: confirmRate(current), delta: deltaPoints(confirmRate(current), confirmRate(previous)) },
      rating: { value: rating.rating ?? salle.rating, count: rating.reviews_count || salle.reviews_count },
    },
    revenueSeries,
    pendingCount: pending.length,
    pendingReviews,
    trialDaysLeft,
    subscriptionStatus: sub?.status || SUBSCRIPTION_STATUS.TRIAL,
    upcoming,
  };
}

function percentDelta(current, previous) {
  if (!previous) return current ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

function deltaPoints(current, previous) {
  if (current == null || previous == null) return 0;
  return current - previous;
}

export async function proGetStats(salleId) {
  await load();
  const { salle } = proSalle(salleId);
  const all = db.reservations.filter(
    (r) => r.salle_id === salle.id && r.status !== RESERVATION_STATUS.CANCELLED
  );

  const byType = {};
  all.forEach((r) => {
    byType[r.event_type] = (byType[r.event_type] || 0) + 1;
  });
  const total = all.length || 1;
  const eventTypes = Object.entries(byType)
    .map(([type, count]) => ({ type, count, percent: Math.round((count / total) * 100) }))
    .sort((a, b) => b.count - a.count);

  const bySource = {};
  all.forEach((r) => {
    const s = r.source || 'other';
    bySource[s] = (bySource[s] || 0) + 1;
  });
  const sources = Object.entries(bySource)
    .map(([source, count]) => ({ source, count, percent: Math.round((count / total) * 100) }))
    .sort((a, b) => b.count - a.count);

  // Taux d'occupation : jours réservés / jours du mois, sur 6 mois
  const occupancy = [];
  const revenueSeries = [];
  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    const key = toISODate(d).slice(0, 7);
    const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    const booked = all.filter((r) => monthKey(r.event_date) === key).length;
    occupancy.push({
      key,
      month: d.getMonth(),
      percent: Math.round((booked / daysInMonth) * 100),
    });
    revenueSeries.push({
      key,
      month: d.getMonth(),
      value: all
        .filter((r) => monthKey(r.event_date) === key)
        .reduce((acc, r) => acc + (r.total_amount || 0), 0),
    });
  }

  return { eventTypes, sources, occupancy, revenueSeries };
}

// ── Ma salle (§5.5) ───────────────────────────────────────────────────────

export async function proGetSalle(salleId) {
  await load();
  const { salle } = proSalle(salleId);
  return decorateSalle(salle);
}

export async function proUpdateSalle(salleId, patch) {
  await load();
  const { salle } = proSalle(salleId);
  Object.assign(salle, {
    name: patch.name ?? salle.name,
    city: patch.city ?? salle.city,
    address: patch.address ?? salle.address,
    capacity_max: patch.capacity_max != null ? Number(patch.capacity_max) : salle.capacity_max,
    parking_places: patch.parking_places != null ? Number(patch.parking_places) : salle.parking_places,
    description: patch.description ?? salle.description,
    amenities: patch.amenities ?? salle.amenities,
    photos: patch.photos ?? salle.photos,
  });
  persist();
  return decorateSalle(salle);
}

export async function proUpdateTarifs(salleId, list) {
  await load();
  const { salle } = proSalle(salleId);
  db.tarifs = db.tarifs.filter((t) => t.salle_id !== salle.id);
  list.forEach((t, i) => {
    db.tarifs.push({
      id: t.id || uid('tarif'),
      salle_id: salle.id,
      name: t.name,
      description: t.description || '',
      price: Number(t.price) || 0,
      sort_order: i,
    });
  });
  persist();
  return tarifsOf(salle.id);
}

// ── Avis (§9.6) ───────────────────────────────────────────────────────────

export async function createReview(payload) {
  await load();
  const user = requireUser();
  const reservation = db.reservations.find((r) => r.id === payload.reservation_id);
  if (!reservation) throw new Error('RESERVATION_NOT_FOUND');

  // §10.2 — un avis ne peut être déposé que 48 h après l'événement
  const hoursSinceEvent = (Date.now() - new Date(`${reservation.event_date}T23:59:59`).getTime()) / 3_600_000;
  if (hoursSinceEvent < REVIEW_DELAY_HOURS) {
    const err = new Error('TOO_EARLY');
    err.code = 'TOO_EARLY';
    throw err;
  }

  const review = {
    id: uid('review'),
    reservation_id: reservation.id,
    client_id: user.id,
    client_name: user.full_name,
    salle_id: reservation.salle_id,
    event_type: reservation.event_type,
    rating_overall: payload.rating_overall,
    rating_salle: payload.rating_salle ?? null,
    rating_traiteur: payload.rating_traiteur ?? null,
    rating_proprete: payload.rating_proprete ?? null,
    rating_value: payload.rating_value ?? null,
    comment: payload.comment || '',
    photos: payload.photos || [],
    latitude: payload.latitude ?? null,
    longitude: payload.longitude ?? null,
    // §7.4 — badge "client confirmé" si la réservation est terminée
    is_verified: reservation.status === RESERVATION_STATUS.COMPLETED,
    status: REVIEW_STATUS.PENDING,
    pro_reply: null,
    pro_replied_at: null,
    created_at: new Date().toISOString(),
  };
  db.reviews.unshift(review);

  const salle = db.salles.find((s) => s.id === reservation.salle_id);
  if (salle) {
    pushNotifications(
      buildNotifications({
        type: 'review_pending',
        userId: salle.owner_id,
        title: 'Nouvel avis en attente',
        body: `${review.client_name || 'Un client'} a déposé un avis. Vous avez 24 h pour le modérer.`,
        data: { review_id: review.id },
      })
    );
  }
  persist();
  return clone(review);
}

export async function proListPendingReviews(salleId) {
  await load();
  const { salle } = proSalle(salleId);
  return clone(
    db.reviews.filter(
      (r) => r.salle_id === salle.id && r.status === REVIEW_STATUS.PENDING && !isPubliclyVisible(r)
    )
  );
}

export async function proModerateReview(id, action, replyText) {
  await load();
  const review = db.reviews.find((r) => r.id === id);
  if (!review) throw new Error('REVIEW_NOT_FOUND');
  const { salle } = assertOwns(review.salle_id);

  if (action === 'approve') review.status = REVIEW_STATUS.APPROVED;
  // §10.2 — un pro ne peut pas supprimer un avis, seulement le signaler
  if (action === 'flag') review.status = REVIEW_STATUS.FLAGGED;
  if (action === 'reply') {
    review.pro_reply = replyText;
    review.pro_replied_at = new Date().toISOString();
    if (review.status === REVIEW_STATUS.PENDING) review.status = REVIEW_STATUS.APPROVED;
  }

  if (action === 'approve' || action === 'reply') {
    pushNotifications(
      buildNotifications({
        type: 'review_approved',
        userId: review.client_id,
        title: 'Votre avis est publié',
        body: `Merci ! Votre avis sur ${salle.name} est maintenant visible.`,
        data: { review_id: review.id },
      })
    );
  }
  persist();
  return clone(review);
}

// ── Messagerie (§9.5) ─────────────────────────────────────────────────────

export async function listConversations() {
  await load();
  const user = requireUser();
  const isPro = user.role === ROLES.PRO;

  const relevant = db.reservations.filter((r) =>
    isPro ? db.salles.some((s) => s.id === r.salle_id && s.owner_id === user.id) : r.client_id === user.id
  );

  return relevant
    .map((r) => {
      const msgs = db.messages.filter((m) => m.reservation_id === r.id);
      const last = msgs[msgs.length - 1] || null;
      const salle = db.salles.find((s) => s.id === r.salle_id);
      return {
        reservation_id: r.id,
        reference: r.reference,
        title: isPro ? r.client_name : salle?.name,
        subtitle: `${r.event_type} · ${r.event_date}`,
        last_message: last?.content || null,
        last_at: last?.created_at || r.created_at,
        unread: msgs.filter((m) => !m.is_read && m.sender_id !== user.id).length,
      };
    })
    .filter((c) => c.last_message || c.unread > 0 || true)
    .sort((a, b) => new Date(b.last_at) - new Date(a.last_at));
}

export async function listMessages(reservationId) {
  await load();
  const user = requireUser();
  db.messages
    .filter((m) => m.reservation_id === reservationId && m.sender_id !== user.id)
    .forEach((m) => {
      m.is_read = true;
    });
  persist();
  return clone(db.messages.filter((m) => m.reservation_id === reservationId));
}

export async function sendMessage(reservationId, content) {
  await load();
  const user = requireUser();
  const message = {
    id: uid('msg'),
    reservation_id: reservationId,
    sender_id: user.id,
    content,
    attachments: [],
    is_read: false,
    created_at: new Date().toISOString(),
  };
  db.messages.push(message);

  const reservation = db.reservations.find((r) => r.id === reservationId);
  const salle = reservation ? db.salles.find((s) => s.id === reservation.salle_id) : null;
  if (reservation && salle) {
    const recipient = user.id === reservation.client_id ? salle.owner_id : reservation.client_id;
    pushNotifications(
      buildNotifications({
        type: 'message_new',
        userId: recipient,
        title: 'Nouveau message',
        body: content.slice(0, 120),
        data: { reservation_id: reservationId },
      })
    );
  }
  persist();
  return clone(message);
}

// ── Notifications (§6.4) ──────────────────────────────────────────────────

export async function listNotifications() {
  await load();
  const user = requireUser();
  return clone(
    db.notifications
      .filter((n) => n.user_id === user.id && n.channel !== 'sms')
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  );
}

export async function unreadCount() {
  await load();
  const user = currentUser();
  if (!user) return 0;
  return db.notifications.filter((n) => n.user_id === user.id && n.channel !== 'sms' && !n.is_read).length;
}

export async function markAllNotificationsRead() {
  await load();
  const user = requireUser();
  db.notifications.filter((n) => n.user_id === user.id).forEach((n) => {
    n.is_read = true;
  });
  persist();
  return { ok: true };
}

export async function markNotificationRead(id) {
  await load();
  const n = db.notifications.find((x) => x.id === id);
  if (n) n.is_read = true;
  persist();
  return { ok: true };
}

/** Journal SMS — utile pour vérifier l'application des règles §10.4. */
export async function listSmsLog() {
  await load();
  const user = requireUser();
  return clone(db.notifications.filter((n) => n.user_id === user.id && n.channel === 'sms'));
}

// ── Abonnement (§9.8) ─────────────────────────────────────────────────────

export async function getSubscription() {
  await load();
  // Un abonnement par propriétaire : 500 DA donnent accès à toutes ses salles.
  const user = requireUser();
  const sub = db.subscriptions.find((s) => s.pro_id === user.id);
  if (!sub) return null;

  const today = todayISO();
  const daysLeft = Math.max(0, Math.round((new Date(sub.trial_ends_at) - new Date(today)) / 86_400_000));
  const daysUsed = TRIAL_DAYS - daysLeft;

  return { ...clone(sub), daysLeft, daysUsed, trialTotal: TRIAL_DAYS };
}

export async function setPaymentMethod(method, details) {
  await load();
  const user = requireUser();
  const sub = db.subscriptions.find((s) => s.pro_id === user.id);
  if (!sub) throw new Error('NO_SUBSCRIPTION');
  sub.payment_method = method;
  sub.payment_details = details || null;
  persist();
  return clone(sub);
}

export async function listInvoices() {
  await load();
  const user = requireUser();
  // Comme côté Supabase, où la policy RLS ne laisse passer que ses lignes :
  // sans ce filtre, un pro verrait la facturation de tous les autres.
  return clone(db.invoices.filter((i) => i.pro_id === user.id));
}

// ── Codes promotionnels (§12 Phase 4) ─────────────────────────────────────

function findPromo(salleId, code) {
  const cible = normalizePromoCode(code);
  return db.promo_codes.find((p) => p.salle_id === salleId && p.code === cible) || null;
}

/**
 * Vérifie un code saisi par un client, sans rien consommer.
 * Sert à l'aperçu de la remise avant l'envoi de la demande.
 */
export async function checkPromoCode(salleId, code, amount) {
  await load();
  const promo = findPromo(salleId, code);
  const verdict = checkPromo(promo, { amount });
  if (!verdict.ok) {
    const err = new Error('PROMO_REFUSED');
    err.code = 'PROMO_REFUSED';
    err.reason = verdict.reason;
    throw err;
  }
  return { code: promo.code, kind: promo.kind, value: promo.value, ...verdict };
}

export async function proListPromoCodes(salleId) {
  await load();
  const { salle } = proSalle(salleId);
  return db.promo_codes
    .filter((p) => p.salle_id === salle.id)
    .map((p) => clone(p))
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
}

export async function proCreatePromoCode(salleId, payload) {
  await load();
  const { salle } = proSalle(salleId);

  const verdict = validatePromoPayload(payload);
  if (!verdict.ok) {
    const err = new Error('PROMO_INVALID');
    err.code = 'PROMO_INVALID';
    err.reason = verdict.reason;
    throw err;
  }

  // Deux salles peuvent porter le même code ; une seule fois chacune.
  if (findPromo(salle.id, verdict.code)) {
    const err = new Error('PROMO_DUPLICATE');
    err.code = 'PROMO_DUPLICATE';
    throw err;
  }

  const promo = {
    id: uid('promo'),
    salle_id: salle.id,
    code: verdict.code,
    kind: verdict.kind,
    value: verdict.value,
    starts_on: payload.starts_on || null,
    ends_on: payload.ends_on || null,
    max_uses: payload.max_uses === '' || payload.max_uses == null ? null : Number(payload.max_uses),
    used_count: 0,
    active: true,
    created_at: new Date().toISOString(),
  };
  db.promo_codes.unshift(promo);
  persist();
  return clone(promo);
}

export async function proUpdatePromoCode(id, patch) {
  await load();
  const promo = db.promo_codes.find((p) => p.id === id);
  if (!promo) throw new Error('PROMO_NOT_FOUND');
  assertOwns(promo.salle_id);

  // Le code lui-même ne se modifie pas : il circule déjà chez des clients, et
  // le renommer invaliderait ce qu'ils ont noté. On désactive, on recrée.
  if (patch.active != null) promo.active = Boolean(patch.active);
  if (patch.ends_on !== undefined) promo.ends_on = patch.ends_on || null;
  if (patch.max_uses !== undefined) {
    promo.max_uses = patch.max_uses === '' || patch.max_uses == null ? null : Number(patch.max_uses);
  }

  persist();
  return clone(promo);
}

export async function proDeletePromoCode(id) {
  await load();
  const promo = db.promo_codes.find((p) => p.id === id);
  if (!promo) throw new Error('PROMO_NOT_FOUND');
  assertOwns(promo.salle_id);

  // Un code déjà utilisé est conservé : les réservations qui le portent
  // doivent rester lisibles. Il est seulement retiré de la circulation.
  if ((promo.used_count ?? 0) > 0) {
    promo.active = false;
    persist();
    return { deleted: false, deactivated: true };
  }

  db.promo_codes = db.promo_codes.filter((p) => p.id !== id);
  persist();
  return { deleted: true, deactivated: false };
}

// ── Parrainage entre propriétaires (§12 Phase 4) ──────────────────────────

function uniqueReferralCode() {
  // Une collision reste possible sur 31^6 : on retire jusqu'à en trouver un
  // libre plutôt que d'espérer.
  for (let i = 0; i < 50; i += 1) {
    const code = generateReferralCode();
    if (!db.users.some((u) => u.referral_code === code)) return code;
  }
  throw new Error('REFERRAL_CODE_EXHAUSTED');
}

function findByReferralCode(code) {
  const cible = normalizeReferralCode(code);
  if (!cible) return null;
  return db.users.find((u) => u.referral_code === cible) || null;
}

/** Total de jours déjà gagnés par un parrain, tous filleuls confondus. */
function referralDaysEarned(userId) {
  return db.referrals
    .filter((r) => r.referrer_id === userId && r.status === REFERRAL_STATUS.REWARDED)
    .reduce((total, r) => total + (r.days_granted || 0), 0);
}

/** Ajoute des jours à l'abonnement d'un propriétaire. */
function extendSubscription(userId, days) {
  if (days <= 0) return 0;
  const sub = db.subscriptions.find((x) => x.pro_id === userId);
  if (!sub) return 0;

  const cible = extendedDeadline({
    trialEndsAt: sub.trial_ends_at,
    periodEndsAt: sub.current_period_end,
    days,
    today: todayISO(),
  });

  if (sub.current_period_end) sub.current_period_end = cible;
  else sub.trial_ends_at = cible;

  return days;
}

/**
 * Verse la récompense due au titre d'un filleul dont la salle vient d'être
 * validée. Sans effet si le lien n'existe pas ou a déjà été honoré.
 */
function rewardReferral(filleulId) {
  const lien = db.referrals.find(
    (r) => r.referred_id === filleulId && r.status === REFERRAL_STATUS.PENDING
  );
  if (!lien) return;

  const pourParrain = referralGrant(referralDaysEarned(lien.referrer_id));
  const donnes = extendSubscription(lien.referrer_id, pourParrain);

  // Le filleul reçoit sa part sans plafond : c'est sa seule occasion.
  const pourFilleul = referralGrant(0);
  extendSubscription(filleulId, pourFilleul);

  lien.status = REFERRAL_STATUS.REWARDED;
  lien.days_granted = donnes;
  lien.rewarded_at = new Date().toISOString();

  if (donnes > 0) {
    pushNotifications(
      buildNotifications({
        type: 'referral_rewarded',
        userId: lien.referrer_id,
        title: 'Parrainage récompensé',
        body: `Votre filleul est en ligne : ${donnes} jours d'abonnement vous sont offerts.`,
        data: { referral_id: lien.id },
      })
    );
  }
  if (pourFilleul > 0) {
    pushNotifications(
      buildNotifications({
        type: 'referral_rewarded',
        userId: filleulId,
        title: 'Bienvenue, offert',
        body: `${pourFilleul} jours d'abonnement vous sont offerts grâce à votre parrain.`,
        data: { referral_id: lien.id },
      })
    );
  }
}

/** Tableau de parrainage du propriétaire connecté. */
export async function getReferralSummary() {
  await load();
  const user = requireUser();

  // Un propriétaire inscrit avant l'ouverture du parrainage n'a pas de code.
  if (!user.referral_code) {
    user.referral_code = uniqueReferralCode();
    persist();
  }

  const filleuls = db.referrals
    .filter((r) => r.referrer_id === user.id)
    .map((r) => {
      const u = db.users.find((x) => x.id === r.referred_id);
      const salle = db.salles.find((s) => s.owner_id === r.referred_id);
      return {
        id: r.id,
        name: u?.full_name || null,
        salle_name: salle?.name || null,
        status: r.status,
        days_granted: r.days_granted,
        created_at: r.created_at,
      };
    })
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));

  const gagnes = referralDaysEarned(user.id);

  return {
    code: user.referral_code,
    filleuls,
    daysEarned: gagnes,
    daysRemaining: referralGrant(gagnes),
    pendingCount: filleuls.filter((f) => f.status === REFERRAL_STATUS.PENDING).length,
  };
}

/** Vérifie un code saisi à l'inscription, sans nouer le lien. */
export async function checkReferralCode(code) {
  await load();
  const user = currentUser();
  const parrain = findByReferralCode(code);
  const verdict = checkReferral({
    parrain,
    filleul: user,
    dejaParraine: user ? db.referrals.some((r) => r.referred_id === user.id) : false,
  });
  if (!verdict.ok) {
    const err = new Error('REFERRAL_REFUSED');
    err.code = 'REFERRAL_REFUSED';
    err.reason = verdict.reason;
    throw err;
  }
  return { ok: true, referrer_name: parrain.full_name };
}

// ── Console d'administration (§2.1) ───────────────────────────────────────

function requireAdmin() {
  const user = requireUser();
  if (user.role !== ROLES.ADMIN) {
    const err = new Error('FORBIDDEN');
    err.code = 'FORBIDDEN';
    throw err;
  }
  return user;
}

/** Chiffres de la plateforme, pas d'une salle en particulier. */
export async function adminGetOverview() {
  await load();
  requireAdmin();

  const actives = db.salles.filter((s) => s.status === 'active');
  const enAttente = db.salles.filter((s) => s.status === 'pending');
  const abonnements = db.subscriptions;
  const payants = abonnements.filter((s) => s.status === SUBSCRIPTION_STATUS.ACTIVE);

  const signales = db.reviews.filter((r) => r.status === REVIEW_STATUS.FLAGGED);
  const thisMonth = todayISO().slice(0, 7);

  return {
    salles: { active: actives.length, pending: enAttente.length },
    users: {
      total: db.users.length,
      clients: db.users.filter((u) => u.role === ROLES.CLIENT).length,
      pros: db.users.filter((u) => u.role === ROLES.PRO).length,
    },
    reservations: {
      total: db.reservations.length,
      thisMonth: db.reservations.filter((r) => r.event_date.slice(0, 7) === thisMonth).length,
      confirmed: db.reservations.filter((r) => r.status === RESERVATION_STATUS.CONFIRMED).length,
    },
    reviews: {
      total: db.reviews.length,
      flagged: signales.length,
    },
    subscriptions: {
      trial: abonnements.filter((s) => s.status === SUBSCRIPTION_STATUS.TRIAL).length,
      active: payants.length,
      // Revenu récurrent mensuel : seuls les abonnements payants comptent
      mrr: payants.length * SUBSCRIPTION_PRICE,
    },
  };
}

/** §5.5 — les salles inscrites attendent une validation avant publication. */
export async function adminListPendingSalles() {
  await load();
  requireAdmin();

  return db.salles
    .filter((s) => s.status === 'pending')
    .map((s) => ({
      ...decorateSalle(s),
      owner: clone(db.users.find((u) => u.id === s.owner_id)) || null,
    }))
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
}

export async function adminReviewSalle(salleId, approved) {
  await load();
  requireAdmin();

  const salle = db.salles.find((s) => s.id === salleId);
  if (!salle) throw new Error('SALLE_NOT_FOUND');

  salle.status = approved ? 'active' : 'inactive';

  // La validation par l'humain est la barrière anti-abus du parrainage : la
  // récompense ne part qu'ici, jamais à la simple création d'un compte.
  if (approved) rewardReferral(salle.owner_id);

  pushNotifications(
    buildNotifications({
      type: approved ? 'salle_approved' : 'salle_rejected',
      userId: salle.owner_id,
      title: approved ? 'Votre salle est en ligne' : 'Votre salle n’a pas été validée',
      body: approved
        ? `${salle.name} est désormais visible par les familles.`
        : `${salle.name} n’a pas pu être validée. Contactez le support pour en connaître la raison.`,
      data: { salle_id: salle.id },
    })
  );

  persist();
  return decorateSalle(salle);
}

/** §7.2 — arbitrage des avis signalés par les propriétaires. */
export async function adminListFlaggedReviews() {
  await load();
  requireAdmin();

  return db.reviews
    .filter((r) => r.status === REVIEW_STATUS.FLAGGED)
    .map((r) => ({
      ...clone(r),
      salle: clone(db.salles.find((s) => s.id === r.salle_id)) || null,
    }))
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
}

/**
 * `restore` republie l'avis, `remove` le retire définitivement.
 * L'avis n'est jamais supprimé de la base : seul son statut change, pour
 * qu'un signalement abusif reste traçable.
 */
export async function adminResolveReview(reviewId, action) {
  await load();
  requireAdmin();

  const review = db.reviews.find((r) => r.id === reviewId);
  if (!review) throw new Error('REVIEW_NOT_FOUND');

  review.status = action === 'restore' ? REVIEW_STATUS.APPROVED : REVIEW_STATUS.REJECTED;
  review.moderated_at = new Date().toISOString();

  persist();
  return clone(review);
}
