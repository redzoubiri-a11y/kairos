import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  SafeAreaView, Alert, RefreshControl, ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../supabase';
import { colors, typography, spacing, radius } from '../src/theme';
import MLoader from '../src/components/MLoader';

const STATUS_CFG = {
  pending:   { label: 'EN ATTENTE', color: colors.accent,   bg: colors.accentSoft, border: 'rgba(232,160,69,0.35)'  },
  confirmed: { label: 'CONFIRMÉE',  color: colors.green,    bg: colors.greenSoft,  border: 'rgba(76,175,130,0.35)'  },
  cancelled: { label: 'ANNULÉE',    color: colors.red,      bg: colors.redSoft,    border: 'rgba(224,90,90,0.35)'   },
  arrived:   { label: 'ARRIVÉ',     color: colors.blue,     bg: colors.blueSoft,   border: 'rgba(90,155,224,0.35)'  },
  no_show:   { label: 'NO SHOW',    color: colors.textMuted,bg: colors.cardBorder, border: colors.cardBorder        },
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

/* ─── Horloge ─── */
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
  wrap: { alignItems: 'center', paddingVertical: spacing.md },
  time: { color: colors.accent, fontSize: 52, fontWeight: '200', letterSpacing: 2, lineHeight: 58 },
  date: { color: colors.textMuted, fontSize: typography.size.heading3, fontWeight: '300', letterSpacing: 1, textTransform: 'capitalize' },
});

/* ─── Skeleton ─── */
function SkeletonComptoir() {
  return (
    <View style={{ flex: 1 }}>
      {[1,2,3,4,5,6].map(i => (
        <View key={i} style={sk.row}>
          <MLoader width={90}  height={36} borderRadius={radius.sm} />
          <View style={{ flex: 1, gap: spacing.sm }}>
            <MLoader width="60%" height={26} borderRadius={radius.sm} />
            <MLoader width="35%" height={14} borderRadius={radius.sm} />
          </View>
          <MLoader width={60}  height={40} borderRadius={radius.sm} />
          <MLoader width={140} height={32} borderRadius={radius.lg} />
          <MLoader width={200} height={44} borderRadius={radius.lg} />
        </View>
      ))}
    </View>
  );
}
const sk = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xxl, paddingVertical: spacing.xl, paddingHorizontal: spacing.xxxl, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
});

/* ─── Stat box ─── */
function StatBox({ label, value, color }) {
  return (
    <View style={sb.wrap}>
      <Text style={[sb.val, { color }]}>{value}</Text>
      <Text style={sb.lbl}>{label}</Text>
    </View>
  );
}
const sb = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', paddingVertical: spacing.xl - 2 },
  val:  { fontSize: 36, fontWeight: '200', lineHeight: 40 },
  lbl:  { color: colors.textDim, fontSize: typography.size.xs, letterSpacing: 2, marginTop: 2 },
});

