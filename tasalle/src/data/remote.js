// Adaptateur Supabase — même interface que `local.js`.
// Le schéma correspond à supabase/migrations/0001_init.sql (§8).
// Les règles métier sensibles (confirmation, PIN, avis) sont appliquées
// côté base via des fonctions SQL `SECURITY DEFINER` + RLS.

import { supabase } from './client';
import { validatePromoPayload } from '../lib/promo';
import { normalizePhone, todayISO, toISODate, addDays } from '../lib/format';
import {
  RESERVATION_STATUS,
  REVIEW_STATUS,
  SUBSCRIPTION_STATUS,
  TRIAL_DAYS,
  SUBSCRIPTION_PRICE,
  PARTNER_SUBSCRIPTION_PRICES,
  ROLES,
} from '../lib/constants';

function unwrap({ data, error }) {
  if (error) throw error;
  return data;
}

const SALLE_SELECT = `
  id, owner_id, name, city, address, capacity_max, parking_places,
  description, amenities, photos, status, is_premium, created_at,
  tarifs ( id, salle_id, name, description, price, sort_order )
`;

function decorate(row) {
  if (!row) return row;
  const tarifs = (row.tarifs || []).slice().sort((a, b) => a.sort_order - b.sort_order);
  return {
    ...row,
    tarifs,
    price_from: tarifs.length ? Math.min(...tarifs.map((t) => Number(t.price))) : null,
    rating: row.rating ?? null,
    reviews_count: row.reviews_count ?? 0,
  };
}

// ── Authentification ──────────────────────────────────────────────────────

export async function sendOtp(phone) {
  const { error } = await supabase.auth.signInWithOtp({ phone: normalizePhone(phone) });
  if (error) throw error;
  return { ok: true, demoCode: null };
}

export async function verifyOtp(phone, code) {
  const { data, error } = await supabase.auth.verifyOtp({
    phone: normalizePhone(phone),
    token: code,
    type: 'sms',
  });
  if (error) {
    const err = new Error('INVALID_OTP');
    err.code = 'INVALID_OTP';
    throw err;
  }

  const authUser = data.user;
  let profile = unwrap(
    await supabase.from('users').select('*').eq('id', authUser.id).maybeSingle()
  );

  let isNew = false;
  if (!profile) {
    isNew = true;
    profile = unwrap(
      await supabase
        .from('users')
        .insert({ id: authUser.id, phone: normalizePhone(phone) })
        .select()
        .single()
    );
  }
  return { user: profile, isNew: isNew || !profile.role };
}

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  if (!data?.session?.user) return null;
  return unwrap(
    await supabase.from('users').select('*').eq('id', data.session.user.id).maybeSingle()
  );
}

export async function signOut() {
  await supabase.auth.signOut();
  return { ok: true };
}

async function currentUserId() {
  const { data } = await supabase.auth.getSession();
  const id = data?.session?.user?.id;
  if (!id) throw new Error('NOT_AUTHENTICATED');
  return id;
}

export async function updateProfile(patch) {
  const id = await currentUserId();
  return unwrap(await supabase.from('users').update(patch).eq('id', id).select().single());
}

