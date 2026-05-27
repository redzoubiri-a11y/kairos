import { useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { supabase } from '../supabase';

const C = {
  bg: '#0d1628', bg2: '#111827', bg3: '#1a2332',
  accent: '#c8975a', accent2: '#4a7fa5',
  text: '#f0ece4', dim: '#8a9ab0', dimmer: '#4a5568',
  green: '#3d9970', red: '#e05a5a', card: '#141e2e',
  border: 'rgba(255,255,255,0.07)',
  borderAccent: 'rgba(200,151,90,0.25)',
};

const STATUS = {
  pending:   { label: 'EN ATTENTE',  color: '#c8975a', bg: 'rgba(200,151,90,0.1)',  border: 'rgba(200,151,90,0.3)'  },
  confirmed: { label: 'CONFIRMÉE',   color: '#3d9970', bg: 'rgba(61,153,112,0.1)',  border: 'rgba(61,153,112,0.3)'  },
  cancelled: { label: 'ANNULÉE',     color: '#e05a5a', bg: 'rgba(224,90,90,0.1)',   border: 'rgba(224,90,90,0.3)'   },
  completed: { label: 'TERMINÉE',    color: '#8a9ab0', bg: 'rgba(138,154,176,0.1)', border: 'rgba(138,154,176,0.3)' },
  no_show:   { label: 'NO SHOW',     color: '#e05a5a', bg: 'rgba(224,90,90,0.1)',   border: 'rgba(224,90,90,0.3)'   },
};

const FILTERS = ['Tout', 'En attente', 'Confirmées', 'Annulées'];
const FILTER_STATUS = { 'En attente': 'pending', 'Confirmées': 'confirmed', 'Annulées': 'cancelled' };

const DATE_FILTERS = ['Aujourd\'hui', 'Demain', 'Cette semaine', 'Tout'];

function today()    { return new Date().toISOString().split('T')[0]; }
function tomorrow() { const d = new Date(); d.setDate(d.getDate()+1); return d.toISOString().split('T')[0]; }
function weekEnd()  { const d = new Date(); d.setDate(d.getDate()+6); return d.toISOString().split('T')[0]; }

function formatDate(iso) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export default function ProDashboard() {
  const [restaurant,   setRestaurant]   = useState(null);
  const [reservations, setReservations] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);
  const [filter,       setFilter]       = useState('Tout');
  const [dateFilter,   setDateFilter]   = useState("Aujourd'hui");
  const [acting,       setActing]       = useState(new Set());

  useFocusEffect(useCallback(() => { load(); }, []));

  async function load(isRefresh = false) {
    if (isRefresh) setRefreshing(true); else setLoading(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setLoading(false); setRefreshing(false); return; }

    // Lookup via restaurant_owners
    const { data: ownerRow } = await supabase
      .from('restaurant_owners')
      .select('restaurant_id, restaurants(id, name, city, quartier, cuisine_type, photos)')
      .eq('auth_id', session.user.id)
      .single();

    if (ownerRow?.restaurants) setRestaurant(ownerRow.restaurants);

    // Réservations : RLS filtre déjà par auth.uid() via restaurant_owners
    const { data: res } = await supabase
      .from('reservations')
      .select('id, date, time_slot, nb_adults, nb_children, notes, status, created_at, users(first_name, last_name, email)')
      .order('date', { ascending: true })
      .order('time_slot', { ascending: true });

    setReservations(res ?? []);
    setLoading(false);
    setRefreshing(false);
  }

  async function confirm(resa) {
    Alert.alert(
      'Confirmer la réservation',
      `${clientName(resa)} · ${formatDate(resa.date)} à ${resa.time_slot?.slice(0,5)}\n${resa.nb_adults} adulte${resa.nb_adults > 1 ? 's' : ''}`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer ✓',
          onPress: async () => {
            setActing(p => new Set(p).add(resa.id));
            await supabase.from('reservations').update({ status: 'confirmed' }).eq('id', resa.id);

            // Notif client
            if (resa.users) {
              const { data: u } = await supabase
                .from('users')
                .select('id')
                .eq('email', resa.users.email)
                .maybeSingle();
              if (u) {
                await supabase.from('notifications').insert({
                  recipient_id: u.id, recipient_type: 'user',
                  type: 'confirm',
                  title: 'Réservation confirmée ✅',
                  body: `Votre table chez ${restaurant?.name} le ${formatDate(resa.date)} à ${resa.time_slot?.slice(0,5)} est confirmée.`,
                });
              }
            }
            setActing(p => { const s = new Set(p); s.delete(resa.id); return s; });
            load();
          },
        },
      ]
    );
  }

  async function cancel(resa) {
    Alert.alert(
      'Refuser la réservation',
      `${clientName(resa)} · ${formatDate(resa.date)} à ${resa.time_slot?.slice(0,5)}`,
      [
        { text: 'Retour', style: 'cancel' },
        {
          text: 'Refuser ✕',
          style: 'destructive',
          onPress: async () => {
            setActing(p => new Set(p).add(resa.id));
            await supabase.from('reservations')
              .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
              .eq('id', resa.id);

            // Notif client
            if (resa.users) {
              const { data: u } = await supabase
                .from('users').select('id').eq('email', resa.users.email).maybeSingle();
              if (u) {
                await supabase.from('notifications').insert({
                  recipient_id: u.id, recipient_type: 'user',
                  type: 'cancellation',
                  title: 'Réservation annulée',
                  body: `Votre réservation chez ${restaurant?.name} le ${formatDate(resa.date)} n'a pas pu être confirmée.`,
                });
              }
            }
            setActing(p => { const s = new Set(p); s.delete(resa.id); return s; });
            load();
          },
        },
      ]
    );
  }

  const clientName = (r) => {
    if (!r.users) return 'Client inconnu';
    const fn = r.users.first_name || '';
    const ln = r.users.last_name  || '';
    return (fn + ' ' + ln).trim() || r.users.email?.split('@')[0] || 'Client';
  };

  // Filtrage
  const filtered = reservations.filter(r => {
    const statusOk = filter === 'Tout' || r.status === FILTER_STATUS[filter];
    let dateOk = true;
    const t = today(); const tm = tomorrow(); const we = weekEnd();
    if      (dateFilter === "Aujourd'hui")    dateOk = r.date === t;
    else if (dateFilter === 'Demain')         dateOk = r.date === tm;
    else if (dateFilter === 'Cette semaine')  dateOk = r.date >= t && r.date <= we;
    return statusOk && dateOk;
  });

  // Stats
  const todayResas     = reservations.filter(r => r.date === today());
  const pendingCount   = reservations.filter(r => r.status === 'pending').length;
  const confirmedToday = todayResas.filter(r => r.status === 'confirmed').length;
  const totalCoversToday = todayResas
    .filter(r => r.status === 'confirmed')
    .reduce((acc, r) => acc + (r.nb_adults || 0) + (r.nb_children || 0), 0);

  if (loading) {
    return (
      <SafeAreaView style={s.root}>
        <View style={s.center}><ActivityIndicator color={C.accent} size="large" /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={C.accent} />}
      >

        {/* ── Header ── */}
        <View style={s.header}>
          <View>
            <Text style={s.headerSub}>tableau de bord</Text>
            <Text style={s.headerTitle}>Manager</Text>
          </View>
          <View style={s.proBadge}>
            <View style={s.proDot} />
            <Text style={s.proBadgeTxt}>En ligne</Text>
          </View>
        </View>

        {/* ── Restaurant card ── */}
        {restaurant && (
          <View style={s.restoCard}>
            <View style={s.restoIcon}>
              <Text style={{ fontSize: 22 }}>🍽️</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.restoName}>{restaurant.name}</Text>
              <Text style={s.restoCuisine}>
                {restaurant.cuisine_type?.toUpperCase()}
                {restaurant.quartier ? '  ·  ' + restaurant.quartier : ''}
                {restaurant.city ? '  ·  ' + restaurant.city : ''}
              </Text>
            </View>
          </View>
        )}

        {/* ── Stats ── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.statsRow}>
          <StatCard icon="📅" value={todayResas.length}   label="Réservations\naujourd'hui" color={C.accent2} />
          <StatCard icon="⏳" value={pendingCount}         label="En attente\nde confirmation" color={C.accent} alert={pendingCount > 0} />
          <StatCard icon="✅" value={confirmedToday}       label="Confirmées\nce soir" color={C.green} />
          <StatCard icon="🪑" value={totalCoversToday}    label="Couverts\nconfirmés" color={C.dim} />
        </ScrollView>

        {/* ── Filtres date ── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow}>
          {DATE_FILTERS.map(f => (
            <TouchableOpacity key={f} style={[s.filterChip, dateFilter === f && s.filterChipOn]} onPress={() => setDateFilter(f)}>
              <Text style={[s.filterTxt, dateFilter === f && s.filterTxtOn]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── Filtres statut ── */}
        <View style={s.statusTabs}>
          {FILTERS.map(f => (
            <TouchableOpacity key={f} style={[s.statusTab, filter === f && s.statusTabOn]} onPress={() => setFilter(f)}>
              <Text style={[s.statusTabTxt, filter === f && s.statusTabTxtOn]}>{f}</Text>
              {f === 'En attente' && pendingCount > 0 && (
                <View style={s.pendingBadge}><Text style={s.pendingBadgeTxt}>{pendingCount}</Text></View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Liste réservations ── */}
        <View style={s.listHead}>
          <Text style={s.listHeadTxt}>{filtered.length} réservation{filtered.length > 1 ? 's' : ''}</Text>
        </View>

        {filtered.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyEmoji}>📭</Text>
            <Text style={s.emptyTxt}>Aucune réservation{filter !== 'Tout' ? ' ' + filter.toLowerCase() : ''}</Text>
          </View>
        ) : (
          filtered.map(r => {
            const st  = STATUS[r.status] || STATUS.pending;
            const nom = clientName(r);
            const isActing = acting.has(r.id);
            return (
              <View key={r.id} style={[s.card, { borderLeftWidth: 3, borderLeftColor: st.color }]}>

                {/* Ligne principale */}
                <View style={s.cardTop}>
                  <View style={s.cardTime}>
                    <Text style={s.cardTimeVal}>{r.time_slot?.slice(0,5) || '—'}</Text>
                    <Text style={s.cardDateVal}>{formatDate(r.date)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.cardName}>{nom}</Text>
                    <Text style={s.cardCovers}>
                      👥 {r.nb_adults} adulte{r.nb_adults > 1 ? 's' : ''}
                      {r.nb_children > 0 ? `  ·  ${r.nb_children} enfant${r.nb_children > 1 ? 's' : ''}` : ''}
                    </Text>
                  </View>
                  <View style={[s.statusBadge, { backgroundColor: st.bg, borderColor: st.border }]}>
                    <Text style={[s.statusBadgeTxt, { color: st.color }]}>{st.label}</Text>
                  </View>
                </View>

                {/* Note client */}
                {!!r.notes && (
                  <View style={s.noteRow}>
                    <Text style={s.noteTxt}>💬  {r.notes}</Text>
                  </View>
                )}

                {/* Actions */}
                {r.status === 'pending' && (
                  <View style={s.actions}>
                    <TouchableOpacity
                      style={s.confirmBtn}
                      onPress={() => confirm(r)}
                      disabled={isActing}
                    >
                      {isActing
                        ? <ActivityIndicator size={14} color={C.green} />
                        : <Text style={s.confirmBtnTxt}>✓  Confirmer</Text>
                      }
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={s.refuseBtn}
                      onPress={() => cancel(r)}
                      disabled={isActing}
                    >
                      <Text style={s.refuseBtnTxt}>✕  Refuser</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })
        )}

        <View style={{ height: 20 }} />

        {/* ── Déconnexion ── */}
        <TouchableOpacity style={s.signOutBtn} onPress={() => supabase.auth.signOut()}>
          <Text style={s.signOutTxt}>Se déconnecter</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ icon, value, label, color, alert }) {
  return (
    <View style={[sc.card, alert && { borderColor: color + '60' }]}>
      <Text style={sc.icon}>{icon}</Text>
      <Text style={[sc.value, { color }]}>{value}</Text>
      <Text style={sc.label}>{label}</Text>
      {alert && <View style={[sc.dot, { backgroundColor: color }]} />}
    </View>
  );
}
const sc = StyleSheet.create({
  card:  { width: 110, backgroundColor: C.bg2, borderRadius: 16, borderWidth: 1, borderColor: C.border, padding: 14, gap: 4, marginRight: 10 },
  icon:  { fontSize: 20 },
  value: { fontSize: 26, fontWeight: '200' },
  label: { color: C.dimmer, fontSize: 10, lineHeight: 14 },
  dot:   { position: 'absolute', top: 10, right: 10, width: 8, height: 8, borderRadius: 4 },
});

const s = StyleSheet.create({
  root:           { flex: 1, backgroundColor: C.bg },
  center:         { flex: 1, alignItems: 'center', justifyContent: 'center' },

  /* Header */
  header:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: C.border },
  headerSub:      { color: C.accent, fontSize: 10, fontStyle: 'italic', letterSpacing: 3, marginBottom: 2 },
  headerTitle:    { color: C.text, fontSize: 26, fontWeight: '300', letterSpacing: 1 },
  proBadge:       { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(61,153,112,0.1)', borderRadius: 100, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(61,153,112,0.3)' },
  proDot:         { width: 6, height: 6, borderRadius: 3, backgroundColor: C.green },
  proBadgeTxt:    { color: C.green, fontSize: 11 },

  /* Restaurant */
  restoCard:      { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 20, marginVertical: 14, backgroundColor: C.bg2, borderRadius: 16, borderWidth: 1, borderColor: C.border, padding: 14 },
  restoIcon:      { width: 46, height: 46, borderRadius: 12, backgroundColor: C.bg3, alignItems: 'center', justifyContent: 'center' },
  restoName:      { color: C.text, fontSize: 15, fontWeight: '400', marginBottom: 3 },
  restoCuisine:   { color: C.accent, fontSize: 9, letterSpacing: 2 },

  /* Stats */
  statsRow:       { paddingHorizontal: 20, paddingBottom: 16 },

  /* Filtres */
  filterRow:      { paddingHorizontal: 20, paddingBottom: 12, gap: 8 },
  filterChip:     { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 100, backgroundColor: C.bg2, borderWidth: 1, borderColor: C.border },
  filterChipOn:   { backgroundColor: 'rgba(200,151,90,0.12)', borderColor: C.accent },
  filterTxt:      { color: C.dim, fontSize: 12 },
  filterTxtOn:    { color: C.accent },

  /* Tabs statut */
  statusTabs:     { flexDirection: 'row', marginHorizontal: 20, marginBottom: 8, backgroundColor: C.bg2, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 3, gap: 2 },
  statusTab:      { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, borderRadius: 11, gap: 4 },
  statusTabOn:    { backgroundColor: C.bg3 },
  statusTabTxt:   { color: C.dimmer, fontSize: 11 },
  statusTabTxtOn: { color: C.text },
  pendingBadge:   { backgroundColor: C.accent, borderRadius: 8, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  pendingBadgeTxt:{ color: C.bg, fontSize: 9, fontWeight: '700' },

  /* Liste */
  listHead:       { paddingHorizontal: 20, paddingBottom: 8 },
  listHeadTxt:    { color: C.dimmer, fontSize: 10, letterSpacing: 2 },

  /* Cards */
  card:           { backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border, marginHorizontal: 20, marginBottom: 10, padding: 14, gap: 10 },
  cardTop:        { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardTime:       { alignItems: 'center', minWidth: 48 },
  cardTimeVal:    { color: C.text, fontSize: 15, fontWeight: '500' },
  cardDateVal:    { color: C.dimmer, fontSize: 10, marginTop: 2 },
  cardName:       { color: C.text, fontSize: 14, fontWeight: '300', marginBottom: 3 },
  cardCovers:     { color: C.dim, fontSize: 12 },
  statusBadge:    { borderRadius: 8, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4 },
  statusBadgeTxt: { fontSize: 8, fontWeight: '600', letterSpacing: 1 },
  noteRow:        { backgroundColor: C.bg2, borderRadius: 10, padding: 10 },
  noteTxt:        { color: C.dim, fontSize: 12, lineHeight: 18 },

  /* Actions */
  actions:        { flexDirection: 'row', gap: 8 },
  confirmBtn:     { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10, backgroundColor: 'rgba(61,153,112,0.12)', borderWidth: 1, borderColor: 'rgba(61,153,112,0.3)' },
  confirmBtnTxt:  { color: C.green, fontSize: 13, fontWeight: '500' },
  refuseBtn:      { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10, backgroundColor: 'rgba(224,90,90,0.08)', borderWidth: 1, borderColor: 'rgba(224,90,90,0.25)' },
  refuseBtnTxt:   { color: C.red, fontSize: 13 },

  /* Empty */
  empty:          { alignItems: 'center', paddingVertical: 48, gap: 10 },
  emptyEmoji:     { fontSize: 40 },
  emptyTxt:       { color: C.dimmer, fontSize: 14, fontWeight: '300' },

  /* Sign out */
  signOutBtn:     { marginHorizontal: 20, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(224,90,90,0.2)', alignItems: 'center' },
  signOutTxt:     { color: C.red, fontSize: 13 },
});
