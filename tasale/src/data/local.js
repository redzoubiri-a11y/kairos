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
} from '../lib/constants';

const STORAGE_KEY = 'tasale.db.v1';
export const DEMO_OTP = '123456';

let db = null;
let writeTimer = null;

function uid(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
}

function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

async function load() {
  if (db) return db;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    db = raw ? JSON.parse(raw) : buildSeed();
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
      preferred_language: 'fr',
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
    status: 'pending',
    is_premium: false,
    rating: null,
    reviews_count: 0,
    distance_km: null,
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
  user.salle_id = salle.id;
  user.pin = payload.pin || null;
  user.ccp = payload.ccp || null;

  // §10.3 — essai gratuit de 90 jours ouvert à l'inscription
  db.subscriptions.push({
    id: uid('sub'),
    pro_id: user.id,
    salle_id: salle.id,
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

  // §10.3 — une salle sans abonnement à jour passe en "non prioritaire"
  const rank = (s) => {
    const sub = db.subscriptions.find((x) => x.salle_id === s.id);
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
    total_amount: tarif ? tarif.price : 0,
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

  // Notifications client + pro (§4.4 « Après envoi »)
  pushNotifications(
    buildNotifications({
      type: 'reservation_sent',
      userId: user.id,
      title: 'Demande transmise',
      body: `Votre demande pour ${salle.name} le ${reservation.event_date} a été transmise. Réf. ${reservation.reference}.`,
      data: { reservation_id: reservation.id },
      smsText: `Tasale : Votre demande pour ${salle.name} le ${reservation.event_date} a bien été transmise. Réf : ${reservation.reference}.`,
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

// ── Réservations pro (§9.4) ───────────────────────────────────────────────

function proSalle() {
  const user = requireUser();
  const salle = db.salles.find((s) => s.owner_id === user.id);
  if (!salle) throw new Error('NO_SALLE');
  return { user, salle };
}

export async function proListReservations(filter = 'all') {
  await load();
  const { salle } = proSalle();
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
  const { user, salle } = proSalle();

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
  const { salle } = proSalle();
  const r = db.reservations.find((x) => x.id === id && x.salle_id === salle.id);
  if (!r) throw new Error('RESERVATION_NOT_FOUND');

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
  const { salle } = proSalle();
  const r = db.reservations.find((x) => x.id === id && x.salle_id === salle.id);
  if (!r) throw new Error('RESERVATION_NOT_FOUND');

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

export async function proGetPlanning(year, month) {
  await load();
  const { salle } = proSalle();
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

  return { availability, byDay, salleId: salle.id };
}

export async function proToggleBlockedDay(day) {
  await load();
  const { salle } = proSalle();
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

export async function proGetDashboard() {
  await load();
  const { user, salle } = proSalle();
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

  const sub = db.subscriptions.find((s) => s.salle_id === salle.id);
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

export async function proGetStats() {
  await load();
  const { salle } = proSalle();
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

export async function proGetSalle() {
  await load();
  const { salle } = proSalle();
  return decorateSalle(salle);
}

export async function proUpdateSalle(patch) {
  await load();
  const { salle } = proSalle();
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

export async function proUpdateTarifs(list) {
  await load();
  const { salle } = proSalle();
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

export async function proListPendingReviews() {
  await load();
  const { salle } = proSalle();
  return clone(
    db.reviews.filter(
      (r) => r.salle_id === salle.id && r.status === REVIEW_STATUS.PENDING && !isPubliclyVisible(r)
    )
  );
}

export async function proModerateReview(id, action, replyText) {
  await load();
  const { salle } = proSalle();
  const review = db.reviews.find((r) => r.id === id && r.salle_id === salle.id);
  if (!review) throw new Error('REVIEW_NOT_FOUND');

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
  const { salle } = proSalle();
  const sub = db.subscriptions.find((s) => s.salle_id === salle.id);
  if (!sub) return null;

  const today = todayISO();
  const daysLeft = Math.max(0, Math.round((new Date(sub.trial_ends_at) - new Date(today)) / 86_400_000));
  const daysUsed = TRIAL_DAYS - daysLeft;

  return { ...clone(sub), daysLeft, daysUsed, trialTotal: TRIAL_DAYS };
}

export async function setPaymentMethod(method, details) {
  await load();
  const { salle } = proSalle();
  const sub = db.subscriptions.find((s) => s.salle_id === salle.id);
  if (!sub) throw new Error('NO_SUBSCRIPTION');
  sub.payment_method = method;
  sub.payment_details = details || null;
  persist();
  return clone(sub);
}

export async function listInvoices() {
  await load();
  return clone(db.invoices);
}