export async function registerSalle(payload) {
  const id = await currentUserId();

  const salle = unwrap(
    await supabase
      .from('salles')
      .insert({
        owner_id: id,
        name: payload.name,
        city: payload.city,
        address: payload.address || '',
        capacity_max: Number(payload.capacity_max) || 0,
        parking_places: Number(payload.parking_places) || 0,
        description: payload.description || '',
        amenities: payload.amenities || [],
        photos: payload.photos || [],
        status: 'pending',
      })
      .select()
      .single()
  );

  if (payload.tarifs?.length) {
    unwrap(
      await supabase.from('tarifs').insert(
        payload.tarifs.map((t, i) => ({
          salle_id: salle.id,
          name: t.name,
          description: t.description || '',
          price: Number(t.price) || 0,
          sort_order: i,
        }))
      )
    );
  }

  const user = unwrap(
    await supabase
      .from('users')
      .update({ role: ROLES.PRO, ccp: payload.ccp || null })
      .eq('id', id)
      .select()
      .single()
  );

  // Le PIN n'est jamais stocké en clair : hachage côté base (§2.3, §10.1)
  if (payload.pin) {
    unwrap(await supabase.rpc('set_pro_pin', { p_pin: String(payload.pin) }));
  }

  // §10.3 — un seul essai par propriétaire : ajouter une salle ne le relance pas
  const abonnement = unwrap(
    await supabase.from('subscriptions').select('id').eq('pro_id', id).maybeSingle()
  );
  if (!abonnement) {
    unwrap(
      await supabase.from('subscriptions').insert({
        pro_id: id,
        status: SUBSCRIPTION_STATUS.TRIAL,
        trial_ends_at: addDays(todayISO(), TRIAL_DAYS),
        // Posé explicitement : le défaut de la colonne (500, historique)
        // ne reflète plus le vrai tarif depuis §13 (deux tarifs coexistent).
        amount: SUBSCRIPTION_PRICE,
      })
    );
  }

  // §12 Phase 4 — le lien de parrainage se noue ici ; la récompense attend la
  // validation de la salle par un administrateur.
  if (payload.referral_code) {
    const { error } = await supabase.rpc('attach_referral', { p_code: payload.referral_code });
    if (error) {
      const err = new Error('REFERRAL_REFUSED');
      err.code = 'REFERRAL_REFUSED';
      // La base renvoie « REFERRAL_REFUSED: <raison> »
      err.reason = String(error.message || '').split(': ').pop();
      throw err;
    }
  }

  return { salle, user };
}

// ── Parrainage (§12 Phase 4) ──────────────────────────────────────────────

export async function checkReferralCode(code) {
  const verdict = unwrap(await supabase.rpc('check_referral_code', { p_code: code }));
  if (!verdict?.ok) {
    const err = new Error('REFERRAL_REFUSED');
    err.code = 'REFERRAL_REFUSED';
    err.reason = verdict?.reason || 'unknown';
    throw err;
  }
  return verdict;
}

export async function getReferralSummary() {
  return unwrap(await supabase.rpc('referral_summary'));
}

// ── Salles ────────────────────────────────────────────────────────────────

export async function listSalles(filters = {}) {
  let q = supabase.from('salles_public').select(SALLE_SELECT).eq('status', 'active');

  if (filters.city) q = q.eq('city', filters.city);
  if (filters.minCapacity) q = q.gte('capacity_max', filters.minCapacity);
  if (filters.query) {
    const term = `%${filters.query}%`;
    q = q.or(`name.ilike.${term},city.ilike.${term},address.ilike.${term}`);
  }
  if (filters.amenities?.length) q = q.contains('amenities', filters.amenities);

  const rows = unwrap(await q.order('is_premium', { ascending: false }).limit(100));
  let list = (rows || []).map(decorate);
  if (filters.maxPrice) list = list.filter((s) => s.price_from != null && s.price_from <= filters.maxPrice);
  return list;
}

export async function getSalle(id) {
  const row = unwrap(await supabase.from('salles_public').select(SALLE_SELECT).eq('id', id).single());
  return decorate(row);
}

export async function getSalleReviews(salleId, { eventType } = {}) {
  let q = supabase
    .from('reviews_public')
    .select('*')
    .eq('salle_id', salleId)
    .order('created_at', { ascending: false });
  if (eventType && eventType !== 'all') q = q.eq('event_type', eventType);
  return unwrap(await q) || [];
}

export async function getAvailability(salleId, year, month) {
  const from = toISODate(new Date(year, month - 1, 1));
  const to = toISODate(new Date(year, month + 2, 0));
  const rows = unwrap(
    await supabase.rpc('salle_availability', { p_salle: salleId, p_from: from, p_to: to })
  );
  const map = {};
  (rows || []).forEach((r) => {
    map[r.day] = r.state;
  });
  return map;
}

