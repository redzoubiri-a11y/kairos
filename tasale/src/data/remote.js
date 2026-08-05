// Adaptateur Supabase — même interface que `local.js`.
// Le schéma correspond à supabase/migrations/0001_init.sql (§8).
// Les règles métier sensibles (confirmation, PIN, avis) sont appliquées
// côté base via des fonctions SQL `SECURITY DEFINER` + RLS.

import { supabase } from './client';
import { normalizePhone, todayISO, toISODate, addDays } from '../lib/format';
import {
  RESERVATION_STATUS,
  REVIEW_STATUS,
  SUBSCRIPTION_STATUS,
  TRIAL_DAYS,
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

  unwrap(
    await supabase.from('subscriptions').insert({
      pro_id: id,
      salle_id: salle.id,
      status: SUBSCRIPTION_STATUS.TRIAL,
      trial_ends_at: addDays(todayISO(), TRIAL_DAYS),
    })
  );

  return { salle, user };
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
    })
  );
  return Array.isArray(row) ? row[0] : row;
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

// ── Réservations pro ──────────────────────────────────────────────────────

async function mySalle() {
  const id = await currentUserId();
  const row = unwrap(
    await supabase.from('salles').select('id, name').eq('owner_id', id).limit(1).maybeSingle()
  );
  if (!row) throw new Error('NO_SALLE');
  return row;
}

async function mySalleId() {
  return (await mySalle()).id;
}

export async function proListReservations(filter = 'all') {
  const salleId = await mySalleId();
  let q = supabase
    .from('reservations')
    .select('*, formula:tarifs ( id, name, price )')
    .eq('salle_id', salleId);

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

export async function proGetPlanning(year, month) {
  const salle = await mySalle();
  const salleId = salle.id;
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

export async function proToggleBlockedDay(day) {
  const salleId = await mySalleId();
  const existing = unwrap(
    await supabase.from('blocked_days').select('day').eq('salle_id', salleId).eq('day', day).maybeSingle()
  );
  if (existing) {
    unwrap(await supabase.from('blocked_days').delete().eq('salle_id', salleId).eq('day', day));
    return false;
  }
  unwrap(await supabase.from('blocked_days').insert({ salle_id: salleId, day }));
  return true;
}

// ── Dashboard & stats ─────────────────────────────────────────────────────

export async function proGetDashboard() {
  const data = unwrap(await supabase.rpc('pro_dashboard'));
  return Array.isArray(data) ? data[0] : data;
}

export async function proGetStats() {
  const data = unwrap(await supabase.rpc('pro_stats'));
  return Array.isArray(data) ? data[0] : data;
}

// ── Ma salle ──────────────────────────────────────────────────────────────

export async function proGetSalle() {
  const salleId = await mySalleId();
  const row = unwrap(await supabase.from('salles').select(SALLE_SELECT).eq('id', salleId).single());
  return decorate(row);
}

export async function proUpdateSalle(patch) {
  const salleId = await mySalleId();
  const row = unwrap(
    await supabase.from('salles').update(patch).eq('id', salleId).select(SALLE_SELECT).single()
  );
  return decorate(row);
}

export async function proUpdateTarifs(list) {
  const salleId = await mySalleId();
  unwrap(await supabase.from('tarifs').delete().eq('salle_id', salleId));
  return (
    unwrap(
      await supabase
        .from('tarifs')
        .insert(
          list.map((t, i) => ({
            salle_id: salleId,
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

export async function proListPendingReviews() {
  const salleId = await mySalleId();
  return (
    unwrap(
      await supabase
        .from('reviews')
        .select('*')
        .eq('salle_id', salleId)
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
  const salleId = await mySalleId();
  const sub = unwrap(
    await supabase.from('subscriptions').select('*').eq('salle_id', salleId).maybeSingle()
  );
  if (!sub) return null;
  const daysLeft = Math.max(
    0,
    Math.round((new Date(sub.trial_ends_at) - new Date(todayISO())) / 86_400_000)
  );
  return { ...sub, daysLeft, daysUsed: TRIAL_DAYS - daysLeft, trialTotal: TRIAL_DAYS };
}

export async function setPaymentMethod(method, details) {
  const salleId = await mySalleId();
  return unwrap(
    await supabase
      .from('subscriptions')
      .update({ payment_method: method, payment_details: details || null })
      .eq('salle_id', salleId)
      .select()
      .single()
  );
}

export async function listInvoices() {
  const salleId = await mySalleId();
  return (
    unwrap(
      await supabase.from('invoices').select('*').eq('salle_id', salleId).order('issued_at', { ascending: false })
    ) || []
  );
}

export async function resetDemoData() {
  throw new Error('Indisponible en mode Supabase');
}
