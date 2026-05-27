import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  SafeAreaView, ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../supabase';

/* ─── Palette optimisée haute lisibilité ─── */
const C = {
  bg:     '#080f1c',
  bg2:    '#0e1829',
  bg3:    '#141f30',
  stripe: '#0b1422',
  accent: '#c8975a',
  text:   '#f0ece4',
  dim:    '#8a9ab0',
  dimmer: '#3a4a5e',
  green:  '#3dbd7a',
  orange: '#e0a045',
  red:    '#e05a5a',
  border: 'rgba(255,255,255,0.06)',
};

const STATUS_CFG = {
  pending:   { label: 'EN ATTENTE',  color: C.orange, bg: 'rgba(224,160,69,0.12)',  border: 'rgba(224,160,69,0.35)' },
  confirmed: { label: 'CONFIRMÉE',   color: C.green,  bg: 'rgba(61,189,122,0.10)',  border: 'rgba(61,189,122,0.35)' },
  cancelled: { label: 'ANNULÉE',     color: C.red,    bg: 'rgba(224,90,90,0.10)',   border: 'rgba(224,90,90,0.35)'  },
  arrived:   { label: 'ARRIVÉ',      color: '#4a9fd4', bg: 'rgba(74,159,212,0.10)', border: 'rgba(74,159,212,0.35)' },
  no_show:   { label: 'NO SHOW',     color: C.dim,    bg: 'rgba(138,154,176,0.08)', border: 'rgba(138,154,176,0.25)'},
};

function todayStr() { return new Date().toISOString().split('T')[0]; }

function clientName(resa) {
  const u = resa.users;
  if (!u) return 'Client';
  const fn = u.first_name || '';
  const ln = u.last_name  || '';
  const full = `${fn} ${ln}`.trim();
  return full || (u.email ? u.email.split('@')[0] : 'Client');
}

function couverts(resa) {
  const a = resa.nb_adults   || 0;
  const e = resa.nb_children || 0;
  if (e > 0) return `${a + e} pers. (${a}A + ${e}E)`;
  return `${a} pers.`;
}

function Clock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <View style={cl.wrap}>
      <Text style={cl.time}>
        {time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
      </Text>
      <Text style={cl.date}>
        {time.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
      </Text>
    </View>
  );
}
const cl = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: 8 },
  time: { color: C.accent, fontSize: 52, fontWeight: '200', letterSpacing: 2, lineHeight: 58 },
  date: { color: C.dim, fontSize: 15, fontWeight: '300', letterSpacing: 1, textTransform: 'capitalize' },
});