// ── Réservations client ───────────────────────────────────────────────────

export async function createReservation(payload) {
  const row = unwrap(
    await supabase.rpc('create_reservation', {
      p_salle: payload.salle_id,
      p_event_date: payload.event_date,
      p_event_type: payload.event_type,
      p_guest_count: Number(payload.guest_count) || 0,
      p_formula: payload.formula_id,
      p_client_name: payload.client_name,
      p_client_phone: normalizePhone(payload.client_phone),
      p_message: payload.client_message || '',
      p_promo_code: payload.promo_code || null,
    })
  );
  return Array.isArray(row) ? row[0] : row;
}

// ── Codes promotionnels (§12 Phase 4) ─────────────────────────────────────

/**
 * Verdict sur un code saisi, rendu par la base.
 *
 * La table n'est pas lisible par les clients : un code se saisit, il ne se
 * découvre pas en listant. La RPC ne révèle donc que le verdict.
 */
export async function checkPromoCode(salleId, code, amount) {
  const verdict = unwrap(
    await supabase.rpc('check_promo_code', { p_salle: salleId, p_code: code, p_amount: amount })
  );
  if (!verdict?.ok) {
    const err = new Error('PROMO_REFUSED');
    err.code = 'PROMO_REFUSED';
    err.reason = verdict?.reason || 'unknown';
    throw err;
  }
  return verdict;
}

export async function proListPromoCodes(salleId) {
  const cible = await mySalle(salleId);
  return (
    unwrap(
      await supabase
        .from('promo_codes')
        .select('*')
        .eq('salle_id', cible)
        .order('created_at', { ascending: false })
    ) || []
  );
}

export async function proCreatePromoCode(salleId, payload) {
  const cible = await mySalle(salleId);

  const verdict = validatePromoPayload(payload);
  if (!verdict.ok) {
    const err = new Error('PROMO_INVALID');
    err.code = 'PROMO_INVALID';
    err.reason = verdict.reason;
    throw err;
  }

  const { data, error } = await supabase
    .from('promo_codes')
    .insert({
      salle_id: cible,
      code: verdict.code,
      kind: verdict.kind,
      value: verdict.value,
      starts_on: payload.starts_on || null,
      ends_on: payload.ends_on || null,
      max_uses:
        payload.max_uses === '' || payload.max_uses == null ? null : Number(payload.max_uses),
    })
    .select()
    .single();

  // L'index unique par salle porte la règle ; on la traduit en message.
  if (error?.code === '23505') {
    const err = new Error('PROMO_DUPLICATE');
    err.code = 'PROMO_DUPLICATE';
    throw err;
  }
  if (error) throw error;
  return data;
}

export async function proUpdatePromoCode(id, patch) {
  // Le code lui-même n'est pas modifiable : il circule déjà chez des clients.
  const champs = {};
  if (patch.active != null) champs.active = Boolean(patch.active);
  if (patch.ends_on !== undefined) champs.ends_on = patch.ends_on || null;
  if (patch.max_uses !== undefined) {
    champs.max_uses = patch.max_uses === '' || patch.max_uses == null ? null : Number(patch.max_uses);
  }

  // La policy RLS filtre sur le propriétaire : la ligne d'un autre ne revient
  // simplement pas, d'où le FORBIDDEN.
  const row = unwrap(await supabase.from('promo_codes').update(champs).eq('id', id).select().maybeSingle());
  if (!row) {
    const err = new Error('FORBIDDEN');
    err.code = 'FORBIDDEN';
    throw err;
  }
  return row;
}