/* ─── Ligne réservation ─── */
function ResaRow({ resa, index, onConfirm, onCancel, onArrive, acting }) {
  const cfg         = STATUS_CFG[resa.status] || STATUS_CFG.pending;
  const isAct       = acting.has(resa.id);
  const isPending   = resa.status === 'pending';
  const isConfirmed = resa.status === 'confirmed';
  const canAct      = isPending || isConfirmed;

  return (
    <View style={[ro.row, index % 2 === 0 && ro.rowStripe, { borderLeftColor: cfg.color }]}>

      <View style={ro.timeCol}>
        <Text style={[ro.time, { color: cfg.color }]}>{resa.time_slot?.slice(0, 5)}</Text>
      </View>

      <View style={ro.clientCol}>
        <Text style={ro.clientName} numberOfLines={1}>{clientName(resa)}</Text>
        {!!resa.notes && <Text style={ro.notes} numberOfLines={1}>📝 {resa.notes}</Text>}
      </View>

      <View style={ro.couvCol}>
        <Text style={ro.couvNum}>{resa.nb_adults + (resa.nb_children || 0)}</Text>
        <Text style={ro.couvLbl}>pers.</Text>
      </View>

      <View style={ro.statusCol}>
        <View style={[ro.badge, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
          <Text style={[ro.badgeTxt, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
      </View>

      <View style={ro.actionsCol}>
        {isAct ? (
          <Text style={ro.acting}>···</Text>
        ) : canAct ? (
          <>
            {isPending && (
              <TouchableOpacity style={ro.btnConfirm} onPress={() => onConfirm(resa)}>
                <Text style={ro.btnConfirmTxt}>✓  CONFIRMER</Text>
              </TouchableOpacity>
            )}
            {isConfirmed && (
              <TouchableOpacity style={ro.btnArrive} onPress={() => onArrive(resa)}>
                <Text style={ro.btnArriveTxt}>✓  ARRIVÉ</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={ro.btnCancel} onPress={() => onCancel(resa)}>
              <Text style={ro.btnCancelTxt}>✕  ANNULER</Text>
            </TouchableOpacity>
          </>
        ) : (
          <Text style={ro.noAction}>—</Text>
        )}
      </View>
    </View>
  );
}

const ro = StyleSheet.create({
  row:          { flexDirection: 'row', alignItems: 'center', paddingVertical: 18, paddingHorizontal: spacing.xxxl, borderLeftWidth: 4, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  rowStripe:    { backgroundColor: colors.cardHover },
  timeCol:      { width: 110 },
  time:         { fontSize: 32, fontWeight: '300', letterSpacing: 1 },
  clientCol:    { width: 200, paddingRight: spacing.xl },
  clientName:   { color: colors.text, fontSize: 26, fontWeight: '300', letterSpacing: 0.5, marginBottom: spacing.xs },
  notes:        { color: colors.textMuted, fontSize: typography.size.subheading, fontStyle: 'italic' },
  couvCol:      { width: 90, alignItems: 'center' },
  couvNum:      { color: colors.text, fontSize: 36, fontWeight: '200' },
  couvLbl:      { color: colors.textMuted, fontSize: typography.size.body, letterSpacing: 1 },
  statusCol:    { width: 160, alignItems: 'center', paddingHorizontal: spacing.md },
  badge:        { borderRadius: radius.lg, borderWidth: 1.5, paddingHorizontal: spacing.xl, paddingVertical: spacing.md - 1, alignItems: 'center' },
  badgeTxt:     { fontSize: typography.size.caption, fontWeight: typography.weight.semibold, letterSpacing: 1.5 },
  actionsCol:   { width: 240, gap: spacing.md, alignItems: 'flex-end' },
  acting:       { color: colors.accent, fontSize: 28, fontWeight: '200', width: 220, textAlign: 'center' },
  btnConfirm:   { backgroundColor: colors.greenSoft, borderRadius: radius.lg, borderWidth: 1.5, borderColor: 'rgba(76,175,130,0.5)', paddingVertical: 12, paddingHorizontal: spacing.xl, alignItems: 'center', width: 220 },
  btnConfirmTxt:{ color: colors.green, fontSize: typography.size.heading3, fontWeight: typography.weight.semibold, letterSpacing: 1 },
  btnArrive:    { backgroundColor: colors.blueSoft, borderRadius: radius.lg, borderWidth: 1.5, borderColor: 'rgba(90,155,224,0.4)', paddingVertical: 12, paddingHorizontal: spacing.xl, alignItems: 'center', width: 220 },
  btnArriveTxt: { color: colors.blue, fontSize: typography.size.heading3, fontWeight: typography.weight.semibold, letterSpacing: 1 },
  btnCancel:    { backgroundColor: colors.redSoft, borderRadius: radius.lg, borderWidth: 1.5, borderColor: 'rgba(224,90,90,0.35)', paddingVertical: 12, paddingHorizontal: spacing.xl, alignItems: 'center', width: 220 },
  btnCancelTxt: { color: colors.red, fontSize: typography.size.heading3, fontWeight: typography.weight.semibold, letterSpacing: 1 },
  noAction:     { color: colors.textDim, fontSize: 22, width: 220, textAlign: 'center' },
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
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: ownerRow } = await supabase
        .from('restaurant_owners')
        .select('restaurant_id')
        .eq('auth_id', session.user.id)
        .maybeSingle();

      if (!ownerRow?.restaurant_id) return;

      const { data: resto } = await supabase
        .from('restaurants')
        .select('id, name, city')
        .eq('id', ownerRow.restaurant_id)
        .maybeSingle();

      if (resto) setRestaurant(resto);

      const { data: res } = await supabase
        .from('reservations')
        .select('id, date, time_slot, nb_adults, nb_children, notes, status, user_id')
        .eq('restaurant_id', ownerRow.restaurant_id)
        .eq('date', todayStr())
        .order('time_slot', { ascending: true });

      const rows = res ?? [];

      // Fetch user names separately (embedded join fails silently via RLS)
      const userIds = [...new Set(rows.map(r => r.user_id).filter(Boolean))];
      let usersMap = {};
      if (userIds.length > 0) {
        const { data: usersData } = await supabase
          .from('users')
          .select('id, first_name, last_name, email')
          .in('id', userIds);
        (usersData || []).forEach(u => { usersMap[u.id] = u; });
      }

      setReservations(rows.map(r => ({ ...r, users: usersMap[r.user_id] || null })));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    load();
    autoRefreshRef.current = setInterval(() => load(), 120000);
    return () => clearInterval(autoRefreshRef.current);
  }, [load]));

  const act = useCallback(async (id, fn) => {
    setActing(prev => new Set(prev).add(id));
    try {
      await fn();
    } finally {
      setActing(prev => { const s = new Set(prev); s.delete(id); return s; });
    }
  }, []);

  const confirm = useCallback((resa) => {
    Alert.alert('Confirmer', `Confirmer la réservation de ${clientName(resa)} à ${resa.time_slot?.slice(0, 5)} ?`, [
      { text: 'Non', style: 'cancel' },
      { text: 'Confirmer', onPress: () => act(resa.id, async () => {
        await supabase.from('reservations').update({ status: 'confirmed' }).eq('id', resa.id);
        setReservations(prev => prev.map(r => r.id === resa.id ? { ...r, status: 'confirmed' } : r));
      })},
    ]);
  }, [act]);

  const arrive = useCallback((resa) => {
    Alert.alert('Marquer arrivé', `${clientName(resa)} est arrivé ?`, [
      { text: 'Non', style: 'cancel' },
      { text: 'Oui, arrivé', onPress: () => act(resa.id, async () => {
        await supabase.from('reservations').update({ status: 'arrived' }).eq('id', resa.id);
        setReservations(prev => prev.map(r => r.id === resa.id ? { ...r, status: 'arrived' } : r));
      })},
    ]);
  }, [act]);

  const cancel = useCallback((resa) => {
    Alert.alert('Annuler', `Annuler la réservation de ${clientName(resa)} à ${resa.time_slot?.slice(0, 5)} ?`, [
      { text: 'Non', style: 'cancel' },
      { text: 'Annuler la réservation', style: 'destructive', onPress: () => act(resa.id, async () => {
        await supabase.from('reservations')
          .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
          .eq('id', resa.id);
        setReservations(prev => prev.map(r => r.id === resa.id ? { ...r, status: 'cancelled' } : r));
      })},
    ]);
  }, [act]);

  const { total, confirmed, pending, arrived, covers } = useMemo(() => {
    let confirmed = 0, pending = 0, arrived = 0, covers = 0;
    for (const r of reservations) {
      if (r.status === 'confirmed') confirmed++;
      if (r.status === 'pending')   pending++;
      if (r.status === 'arrived')   arrived++;
      if (r.status === 'confirmed' || r.status === 'arrived' || r.status === 'pending') {
        covers += (r.nb_adults || 0) + (r.nb_children || 0);
      }
    }
    return { total: reservations.length, confirmed, pending, arrived, covers };
  }, [reservations]);

  const goBack       = useCallback(() => navigation.goBack(), [navigation]);
  const onRefresh    = useCallback(() => load(true), [load]);
  const emptyDateStr = useMemo(
    () => new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }),
    [],
  );

  const renderItem = useCallback(({ item, index }) => (
    <ResaRow
      resa={item}
      index={index}
      onConfirm={confirm}
      onCancel={cancel}
      onArrive={arrive}
      acting={acting}
    />
  ), [confirm, cancel, arrive, acting]);

  return (
    <SafeAreaView style={s.root}>

      {/* ── Header ── */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          {navigation && (
            <TouchableOpacity style={s.backBtn} onPress={goBack}>
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
          <TouchableOpacity style={s.refreshBtn} onPress={onRefresh} disabled={refreshing}>
            <Text style={s.refreshTxt}>{refreshing ? '···' : '↺  Actualiser'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Stats strip ── */}
      <View style={s.statsStrip}>
        <StatBox label="TOTAL"      value={total}     color={colors.textMuted} />
        <View style={s.statDiv} />
        <StatBox label="CONFIRMÉES" value={confirmed}  color={colors.green}    />
        <View style={s.statDiv} />
        <StatBox label="EN ATTENTE" value={pending}    color={colors.accent}   />
        <View style={s.statDiv} />
        <StatBox label="ARRIVÉS"    value={arrived}    color={colors.blue}     />
        <View style={s.statDiv} />
        <StatBox label="COUVERTS"   value={covers}     color={colors.accent}   />
      </View>

      {/* ── Tableau scrollable horizontalement ── */}
      {loading ? (
        <SkeletonComptoir />
      ) : reservations.length === 0 ? (
        <View style={s.center}>
          <Text style={s.emptyEmoji}>📅</Text>
          <Text style={s.emptyTitle}>Aucune réservation aujourd'hui</Text>
          <Text style={s.emptySub}>{emptyDateStr}</Text>
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} bounces={false}>
          <View style={{ minWidth: 760 }}>
            {/* Colonnes header */}
            <View style={s.colHeader}>
              <Text style={[s.colLbl, { width: 110 }]}>HEURE</Text>
              <Text style={[s.colLbl, { width: 200 }]}>CLIENT</Text>
              <Text style={[s.colLbl, { width: 90, textAlign: 'center' }]}>COUVERTS</Text>
              <Text style={[s.colLbl, { width: 160, textAlign: 'center' }]}>STATUT</Text>
              <Text style={[s.colLbl, { width: 240, textAlign: 'center' }]}>ACTIONS</Text>
            </View>
            <FlatList
              data={reservations}
              keyExtractor={item => String(item.id)}
              renderItem={renderItem}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
              }
              showsVerticalScrollIndicator={false}
              scrollEnabled={false}
              contentContainerStyle={{ paddingBottom: 40 }}
            />
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },

  /* Header */
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xxxl, paddingVertical: spacing.xl, borderBottomWidth: 1, borderBottomColor: colors.cardBorder, backgroundColor: colors.card },
  headerLeft:  { flexDirection: 'row', alignItems: 'center', gap: spacing.xl, flex: 1 },
  headerRight: { flex: 1, alignItems: 'flex-end' },
  backBtn:     { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.cardHover, borderWidth: 1, borderColor: colors.cardBorder, alignItems: 'center', justifyContent: 'center' },
  backTxt:     { color: colors.text, fontSize: 22 },
  logo:        { color: colors.accent, fontSize: typography.size.title, fontWeight: typography.weight.bold, letterSpacing: 6 },
  restoName:   { color: colors.textMuted, fontSize: typography.size.caption, letterSpacing: 1, marginTop: 2 },
  refreshBtn:  { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.cardHover, borderRadius: radius.lg, paddingHorizontal: spacing.xl, paddingVertical: spacing.lg, borderWidth: 1, borderColor: colors.cardBorder },
  refreshTxt:  { color: colors.accent, fontSize: typography.size.subheading, fontWeight: typography.weight.regular, letterSpacing: 0.5 },

  /* Stats */
  statsStrip: { flexDirection: 'row', backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  statDiv:    { width: 1, backgroundColor: colors.cardBorder, marginVertical: spacing.lg },

  /* Column header */
  colHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xxxl, paddingVertical: spacing.lg, backgroundColor: colors.cardHover, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  colLbl:    { color: colors.textDim, fontSize: typography.size.xs, letterSpacing: 3, fontWeight: typography.weight.medium },

  /* Empty */
  center:     { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.xl },
  emptyEmoji: { fontSize: 72 },
  emptyTitle: { color: colors.text, fontSize: 32, fontWeight: '200', letterSpacing: 0.5 },
  emptySub:   { color: colors.textMuted, fontSize: 18, fontWeight: '300', textTransform: 'capitalize' },
});