/* ─── Ligne réservation ─── */
function ResaRow({ resa, index, onConfirm, onCancel, onArrive, acting }) {
  const cfg   = STATUS_CFG[resa.status] || STATUS_CFG.pending;
  const isAct = acting.has(resa.id);
  const isPending   = resa.status === 'pending';
  const isConfirmed = resa.status === 'confirmed';
  const canAct = isPending || isConfirmed;

  return (
    <View style={[r.row, index % 2 === 0 && r.rowStripe, { borderLeftColor: cfg.color }]}>

      {/* Heure */}
      <View style={r.timeCol}>
        <Text style={[r.time, { color: cfg.color }]}>{resa.time_slot}</Text>
      </View>

      {/* Client */}
      <View style={r.clientCol}>
        <Text style={r.clientName} numberOfLines={1}>{clientName(resa)}</Text>
        {resa.notes ? <Text style={r.notes} numberOfLines={1}>📝 {resa.notes}</Text> : null}
      </View>

      {/* Couverts */}
      <View style={r.couvCol}>
        <Text style={r.couvNum}>{resa.nb_adults + (resa.nb_children || 0)}</Text>
        <Text style={r.couvLbl}>pers.</Text>
      </View>

      {/* Statut */}
      <View style={r.statusCol}>
        <View style={[r.badge, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
          <Text style={[r.badgeTxt, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
      </View>

      {/* Actions */}
      <View style={r.actionsCol}>
        {isAct ? (
          <ActivityIndicator color={C.accent} size="large" />
        ) : canAct ? (
          <>
            {isPending && (
              <TouchableOpacity style={r.btnConfirm} onPress={() => onConfirm(resa)}>
                <Text style={r.btnConfirmTxt}>✓  CONFIRMER</Text>
              </TouchableOpacity>
            )}
            {isConfirmed && (
              <TouchableOpacity style={r.btnArrive} onPress={() => onArrive(resa)}>
                <Text style={r.btnArriveTxt}>✓  ARRIVÉ</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={r.btnCancel} onPress={() => onCancel(resa)}>
              <Text style={r.btnCancelTxt}>✕  ANNULER</Text>
            </TouchableOpacity>
          </>
        ) : (
          <Text style={r.noAction}>—</Text>
        )}
      </View>
    </View>
  );
}

const r = StyleSheet.create({
  row:         { flexDirection: 'row', alignItems: 'center', paddingVertical: 18, paddingHorizontal: 24, borderLeftWidth: 4, borderBottomWidth: 1, borderBottomColor: C.border },
  rowStripe:   { backgroundColor: C.stripe },
  timeCol:     { width: 110 },
  time:        { fontSize: 32, fontWeight: '300', letterSpacing: 1 },
  clientCol:   { flex: 1, paddingRight: 16 },
  clientName:  { color: C.text, fontSize: 26, fontWeight: '300', letterSpacing: 0.5, marginBottom: 4 },
  notes:       { color: C.dim, fontSize: 14, fontStyle: 'italic' },
  couvCol:     { width: 90, alignItems: 'center' },
  couvNum:     { color: C.text, fontSize: 36, fontWeight: '200' },
  couvLbl:     { color: C.dim, fontSize: 12, letterSpacing: 1 },
  statusCol:   { width: 160, alignItems: 'center', paddingHorizontal: 8 },
  badge:       { borderRadius: 10, borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: 7, alignItems: 'center' },
  badgeTxt:    { fontSize: 13, fontWeight: '600', letterSpacing: 1.5 },
  actionsCol:  { width: 240, gap: 8, alignItems: 'flex-end' },
  btnConfirm:  { backgroundColor: 'rgba(61,189,122,0.15)', borderRadius: 12, borderWidth: 1.5, borderColor: 'rgba(61,189,122,0.5)', paddingVertical: 12, paddingHorizontal: 18, alignItems: 'center', width: 220 },
  btnConfirmTxt:{ color: C.green, fontSize: 15, fontWeight: '600', letterSpacing: 1 },
  btnArrive:   { backgroundColor: 'rgba(74,159,212,0.12)', borderRadius: 12, borderWidth: 1.5, borderColor: 'rgba(74,159,212,0.4)', paddingVertical: 12, paddingHorizontal: 18, alignItems: 'center', width: 220 },
  btnArriveTxt:{ color: '#4a9fd4', fontSize: 15, fontWeight: '600', letterSpacing: 1 },
  btnCancel:   { backgroundColor: 'rgba(224,90,90,0.1)', borderRadius: 12, borderWidth: 1.5, borderColor: 'rgba(224,90,90,0.35)', paddingVertical: 12, paddingHorizontal: 18, alignItems: 'center', width: 220 },
  btnCancelTxt:{ color: C.red, fontSize: 15, fontWeight: '600', letterSpacing: 1 },
  noAction:    { color: C.dimmer, fontSize: 22, width: 220, textAlign: 'center' },
});

/* ─── Écran principal ─── */
export default function ProComptoir({ navigation }) {
  const [restaurant,   setRestaurant]   = useState(null);
  const [reservations, setReservations] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);
  const [acting,       setActing]       = useState(new Set());
  const autoRefreshRef = useRef(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setLoading(false); setRefreshing(false); return; }

    const { data: ownerRow } = await supabase
      .from('restaurant_owners')
      .select('restaurant_id, restaurants(id, name, city)')
      .eq('auth_id', session.user.id)
      .single();

    if (ownerRow?.restaurants) setRestaurant(ownerRow.restaurants);

    const { data: res } = await supabase
      .from('reservations')
      .select('id, date, time_slot, nb_adults, nb_children, notes, status, users(first_name, last_name, email)')
      .eq('date', todayStr())
      .order('time_slot', { ascending: true });

    setReservations(res ?? []);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useFocusEffect(useCallback(() => {
    load();
    autoRefreshRef.current = setInterval(() => load(), 120000); // auto-refresh 2 min
    return () => clearInterval(autoRefreshRef.current);
  }, [load]));

  const act = async (id, fn) => {
    setActing(prev => new Set(prev).add(id));
    await fn();
    setActing(prev => { const s = new Set(prev); s.delete(id); return s; });
  };

  const confirm = (resa) => {
    Alert.alert('Confirmer', `Confirmer la réservation de ${clientName(resa)} à ${resa.time_slot} ?`, [
      { text: 'Non', style: 'cancel' },
      {
        text: 'Confirmer', style: 'default',
        onPress: () => act(resa.id, async () => {
          await supabase.from('reservations').update({ status: 'confirmed' }).eq('id', resa.id);
          setReservations(prev => prev.map(r => r.id === resa.id ? { ...r, status: 'confirmed' } : r));
        }),
      },
    ]);
  };

  const arrive = (resa) => {
    Alert.alert('Marquer arrivé', `${clientName(resa)} est arrivé ?`, [
      { text: 'Non', style: 'cancel' },
      {
        text: 'Oui, arrivé', style: 'default',
        onPress: () => act(resa.id, async () => {
          await supabase.from('reservations').update({ status: 'arrived' }).eq('id', resa.id);
          setReservations(prev => prev.map(r => r.id === resa.id ? { ...r, status: 'arrived' } : r));
        }),
      },
    ]);
  };

  const cancel = (resa) => {
    Alert.alert('Annuler', `Annuler la réservation de ${clientName(resa)} à ${resa.time_slot} ?`, [
      { text: 'Non', style: 'cancel' },
      {
        text: 'Annuler la réservation', style: 'destructive',
        onPress: () => act(resa.id, async () => {
          await supabase.from('reservations')
            .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
            .eq('id', resa.id);
          setReservations(prev => prev.map(r => r.id === resa.id ? { ...r, status: 'cancelled' } : r));
        }),
      },
    ]);
  };

  /* Stats du jour */
  const total     = reservations.length;
  const confirmed = reservations.filter(r => r.status === 'confirmed').length;
  const pending   = reservations.filter(r => r.status === 'pending').length;
  const arrived   = reservations.filter(r => r.status === 'arrived').length;
  const covers    = reservations
    .filter(r => ['confirmed','arrived','pending'].includes(r.status))
    .reduce((sum, r) => sum + (r.nb_adults || 0) + (r.nb_children || 0), 0);

  return (
    <SafeAreaView style={s.root}>

      {/* ── Header ── */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          {navigation && (
            <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
              <Text style={s.backTxt}>←</Text>
            </TouchableOpacity>
          )}
          <View>
            <Text style={s.logo}>MIDA</Text>
            <Text style={s.restoName}>{restaurant?.name || 'Mode comptoir'}</Text>
          </View>
        </View>

        <Clock />

        <View style={s.headerRight}>
          <TouchableOpacity style={s.refreshBtn} onPress={() => load(true)}>
            {refreshing
              ? <ActivityIndicator color={C.accent} />
              : <Text style={s.refreshTxt}>↺  Actualiser</Text>
            }
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Stats strip ── */}
      <View style={s.statsStrip}>
        <StatBox label="TOTAL" value={total} color={C.dim} />
        <View style={s.statDiv} />
        <StatBox label="CONFIRMÉES" value={confirmed} color={C.green} />
        <View style={s.statDiv} />
        <StatBox label="EN ATTENTE" value={pending} color={C.orange} />
        <View style={s.statDiv} />
        <StatBox label="ARRIVÉS" value={arrived} color="#4a9fd4" />
        <View style={s.statDiv} />
        <StatBox label="COUVERTS" value={covers} color={C.accent} />
      </View>

      {/* ── Colonnes header ── */}
      <View style={s.colHeader}>
        <Text style={[s.colLbl, { width: 110 }]}>HEURE</Text>
        <Text style={[s.colLbl, { flex: 1 }]}>CLIENT</Text>
        <Text style={[s.colLbl, { width: 90, textAlign: 'center' }]}>COUVERTS</Text>
        <Text style={[s.colLbl, { width: 160, textAlign: 'center' }]}>STATUT</Text>
        <Text style={[s.colLbl, { width: 240, textAlign: 'center' }]}>ACTIONS</Text>
      </View>

      {/* ── Liste ── */}
      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color={C.accent} size="large" />
          <Text style={s.loadingTxt}>Chargement des réservations…</Text>
        </View>
      ) : reservations.length === 0 ? (
        <View style={s.center}>
          <Text style={s.emptyEmoji}>📅</Text>
          <Text style={s.emptyTitle}>Aucune réservation aujourd'hui</Text>
          <Text style={s.emptySub}>
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </Text>
        </View>
      ) : (
        <FlatList
          data={reservations}
          keyExtractor={item => String(item.id)}
          renderItem={({ item, index }) => (
            <ResaRow
              resa={item}
              index={index}
              onConfirm={confirm}
              onCancel={cancel}
              onArrive={arrive}
              acting={acting}
            />
          )}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={C.accent} />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      )}
    </SafeAreaView>
  );
}

function StatBox({ label, value, color }) {
  return (
    <View style={sb.wrap}>
      <Text style={[sb.val, { color }]}>{value}</Text>
      <Text style={sb.lbl}>{label}</Text>
    </View>
  );
}
const sb = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', paddingVertical: 14 },
  val:  { fontSize: 36, fontWeight: '200', lineHeight: 40 },
  lbl:  { color: C.dim, fontSize: 10, letterSpacing: 2, marginTop: 2 },
});

const s = StyleSheet.create({
  root:        { flex: 1, backgroundColor: C.bg },

  /* Header */
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 28, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.bg2 },
  headerLeft:  { flexDirection: 'row', alignItems: 'center', gap: 16, flex: 1 },
  headerRight: { flex: 1, alignItems: 'flex-end' },
  backBtn:     { width: 44, height: 44, borderRadius: 22, backgroundColor: C.bg3, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  backTxt:     { color: C.text, fontSize: 22 },
  logo:        { color: C.accent, fontSize: 20, fontWeight: '700', letterSpacing: 6 },
  restoName:   { color: C.dim, fontSize: 13, letterSpacing: 1, marginTop: 2 },
  refreshBtn:  { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.bg3, borderRadius: 12, paddingHorizontal: 18, paddingVertical: 10, borderWidth: 1, borderColor: C.border },
  refreshTxt:  { color: C.accent, fontSize: 14, fontWeight: '400', letterSpacing: 0.5 },

  /* Stats */
  statsStrip:  { flexDirection: 'row', backgroundColor: C.bg2, borderBottomWidth: 1, borderBottomColor: C.border },
  statDiv:     { width: 1, backgroundColor: C.border, marginVertical: 10 },

  /* Column header */
  colHeader:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 10, backgroundColor: C.bg3, borderBottomWidth: 1, borderBottomColor: C.border },
  colLbl:      { color: C.dimmer, fontSize: 10, letterSpacing: 3, fontWeight: '500' },

  /* Empty / loading */
  center:      { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  loadingTxt:  { color: C.dim, fontSize: 18, fontWeight: '300', letterSpacing: 0.5 },
  emptyEmoji:  { fontSize: 72 },
  emptyTitle:  { color: C.text, fontSize: 32, fontWeight: '200', letterSpacing: 0.5 },
  emptySub:    { color: C.dim, fontSize: 18, fontWeight: '300', textTransform: 'capitalize' },
});