export async function proDeletePromoCode(id) {
  const promo = unwrap(
    await supabase.from('promo_codes').select('id, used_count').eq('id', id).maybeSingle()
  );
  if (!promo) {
    const err = new Error('FORBIDDEN');
    err.code = 'FORBIDDEN';
    throw err;
  }

  // Un code déjà utilisé reste en base : les réservations qui le portent
  // doivent rester lisibles. Il est seulement retiré de la circulation.
  if ((promo.used_count ?? 0) > 0) {
    await proUpdatePromoCode(id, { active: false });
    return { deleted: false, deactivated: true };
  }

  unwrap(await supabase.from('promo_codes').delete().eq('id', id));
  return { deleted: true, deactivated: false };
}

const RESA_SELECT = `
  *, salle:salles ( id, name, city, address, photos, owner_id ),
  formula:tarifs ( id, name, price )
`;

export async function listMyReservations() {
  const id = await currentUserId();
  const rows =
    unwrap(
      await supabase
        .from('reservations')
        .select(RESA_SELECT)
        .eq('client_id', id)
        .order('created_at', { ascending: false })
    ) || [];

  const ids = rows.map((r) => r.id);
  const reviews = ids.length
    ? unwrap(await supabase.from('reviews').select('reservation_id').in('reservation_id', ids)) || []
    : [];
  const reviewed = new Set(reviews.map((r) => r.reservation_id));
  return rows.map((r) => ({ ...r, has_review: reviewed.has(r.id) }));
}

export async function getReservation(id) {
  const row = unwrap(await supabase.from('reservations').select(RESA_SELECT).eq('id', id).single());
  const reviews = unwrap(await supabase.from('reviews').select('id').eq('reservation_id', id)) || [];
  return { ...row, has_review: reviews.length > 0 };
}

export async function cancelReservation(id) {
  return unwrap(await supabase.rpc('cancel_reservation', { p_reservation: id }));
}

export async function declareDeposit(id) {
  return unwrap(
    await supabase.from('reservations').update({ deposit_declared: true }).eq('id', id).select().single()
  );
}

// ── Favoris ───────────────────────────────────────────────────────────────

export async function listFavorites() {
  const id = await currentUserId();
  const rows =
    unwrap(await supabase.from('favorites').select(`salle:salles_public ( ${SALLE_SELECT} )`).eq('user_id', id)) ||
    [];
  return rows.map((r) => decorate(r.salle)).filter(Boolean);
}

export async function listFavoriteIds() {
  const { data } = await supabase.auth.getSession();
  if (!data?.session?.user) return [];
  const rows =
    unwrap(await supabase.from('favorites').select('salle_id').eq('user_id', data.session.user.id)) || [];
  return rows.map((r) => r.salle_id);
}

export async function toggleFavorite(salleId) {
  const id = await currentUserId();
  const existing = unwrap(
    await supabase.from('favorites').select('salle_id').eq('user_id', id).eq('salle_id', salleId).maybeSingle()
  );
  if (existing) {
    unwrap(await supabase.from('favorites').delete().eq('user_id', id).eq('salle_id', salleId));
    return false;
  }
  unwrap(await supabase.from('favorites').insert({ user_id: id, salle_id: salleId }));
  return true;
}

// ── Traiteurs et halouadjis (§13) ────────────────────────────────────────
// Voir local.js pour le contexte : tables sœurs de `salles`, pas de
// réservation à date bloquée — une demande de devis à la place.

const PARTNER_TABLES = { traiteur: 'traiteurs', halouadji: 'halouadjis' };
const PARTNER_SELECT = 'id, owner_id, name, city, description, specialites, prix_min, prix_max, photos, status, is_premium, created_at';

async function registerPartner(type, payload) {
  const id = await currentUserId();
  const table = PARTNER_TABLES[type];

  const partner = unwrap(
    await supabase
      .from(table)
      .insert({
        owner_id: id,
        name: payload.name,
        city: payload.city,
        description: payload.description || '',
        specialites: payload.specialites || [],
        prix_min: payload.prix_min != null ? Number(payload.prix_min) : null,
        prix_max: payload.prix_max != null ? Number(payload.prix_max) : null,
        photos: payload.photos || [],
        status: 'pending',
      })
      .select()
      .single()
  );

  const user = unwrap(await supabase.from('users').update({ role: ROLES.PRO }).eq('id', id).select().single());

  // §10.3 — même règle qu'une salle : un seul essai par personne.
  const abonnement = unwrap(await supabase.from('subscriptions').select('id').eq('pro_id', id).maybeSingle());
  if (!abonnement) {
    unwrap(
      await supabase
        .from('subscriptions')
        .insert({
          pro_id: id,
          status: SUBSCRIPTION_STATUS.TRIAL,
          trial_ends_at: addDays(todayISO(), TRIAL_DAYS),
          amount: PARTNER_SUBSCRIPTION_PRICES[type],
        })
    );
  }

  return { partner, user };
}

export async function registerTraiteur(payload) {
  return registerPartner('traiteur', payload);
}
export async function registerHalouadji(payload) {
  return registerPartner('halouadji', payload);
}

async function listPartners(type, filters = {}) {
  let q = supabase.from(PARTNER_TABLES[type]).select(PARTNER_SELECT).eq('status', 'active');
  if (filters.city) q = q.eq('city', filters.city);
  if (filters.query) {
    const term = `%${filters.query}%`;
    q = q.or(`name.ilike.${term},city.ilike.${term}`);
  }
  return unwrap(await q.order('is_premium', { ascending: false }).limit(100)) || [];
}

export async function listTraiteurs(filters = {}) {
  return listPartners('traiteur', filters);
}
export async function listHalouadjis(filters = {}) {
  return listPartners('halouadji', filters);
}

export async function getTraiteur(id) {
  return unwrap(await supabase.from('traiteurs').select(PARTNER_SELECT).eq('id', id).single());
}
export async function getHalouadji(id) {
  return unwrap(await supabase.from('halouadjis').select(PARTNER_SELECT).eq('id', id).single());
}

export async function proListPartners(type) {
  const id = await currentUserId();
  return unwrap(await supabase.from(PARTNER_TABLES[type]).select(PARTNER_SELECT).eq('owner_id', id)) || [];
}

export async function proUpdatePartner(type, id, patch) {
  return unwrap(await supabase.from(PARTNER_TABLES[type]).update(patch).eq('id', id).select().single());
}

// La notification au professionnel part du trigger SQL
// `devis_requests_notify_owner` (0012_traiteurs_halouadjis.sql) — pas
// dupliquée ici, contrairement au backend local qui n'a pas de triggers.
export async function createDevisRequest(payload) {
  const id = await currentUserId();
  return unwrap(
    await supabase
      .from('devis_requests')
      .insert({
        client_id: id,
        traiteur_id: payload.traiteurId || null,
        halouadji_id: payload.halouadjiId || null,
        event_date: payload.eventDate || null,
        guest_count: payload.guestCount != null ? Number(payload.guestCount) : null,
        message: payload.message || '',
      })
      .select()
      .single()
  );
}

export async function listMyDevisRequests() {
  const id = await currentUserId();
  return (
    unwrap(
      await supabase.from('devis_requests').select('*').eq('client_id', id).order('created_at', { ascending: false })
    ) || []
  );
}

export async function proListDevisRequests(type, partnerId) {
  const key = type === 'traiteur' ? 'traiteur_id' : 'halouadji_id';
  return (
    unwrap(
      await supabase
        .from('devis_requests')
        .select('*')
        .eq(key, partnerId)
        .order('created_at', { ascending: false })
    ) || []
  );
}

export async function respondDevisRequest(id, status, reply) {
  return unwrap(await supabase.rpc('respond_devis_request', { p_id: id, p_status: status, p_reply: reply || null }));
}

export async function adminListPendingPartners() {
  const results = await Promise.all(
    ['traiteur', 'halouadji'].map(async (type) => {
      const rows =
        unwrap(
          await supabase
            .from(PARTNER_TABLES[type])
            .select(`${PARTNER_SELECT}, owner:users ( id, full_name, phone )`)
            .eq('status', 'pending')
            .order('created_at', { ascending: true })
        ) || [];
      return rows.map((r) => ({ ...r, type }));
    })
  );
  return results.flat().sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
}

export async function adminReviewPartner(type, id, approved) {
  return unwrap(await supabase.rpc('admin_review_partner', { p_type: type, p_id: id, p_approved: approved }));
}

// ── Réservations pro ──────────────────────────────────────────────────────

/** Toutes les salles du propriétaire connecté. */
export async function proListSalles() {
  const id = await currentUserId();
  const rows = unwrap(
    await supabase
      .from('salles')
      .select(SALLE_SELECT)
      .eq('owner_id', id)
      .order('created_at', { ascending: true })
  );
  return (rows || []).map(decorate);
}

/**
 * Résout la salle visée et vérifie qu'elle appartient au pro. Sans
 * identifiant, on retombe sur sa première salle. La requête filtre sur
 * `owner_id` : une salle d'autrui ne remonte simplement pas.
 */
async function mySalle(salleId) {
  const id = await currentUserId();
  let q = supabase.from('salles').select('id, name').eq('owner_id', id);
  q = salleId ? q.eq('id', salleId) : q.order('created_at', { ascending: true }).limit(1);

  const row = unwrap(await q.maybeSingle());
  if (!row) {
    const err = new Error(salleId ? 'FORBIDDEN' : 'NO_SALLE');
    err.code = salleId ? 'FORBIDDEN' : 'NO_SALLE';
    throw err;
  }
  return row;
}

async function mySalleId(salleId) {
  return (await mySalle(salleId)).id;
}

export async function proListReservations(salleId, filter = 'all') {
  const cible = await mySalleId(salleId);
  let q = supabase
    .from('reservations')
    .select('*, formula:tarifs ( id, name, price )')
    .eq('salle_id', cible);

  if (filter === 'pending') q = q.eq('status', RESERVATION_STATUS.PENDING);
  if (filter === 'confirmed') q = q.eq('status', RESERVATION_STATUS.CONFIRMED);
  if (filter === 'cancelled') q = q.eq('status', RESERVATION_STATUS.CANCELLED);
  if (filter === 'past') q = q.lt('event_date', todayISO());

  return unwrap(await q.order('event_date', { ascending: true })) || [];
}

export async function proConfirmReservation(id, { depositAmount, ccp, pin }) {
  const row = unwrap(
    await supabase.rpc('pro_confirm_reservation', {
      p_reservation: id,
      p_deposit: depositAmount ? Number(depositAmount) : null,
      p_ccp: ccp || null,
      p_pin: String(pin),
    })
  );
  return Array.isArray(row) ? row[0] : row;
}

export async function proCancelReservation(id, reason) {
  return unwrap(await supabase.rpc('pro_cancel_reservation', { p_reservation: id, p_reason: reason || null }));
}

export async function proVerifyDeposit(id) {
  return unwrap(await supabase.rpc('pro_verify_deposit', { p_reservation: id }));
}

// ── Planning ──────────────────────────────────────────────────────────────

export async function proGetPlanning(salleId, year, month) {
  const salle = await mySalle(salleId);
  const availability = await getAvailability(salleId, year, month);
  const from = toISODate(new Date(year, month - 1, 1));
  const to = toISODate(new Date(year, month + 2, 0));

  const rows =
    unwrap(
      await supabase
        .from('reservations')
        .select('*, formula:tarifs ( id, name, price )')
        .eq('salle_id', salleId)
        .neq('status', RESERVATION_STATUS.CANCELLED)
        .gte('event_date', from)
        .lte('event_date', to)
    ) || [];

  const byDay = {};
  rows.forEach((r) => {
    byDay[r.event_date] = r;
  });
  return { availability, byDay, salleId, salleName: salle.name };
}

export async function proToggleBlockedDay(salleId, day) {
  const cible = await mySalleId(salleId);
  const existing = unwrap(
    await supabase.from('blocked_days').select('day').eq('salle_id', cible).eq('day', day).maybeSingle()
  );
  if (existing) {
    unwrap(await supabase.from('blocked_days').delete().eq('salle_id', cible).eq('day', day));
    return false;
  }
  unwrap(await supabase.from('blocked_days').insert({ salle_id: cible, day }));
  return true;
}

// ── Dashboard & stats ─────────────────────────────────────────────────────

export async function proGetDashboard(salleId) {
  const cible = await mySalleId(salleId);
  const data = unwrap(await supabase.rpc('pro_dashboard', { p_salle: cible }));
  return Array.isArray(data) ? data[0] : data;
}

export async function proGetStats(salleId) {
  const cible = await mySalleId(salleId);
  const data = unwrap(await supabase.rpc('pro_stats', { p_salle: cible }));
  return Array.isArray(data) ? data[0] : data;
}

// ── Ma salle ──────────────────────────────────────────────────────────────

export async function proGetSalle(salleId) {
  const cible = await mySalleId(salleId);
  const row = unwrap(await supabase.from('salles').select(SALLE_SELECT).eq('id', cible).single());
  return decorate(row);
}

export async function proUpdateSalle(salleId, patch) {
  const cible = await mySalleId(salleId);
  const row = unwrap(
    await supabase.from('salles').update(patch).eq('id', cible).select(SALLE_SELECT).single()
  );
  return decorate(row);
}

export async function proUpdateTarifs(salleId, list) {
  const cible = await mySalleId(salleId);
  unwrap(await supabase.from('tarifs').delete().eq('salle_id', cible));
  return (
    unwrap(
      await supabase
        .from('tarifs')
        .insert(
          list.map((t, i) => ({
            salle_id: cible,
            name: t.name,
            description: t.description || '',
            price: Number(t.price) || 0,
            sort_order: i,
          }))
        )
        .select()
    ) || []
  );
}

// ── Avis ──────────────────────────────────────────────────────────────────

export async function createReview(payload) {
  const row = unwrap(
    await supabase.rpc('create_review', {
      p_reservation: payload.reservation_id,
      p_overall: payload.rating_overall,
      p_salle: payload.rating_salle ?? null,
      p_traiteur: payload.rating_traiteur ?? null,
      p_proprete: payload.rating_proprete ?? null,
      p_value: payload.rating_value ?? null,
      p_comment: payload.comment || '',
      p_photos: payload.photos || [],
    })
  );
  return Array.isArray(row) ? row[0] : row;
}

export async function proListPendingReviews(salleId) {
  const cible = await mySalleId(salleId);
  return (
    unwrap(
      await supabase
        .from('reviews')
        .select('*')
        .eq('salle_id', cible)
        .eq('status', REVIEW_STATUS.PENDING)
        .order('created_at', { ascending: false })
    ) || []
  );
}

export async function proModerateReview(id, action, replyText) {
  if (action === 'reply') {
    return unwrap(await supabase.rpc('pro_reply_review', { p_review: id, p_reply: replyText }));
  }
  const status = action === 'approve' ? REVIEW_STATUS.APPROVED : REVIEW_STATUS.FLAGGED;
  return unwrap(await supabase.from('reviews').update({ status }).eq('id', id).select().single());
}

// ── Messagerie ────────────────────────────────────────────────────────────

export async function listConversations() {
  return unwrap(await supabase.rpc('list_conversations')) || [];
}

export async function listMessages(reservationId) {
  const id = await currentUserId();
  const rows =
    unwrap(
      await supabase
        .from('messages')
        .select('*')
        .eq('reservation_id', reservationId)
        .order('created_at', { ascending: true })
    ) || [];

  const unreadIds = rows.filter((m) => !m.is_read && m.sender_id !== id).map((m) => m.id);
  if (unreadIds.length) {
    await supabase.from('messages').update({ is_read: true }).in('id', unreadIds);
  }
  return rows;
}

export async function sendMessage(reservationId, content) {
  const id = await currentUserId();
  return unwrap(
    await supabase
      .from('messages')
      .insert({ reservation_id: reservationId, sender_id: id, content })
      .select()
      .single()
  );
}

// ── Notifications ─────────────────────────────────────────────────────────

export async function listNotifications() {
  const id = await currentUserId();
  return (
    unwrap(
      await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', id)
        .neq('channel', 'sms')
        .order('created_at', { ascending: false })
        .limit(100)
    ) || []
  );
}

export async function unreadCount() {
  const { data } = await supabase.auth.getSession();
  if (!data?.session?.user) return 0;
  const { count } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', data.session.user.id)
    .neq('channel', 'sms')
    .eq('is_read', false);
  return count || 0;
}

export async function markAllNotificationsRead() {
  const id = await currentUserId();
  unwrap(await supabase.from('notifications').update({ is_read: true }).eq('user_id', id).eq('is_read', false));
  return { ok: true };
}

export async function markNotificationRead(id) {
  unwrap(await supabase.from('notifications').update({ is_read: true }).eq('id', id));
  return { ok: true };
}

export async function listSmsLog() {
  const id = await currentUserId();
  return (
    unwrap(
      await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', id)
        .eq('channel', 'sms')
        .order('created_at', { ascending: false })
    ) || []
  );
}

// ── Abonnement ────────────────────────────────────────────────────────────

export async function getSubscription() {
  // Un abonnement par propriétaire, quel que soit son nombre de salles.
  const id = await currentUserId();
  const sub = unwrap(
    await supabase.from('subscriptions').select('*').eq('pro_id', id).maybeSingle()
  );
  if (!sub) return null;
  const daysLeft = Math.max(
    0,
    Math.round((new Date(sub.trial_ends_at) - new Date(todayISO())) / 86_400_000)
  );
  return { ...sub, daysLeft, daysUsed: TRIAL_DAYS - daysLeft, trialTotal: TRIAL_DAYS };
}

export async function setPaymentMethod(method, details) {
  const id = await currentUserId();
  return unwrap(
    await supabase
      .from('subscriptions')
      .update({ payment_method: method, payment_details: details || null })
      .eq('pro_id', id)
      .select()
      .single()
  );
}

export async function listInvoices() {
  const id = await currentUserId();
  return (
    unwrap(
      await supabase.from('invoices').select('*').eq('pro_id', id).order('issued_at', { ascending: false })
    ) || []
  );
}

export async function resetDemoData() {
  throw new Error('Indisponible en mode Supabase');
}

// ── Console d'administration (§2.1) ───────────────────────────────────────
// Les contrôles de rôle vivent en base : les RPC sont `SECURITY DEFINER` et
// vérifient `is_admin()`. Un client modifié ne peut pas les contourner.

export async function adminGetOverview() {
  const data = unwrap(await supabase.rpc('admin_overview'));
  return Array.isArray(data) ? data[0] : data;
}

export async function adminListPendingSalles() {
  return (
    unwrap(
      await supabase
        .from('salles')
        .select(`${SALLE_SELECT}, owner:users ( id, full_name, phone )`)
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
    ) || []
  ).map(decorate);
}

export async function adminReviewSalle(salleId, approved) {
  return unwrap(await supabase.rpc('admin_review_salle', { p_salle: salleId, p_approved: approved }));
}

export async function adminListFlaggedReviews() {
  return (
    unwrap(
      await supabase
        .from('reviews')
        .select('*, salle:salles ( id, name, city )')
        .eq('status', 'flagged')
        .order('created_at', { ascending: true })
    ) || []
  );
}

export async function adminResolveReview(reviewId, action) {
  return unwrap(await supabase.rpc('admin_resolve_review', { p_review: reviewId, p_action: action }));
}
