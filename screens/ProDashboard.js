import { useState, useCallback, useMemo } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, Alert, RefreshControl, Image,
} from 'react-native';
import { supabase } from '../supabase';
import { colors, typography, spacing, radius } from '../src/theme';
import MLoader from '../src/components/MLoader';
import usePushNotifications from '../src/hooks/usePushNotifications';

const STATUS = {
  pending:   { label:'EN ATTENTE', color: colors.accent, bg: colors.accentSoft,             border: 'rgba(232,160,69,0.3)'  },
  confirmed: { label:'CONFIRMÉE',  color: colors.green,  bg: colors.greenSoft,              border: 'rgba(76,175,130,0.3)'  },
  cancelled: { label:'ANNULÉE',    color: colors.red,    bg: colors.redSoft,                border: 'rgba(224,90,90,0.3)'   },
  completed: { label:'TERMINÉE',   color: colors.textDim,bg: colors.cardBorder,             border: colors.cardBorder       },
  arrived:   { label:'ARRIVÉ',     color: colors.blue,   bg: colors.blueSoft,               border: 'rgba(90,155,224,0.3)'  },
  no_show:   { label:'NO SHOW',    color: colors.red,    bg: colors.redSoft,                border: 'rgba(224,90,90,0.3)'   },
};

const FILTERS      = ['Tout','En attente','Confirmées','Annulées'];
const FILTER_MAP   = { 'En attente':'pending', 'Confirmées':'confirmed', 'Annulées':'cancelled' };
const DATE_FILTERS = ["Aujourd'hui",'Demain','Cette semaine','Tout'];

const AVATAR_COLORS = [colors.accent, colors.blue, colors.green, colors.purple, colors.accentDim, colors.textMuted];
function avatarColor(name) {
  let h = 0;
  for (let i = 0; i < (name||'').length; i++) h = (h * 31 + name.charCodeAt(i)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[Math.abs(h)];
}

function todayStr()    { return new Date().toISOString().split('T')[0]; }
function tomorrowStr() { const d = new Date(); d.setDate(d.getDate()+1); return d.toISOString().split('T')[0]; }
function weekEndStr()  { const d = new Date(); d.setDate(d.getDate()+6); return d.toISOString().split('T')[0]; }

async function sendNotification(users, type, title, body) {
  if (!users) return;
  const { data: u } = await supabase.from('users').select('id').eq('email', users.email).maybeSingle();
  if (u) await supabase.from('notifications').insert({ recipient_id: u.id, recipient_type: 'user', type, title, body });
}

function formatDate(iso) {
  if (!iso) return '—';
  const [y,m,d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Bonjour';
  if (h < 18) return 'Bon après-midi';
  return 'Bonsoir';
}

/* ─── Skeleton ─── */
function SkeletonDashboard() {
  return (
    <View style={{ padding: spacing.xxl }}>
      <MLoader width="55%" height={18} borderRadius={radius.sm} style={{ marginBottom: spacing.sm }} />
      <MLoader width="35%" height={12} borderRadius={radius.sm} style={{ marginBottom: spacing.xxxl }} />
      <View style={{ flexDirection: 'row', gap: spacing.lg, marginBottom: spacing.xl }}>
        {[1,2,3].map(i => <MLoader key={i} width={116} height={88} borderRadius={radius.xxl} />)}
      </View>
      <MLoader width="100%" height={56} borderRadius={radius.xl} style={{ marginBottom: spacing.lg }} />
      {[1,2,3].map(i => (
        <MLoader key={i} width="100%" height={110} borderRadius={radius.xl} style={{ marginBottom: spacing.lg }} />
      ))}
    </View>
  );
}

/* ─── Bande 7 jours ─── */
function WeekStrip({ reservations }) {
  const days = Array.from({ length:7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i);
    const iso = d.toISOString().split('T')[0];
    const count = reservations.filter(r => r.date === iso && r.status !== 'cancelled').length;
    const dayLabel = i === 0 ? 'Auj.' : d.toLocaleDateString('fr-FR', { weekday:'short' }).replace('.','');
    const dayNum   = d.getDate();
    return { iso, count, dayLabel, dayNum, isToday: i === 0 };
  });

  const maxCount = Math.max(...days.map(d => d.count), 1);

  return (
    <View style={ws.wrap}>
      <Text style={ws.title}>7 PROCHAINS JOURS</Text>
      <View style={ws.row}>
        {days.map(d => {
          const pct = d.count > 0 ? Math.max(d.count / maxCount, 0.12) : 0;
          const barH = Math.round(pct * 36);
          return (
            <View key={d.iso} style={ws.col}>
              <Text style={ws.countLbl}>{d.count > 0 ? d.count : ''}</Text>
              <View style={ws.barTrack}>
                <View style={[ws.bar, { height: barH || 2, backgroundColor: d.isToday ? colors.accent : d.count > 0 ? colors.blue : colors.cardHover }]} />
              </View>
              <Text style={[ws.dayNum, d.isToday && ws.dayNumToday]}>{d.dayNum}</Text>
              <Text style={[ws.dayLabel, d.isToday && ws.dayLabelToday]}>{d.dayLabel}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
const ws = StyleSheet.create({
  wrap:          { marginHorizontal: spacing.xxl, marginBottom: spacing.xl, backgroundColor: colors.card, borderRadius: radius.xxl, borderWidth: 1, borderColor: colors.cardBorder, padding: spacing.xl },
  title:         { color: colors.textDim, fontSize: typography.size.xs, letterSpacing: 3, marginBottom: spacing.lg },
  row:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  col:           { alignItems: 'center', gap: spacing.xxs, flex: 1 },
  countLbl:      { color: colors.accent, fontSize: typography.size.xs, fontWeight: typography.weight.medium, minHeight: 12 },
  barTrack:      { height: 38, justifyContent: 'flex-end', width: '70%' },
  bar:           { borderRadius: radius.sm, minHeight: 2 },
  dayNum:        { color: colors.textMuted, fontSize: typography.size.caption },
  dayNumToday:   { color: colors.accent, fontWeight: typography.weight.medium },
  dayLabel:      { color: colors.textDim, fontSize: typography.size.xs },
  dayLabelToday: { color: colors.accent },
});

/* ─── Carte stat ─── */
function StatCard({ icon, value, label, color, alert, sub }) {
  return (
    <View style={[sc.card, alert && { borderColor: color + '55' }]}>
      {alert && <View style={[sc.dot, { backgroundColor: color }]} />}
      <Text style={sc.icon}>{icon}</Text>
      <Text style={[sc.value, { color }]}>{value}</Text>
      <Text style={sc.label}>{label}</Text>
      {!!sub && <Text style={sc.sub}>{sub}</Text>}
    </View>
  );
}
const sc = StyleSheet.create({
  card:  { width: 116, backgroundColor: colors.card, borderRadius: radius.xxl, borderWidth: 1, borderColor: colors.cardBorder, padding: spacing.lg, gap: spacing.xs },
  icon:  { fontSize: 20 },
  value: { fontSize: 26, fontWeight: '200' },
  label: { color: colors.textDim, fontSize: typography.size.xs, lineHeight: 14 },
  sub:   { color: colors.textMuted, fontSize: typography.size.sm, marginTop: 2 },
  dot:   { position: 'absolute', top: spacing.lg, right: spacing.lg, width: 8, height: 8, borderRadius: 4 },
});

/* ─── Bannière alerte ─── */
function AlertBanner({ pendingCount, upcomingCount }) {
  if (pendingCount === 0 && upcomingCount === 0) return null;
  return (
    <View style={ab.wrap}>
      <Text style={ab.icon}>{pendingCount > 0 ? '⚠️' : '🔔'}</Text>
      <View style={{ flex:1 }}>
        {pendingCount > 0 && (
          <Text style={ab.txt}>
            <Text style={ab.bold}>{pendingCount} réservation{pendingCount > 1 ? 's' : ''}</Text> en attente de confirmation
          </Text>
        )}
        {upcomingCount > 0 && (
          <Text style={ab.txt}>
            <Text style={ab.bold}>{upcomingCount} table{upcomingCount > 1 ? 's' : ''}</Text> dans moins d'une heure
          </Text>
        )}
      </View>
    </View>
  );
}
const ab = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, marginHorizontal: spacing.xxl, marginBottom: spacing.lg, backgroundColor: colors.accentSoft, borderRadius: radius.xl, borderWidth: 1, borderColor: 'rgba(232,160,69,0.3)', padding: spacing.lg },
  icon: { fontSize: 18 },
  txt:  { color: colors.textMuted, fontSize: typography.size.body, lineHeight: 18 },
  bold: { color: colors.accent, fontWeight: typography.weight.medium },
});

/* ─── Card réservation ─── */
function ResaCard({ r, clientName, onConfirm, onCancel, onArrived, isActing, isToday }) {
  const st  = STATUS[r.status] || STATUS.pending;
  const nom = clientName(r);
  const col = avatarColor(nom);
  const initials = nom.split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase();
  const covers = (r.nb_adults || 0) + (r.nb_children || 0);
  const showArrivedBtn = r.status === 'confirmed' && isToday;
  const showActions    = r.status === 'pending';

  return (
    <View style={[rc.card, { borderLeftColor: st.color }]}>
      <View style={rc.top}>
        <View style={rc.timeCol}>
          <Text style={rc.timeVal}>{r.time_slot?.slice(0,5) || '—'}</Text>
          <Text style={rc.dateVal}>{formatDate(r.date)}</Text>
        </View>

        <View style={[rc.avatar, { backgroundColor: col + '22', borderColor: col + '55' }]}>
          <Text style={[rc.avatarTxt, { color: col }]}>{initials || '?'}</Text>
        </View>
        <View style={{ flex:1 }}>
          <Text style={rc.name}>{nom}</Text>
          <View style={rc.coverRow}>
            <Text style={rc.coverTxt}>👥 {covers} couvert{covers > 1 ? 's' : ''}</Text>
            {r.nb_children > 0 && <Text style={rc.childTxt}>· {r.nb_children} enfant{r.nb_children > 1 ? 's' : ''}</Text>}
          </View>
        </View>

        <View style={[rc.badge, { backgroundColor: st.bg, borderColor: st.border }]}>
          <Text style={[rc.badgeTxt, { color: st.color }]}>{st.label}</Text>
        </View>
      </View>

      {!!r.notes && (
        <View style={rc.noteWrap}>
          <Text style={rc.noteIcon}>💬</Text>
          <Text style={rc.noteTxt}>{r.notes}</Text>
        </View>
      )}

      {(showActions || showArrivedBtn) && (
        <View style={rc.actions}>
          {showActions && (
            <>
              <TouchableOpacity style={rc.btnConfirm} onPress={onConfirm} disabled={isActing}>
                <Text style={rc.btnConfirmTxt}>{isActing ? '···' : '✓  Confirmer'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={rc.btnRefuse} onPress={onCancel} disabled={isActing}>
                <Text style={rc.btnRefuseTxt}>✕  Refuser</Text>
              </TouchableOpacity>
            </>
          )}
          {showArrivedBtn && (
            <TouchableOpacity style={rc.btnArrived} onPress={onArrived} disabled={isActing}>
              <Text style={rc.btnArrivedTxt}>{isActing ? '···' : '🪑  Client arrivé'}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const rc = StyleSheet.create({
  card:          { backgroundColor: colors.card, borderRadius: radius.xxl, borderWidth: 1, borderColor: colors.cardBorder, borderLeftWidth: 3, marginHorizontal: spacing.xxl, marginBottom: spacing.lg, padding: spacing.xl, gap: spacing.lg },
  top:           { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  timeCol:       { alignItems: 'center', minWidth: 46 },
  timeVal:       { color: colors.text, fontSize: typography.size.heading3, fontWeight: typography.weight.medium },
  dateVal:       { color: colors.textDim, fontSize: typography.size.xs, marginTop: 2 },
  avatar:        { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  avatarTxt:     { fontSize: typography.size.body, fontWeight: typography.weight.medium },
  name:          { color: colors.text, fontSize: typography.size.subheading, fontWeight: '300', marginBottom: spacing.xxs },
  coverRow:      { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  coverTxt:      { color: colors.textMuted, fontSize: typography.size.body },
  childTxt:      { color: colors.textDim, fontSize: typography.size.caption },
  badge:         { borderRadius: radius.md, borderWidth: 1, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  badgeTxt:      { fontSize: typography.size.xs, fontWeight: typography.weight.semibold, letterSpacing: 1 },
  noteWrap:      { flexDirection: 'row', gap: spacing.md, backgroundColor: colors.cardHover, borderRadius: radius.md, padding: spacing.lg },
  noteIcon:      { fontSize: 13 },
  noteTxt:       { color: colors.textMuted, fontSize: typography.size.body, lineHeight: 18, flex: 1 },
  actions:       { flexDirection: 'row', gap: spacing.md },
  btnConfirm:    { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 11, borderRadius: radius.lg, backgroundColor: colors.greenSoft, borderWidth: 1, borderColor: 'rgba(76,175,130,0.3)' },
  btnConfirmTxt: { color: colors.green, fontSize: typography.size.bodyLg, fontWeight: typography.weight.medium },
  btnRefuse:     { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 11, borderRadius: radius.lg, backgroundColor: colors.redSoft, borderWidth: 1, borderColor: 'rgba(224,90,90,0.25)' },
  btnRefuseTxt:  { color: colors.red, fontSize: typography.size.bodyLg },
  btnArrived:    { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 11, borderRadius: radius.lg, backgroundColor: colors.blueSoft, borderWidth: 1, borderColor: 'rgba(90,155,224,0.3)' },
  btnArrivedTxt: { color: colors.blue, fontSize: typography.size.bodyLg },
});

/* ─── Écran principal ─── */
export default function ProDashboard({ navigation }) {
  usePushNotifications();
  const [restaurant,   setRestaurant]   = useState(null);
  const [reservations, setReservations] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);
  const [filter,       setFilter]       = useState('Tout');
  const [dateFilter,   setDateFilter]   = useState("Aujourd'hui");
  const [acting,       setActing]       = useState(new Set());

  const addActing    = useCallback(id => setActing(p => new Set(p).add(id)), []);
  const removeActing = useCallback(id => setActing(p => { const s = new Set(p); s.delete(id); return s; }), []);

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

      if (ownerRow?.restaurant_id) {
        const { data: resto } = await supabase
          .from('restaurants')
          .select('id, name, city, quartier, cuisine_type, photos, avg_rating, avg_ticket, capacity')
          .eq('id', ownerRow.restaurant_id)
          .maybeSingle();
        if (resto) setRestaurant(resto);
      }

      const { data: res } = await supabase
        .from('reservations')
        .select('id, date, time_slot, nb_adults, nb_children, notes, status, created_at, user_id')
        .order('date', { ascending: true })
        .order('time_slot', { ascending: true });

      const rows = res ?? [];
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

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const clientName = useCallback((r) => {
    if (!r.users) return 'Client inconnu';
    const fn = r.users.first_name || '';
    const ln = r.users.last_name  || '';
    return (fn + ' ' + ln).trim() || r.users.email?.split('@')[0] || 'Client';
  }, []);

  const confirm = useCallback((resa) => {
    Alert.alert(
      'Confirmer la réservation',
      `${clientName(resa)} · ${formatDate(resa.date)} à ${resa.time_slot?.slice(0,5)}\n${resa.nb_adults} adulte${resa.nb_adults > 1 ? 's' : ''}`,
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Confirmer ✓', onPress: async () => {
          addActing(resa.id);
          try {
            await supabase.from('reservations').update({ status: 'confirmed' }).eq('id', resa.id);
            await sendNotification(
              resa.users, 'confirm', 'Réservation confirmée ✅',
              `Votre table chez ${restaurant?.name} le ${formatDate(resa.date)} à ${resa.time_slot?.slice(0,5)} est confirmée.`,
            );
          } finally {
            removeActing(resa.id);
            load();
          }
        }},
      ]
    );
  }, [clientName, addActing, removeActing, load, restaurant]);

  const cancel = useCallback((resa) => {
    Alert.alert(
      'Refuser la réservation',
      `${clientName(resa)} · ${formatDate(resa.date)} à ${resa.time_slot?.slice(0,5)}`,
      [
        { text: 'Retour', style: 'cancel' },
        { text: 'Refuser ✕', style: 'destructive', onPress: async () => {
          addActing(resa.id);
          try {
            await supabase.from('reservations')
              .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
              .eq('id', resa.id);
            await sendNotification(
              resa.users, 'cancellation', 'Réservation annulée',
              `Votre réservation chez ${restaurant?.name} le ${formatDate(resa.date)} n'a pas pu être confirmée.`,
            );
          } finally {
            removeActing(resa.id);
            load();
          }
        }},
      ]
    );
  }, [clientName, addActing, removeActing, load, restaurant]);

  const markArrived = useCallback(async (resa) => {
    addActing(resa.id);
    try {
      await supabase.from('reservations').update({ status: 'arrived' }).eq('id', resa.id);
    } finally {
      removeActing(resa.id);
      load();
    }
  }, [addActing, removeActing, load]);

  /* Stats */
  const { t, tm, we } = useMemo(() => ({ t: todayStr(), tm: tomorrowStr(), we: weekEndStr() }), []);

  const todayResas = useMemo(
    () => reservations.filter(r => r.date === t),
    [reservations, t],
  );
  const pendingAll = useMemo(
    () => reservations.filter(r => r.status === 'pending'),
    [reservations],
  );
  const confirmedToday = useMemo(
    () => todayResas.filter(r => r.status === 'confirmed' || r.status === 'arrived'),
    [todayResas],
  );
  const totalCovers = useMemo(
    () => confirmedToday.reduce((acc, r) => acc + (r.nb_adults || 0) + (r.nb_children || 0), 0),
    [confirmedToday],
  );
  const revenue = useMemo(
    () => restaurant?.avg_ticket > 0 ? totalCovers * restaurant.avg_ticket : null,
    [totalCovers, restaurant],
  );

  const upcomingCount = useMemo(() => {
    const now = new Date();
    const pad = n => String(n).padStart(2, '0');
    const soon      = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    const future    = new Date(now.getTime() + 60 * 60 * 1000);
    const soonLimit = `${pad(future.getHours())}:${pad(future.getMinutes())}`;
    return confirmedToday.filter(r => {
      const ts = r.time_slot?.slice(0, 5) || '00:00';
      return ts >= soon && ts <= soonLimit;
    }).length;
  }, [confirmedToday]);

  /* Filtrage */
  const filtered = useMemo(() => reservations.filter(r => {
    const statusOk = filter === 'Tout' || r.status === FILTER_MAP[filter];
    let dateOk = true;
    if      (dateFilter === "Aujourd'hui")   dateOk = r.date === t;
    else if (dateFilter === 'Demain')        dateOk = r.date === tm;
    else if (dateFilter === 'Cette semaine') dateOk = r.date >= t && r.date <= we;
    return statusOk && dateOk;
  }), [reservations, filter, dateFilter, t, tm, we]);

  const showGroups = useMemo(() => dateFilter === "Aujourd'hui" && filter === 'Tout', [dateFilter, filter]);
  const midi = useMemo(
    () => filtered.filter(r => parseInt((r.time_slot || '00:00').split(':')[0]) < 17),
    [filtered],
  );
  const soir = useMemo(
    () => filtered.filter(r => parseInt((r.time_slot || '00:00').split(':')[0]) >= 17),
    [filtered],
  );

  const greetingTxt = useMemo(() => greeting(), []);
  const onRefresh   = useCallback(() => load(true), [load]);
  const goPromos    = useCallback(() => navigation.navigate('ProPromos'),   [navigation]);
  const goComptoir  = useCallback(() => navigation.navigate('ProComptoir'), [navigation]);
  const goMenu      = useCallback(() => navigation.navigate('ProMenu'),     [navigation]);
  const goAvis      = useCallback(() => navigation.navigate('ProAvis'),     [navigation]);
  const signOut     = useCallback(() => supabase.auth.signOut(), []);

  if (loading) {
    return (
      <SafeAreaView style={s.root}>
        <SkeletonDashboard />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
      >

        {/* ── Header ── */}
        <View style={s.header}>
          <View style={{ flex:1 }}>
            <Text style={s.headerGreeting}>{greetingTxt} 👋</Text>
            <Text style={s.headerTitle}>{restaurant?.name || 'Manager'}</Text>
          </View>
          <View style={{ gap: spacing.md, alignItems: 'flex-end' }}>
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <TouchableOpacity style={s.comptoirBtn} onPress={goPromos}>
                <Text style={s.comptoirBtnTxt}>🏷️  Promos</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.comptoirBtn} onPress={goComptoir}>
                <Text style={s.comptoirBtnTxt}>📟  Comptoir</Text>
              </TouchableOpacity>
            </View>
            <View style={s.onlineBadge}>
              <View style={s.onlineDot} />
              <Text style={s.onlineTxt}>En ligne</Text>
            </View>
          </View>
        </View>

        {/* ── Carte restaurant ── */}
        {restaurant && (
          <View style={s.restoCard}>
            {restaurant.photos?.[0]
              ? <Image source={{ uri:restaurant.photos[0] }} style={s.restoPhoto} resizeMode="cover" />
              : <View style={s.restoPhotoPlaceholder}><Text style={{ fontSize:22 }}>🍽️</Text></View>
            }
            <View style={{ flex:1 }}>
              <Text style={s.restoName}>{restaurant.name}</Text>
              <Text style={s.restoMeta}>
                {(restaurant.cuisine_type || '').replace(/_/g,' ')}
                {restaurant.quartier ? '  ·  ' + restaurant.quartier : ''}
              </Text>
              {restaurant.avg_rating > 0 && (
                <Text style={s.restoRating}>★ {Number(restaurant.avg_rating).toFixed(1)}  {restaurant.capacity > 0 ? `·  ${restaurant.capacity} couverts` : ''}</Text>
              )}
            </View>
            <View style={{ gap: spacing.sm, alignItems: 'flex-end' }}>
              <TouchableOpacity style={s.menuShortcut} onPress={goMenu}>
                <Text style={s.menuShortcutTxt}>🍽️ Menu</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.menuShortcut} onPress={goAvis}>
                <Text style={s.menuShortcutTxt}>⭐ Avis</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── KPIs ── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.statsRow}>
          <StatCard icon="📅" value={todayResas.length}      label={`Résa\naujourd'hui`} color={colors.blue} />
          <StatCard icon="⏳" value={pendingAll.length}       label="En attente"          color={colors.accent} alert={pendingAll.length > 0} sub={pendingAll.length > 0 ? 'Action requise' : ''} />
          <StatCard icon="✅" value={confirmedToday.length}   label={`Confirmées\nauj.`}  color={colors.green} />
          <StatCard icon="🪑" value={totalCovers}             label="Couverts\nconfirmés" color={colors.textMuted} />
          {revenue != null && (
            <StatCard icon="💰" value={`${(revenue/1000).toFixed(0)}k`} label="Revenus est.\naujourd'hui" color={colors.accent} sub="DA" />
          )}
        </ScrollView>

        {/* ── Alerte ── */}
        <AlertBanner pendingCount={pendingAll.length} upcomingCount={upcomingCount} />

        {/* ── Bande 7 jours ── */}
        <WeekStrip reservations={reservations} />

        {/* ── Filtre date ── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipRow}>
          {DATE_FILTERS.map(f => (
            <TouchableOpacity key={f} style={[s.chip, dateFilter === f && s.chipOn]} onPress={() => setDateFilter(f)}>
              <Text style={[s.chipTxt, dateFilter === f && s.chipTxtOn]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── Tabs statut ── */}
        <View style={s.statusTabs}>
          {FILTERS.map(f => (
            <TouchableOpacity key={f} style={[s.statusTab, filter === f && s.statusTabOn]} onPress={() => setFilter(f)}>
              <Text style={[s.statusTabTxt, filter === f && s.statusTabTxtOn]}>{f}</Text>
              {f === 'En attente' && pendingAll.length > 0 && (
                <View style={s.badge}><Text style={s.badgeTxt}>{pendingAll.length}</Text></View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Compteur ── */}
        <View style={s.listHead}>
          <Text style={s.listHeadTxt}>{filtered.length} réservation{filtered.length !== 1 ? 's' : ''}</Text>
        </View>

        {/* ── Liste ── */}
        {filtered.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyEmoji}>📭</Text>
            <Text style={s.emptyTitle}>Aucune réservation</Text>
            <Text style={s.emptyDesc}>Modifiez les filtres pour voir plus de résultats.</Text>
          </View>
        ) : showGroups ? (
          <>
            {midi.length > 0 && (
              <>
                <View style={s.groupHeader}>
                  <Text style={s.groupIcon}>☀️</Text>
                  <Text style={s.groupLabel}>Déjeuner</Text>
                  <Text style={s.groupCount}>{midi.length} table{midi.length > 1 ? 's' : ''}</Text>
                </View>
                {midi.map(r => (
                  <ResaCard key={r.id} r={r} clientName={clientName}
                    onConfirm={() => confirm(r)} onCancel={() => cancel(r)} onArrived={() => markArrived(r)}
                    isActing={acting.has(r.id)} isToday={true} />
                ))}
              </>
            )}
            {soir.length > 0 && (
              <>
                <View style={s.groupHeader}>
                  <Text style={s.groupIcon}>🌙</Text>
                  <Text style={s.groupLabel}>Dîner</Text>
                  <Text style={s.groupCount}>{soir.length} table{soir.length > 1 ? 's' : ''}</Text>
                </View>
                {soir.map(r => (
                  <ResaCard key={r.id} r={r} clientName={clientName}
                    onConfirm={() => confirm(r)} onCancel={() => cancel(r)} onArrived={() => markArrived(r)}
                    isActing={acting.has(r.id)} isToday={true} />
                ))}
              </>
            )}
            {midi.length === 0 && soir.length === 0 && (
              <View style={s.empty}>
                <Text style={s.emptyEmoji}>📭</Text>
                <Text style={s.emptyTitle}>Aucune réservation aujourd'hui</Text>
              </View>
            )}
          </>
        ) : (
          filtered.map(r => (
            <ResaCard key={r.id} r={r} clientName={clientName}
              onConfirm={() => confirm(r)} onCancel={() => cancel(r)} onArrived={() => markArrived(r)}
              isActing={acting.has(r.id)} isToday={r.date === t} />
          ))
        )}

        <View style={{ height: spacing.xxxl }} />

        <TouchableOpacity style={s.signOutBtn} onPress={signOut}>
          <Text style={s.signOutTxt}>Se déconnecter</Text>
        </TouchableOpacity>

        <View style={{ height: 48 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:   { flex:1, backgroundColor: colors.bg },

  /* Header */
  header:         { flexDirection:'row', alignItems:'flex-start', paddingHorizontal: spacing.xxl, paddingTop: spacing.xl, paddingBottom: spacing.xl, borderBottomWidth:1, borderBottomColor: colors.cardBorder, gap: spacing.lg },
  headerGreeting: { color: colors.textMuted, fontSize: typography.size.body, marginBottom: spacing.xxs },
  headerTitle:    { color: colors.text, fontSize: typography.size.title+4, fontWeight:'300', letterSpacing:0.5 },
  comptoirBtn:    { flexDirection:'row', alignItems:'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm+1, borderRadius: radius.lg, backgroundColor: colors.accentSoft, borderWidth:1, borderColor:'rgba(232,160,69,0.3)' },
  comptoirBtnTxt: { color: colors.accent, fontSize: typography.size.body },
  onlineBadge:    { flexDirection:'row', alignItems:'center', gap: spacing.sm, backgroundColor: colors.greenSoft, borderRadius: radius.full, paddingHorizontal: spacing.lg, paddingVertical: spacing.xs, borderWidth:1, borderColor:'rgba(76,175,130,0.25)' },
  onlineDot:      { width:6, height:6, borderRadius:3, backgroundColor: colors.green },
  onlineTxt:      { color: colors.green, fontSize: typography.size.sm },

  /* Restaurant */
  restoCard:             { flexDirection:'row', alignItems:'center', gap: spacing.lg, marginHorizontal: spacing.xxl, marginTop: spacing.lg, marginBottom: spacing.lg, backgroundColor: colors.card, borderRadius: radius.xxl, borderWidth:1, borderColor: colors.cardBorder, padding: spacing.lg, overflow:'hidden' },
  restoPhoto:            { width:52, height:52, borderRadius: radius.lg },
  restoPhotoPlaceholder: { width:52, height:52, borderRadius: radius.lg, backgroundColor: colors.cardHover, alignItems:'center', justifyContent:'center' },
  restoName:             { color: colors.text, fontSize: typography.size.heading3, marginBottom: spacing.xxs },
  restoMeta:             { color: colors.accent, fontSize: typography.size.sm, letterSpacing:1.5, marginBottom: spacing.xxs },
  restoRating:           { color: colors.textMuted, fontSize: typography.size.caption },
  menuShortcut:          { backgroundColor: colors.accentSoft, borderRadius: radius.lg, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderWidth:1, borderColor:'rgba(232,160,69,0.3)' },
  menuShortcutTxt:       { color: colors.accent, fontSize: typography.size.sm, fontWeight: typography.weight.medium },

  /* Stats */
  statsRow:  { paddingHorizontal: spacing.xxl, paddingBottom: spacing.xl, gap: spacing.lg },

  /* Chips date */
  chipRow:   { paddingHorizontal: spacing.xxl, paddingBottom: spacing.lg, gap: spacing.md },
  chip:      { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm+1, borderRadius: radius.full, backgroundColor: colors.card, borderWidth:1, borderColor: colors.cardBorder },
  chipOn:    { backgroundColor: colors.accentSoft, borderColor: colors.accent },
  chipTxt:   { color: colors.textMuted, fontSize: typography.size.body },
  chipTxtOn: { color: colors.accent },

  /* Tabs statut */
  statusTabs:     { flexDirection:'row', marginHorizontal: spacing.xxl, marginBottom: spacing.lg, backgroundColor: colors.card, borderRadius: radius.xl, borderWidth:1, borderColor: colors.cardBorder, padding: spacing.xxs+1, gap: spacing.xxs },
  statusTab:      { flex:1, flexDirection:'row', alignItems:'center', justifyContent:'center', paddingVertical: spacing.md+1, borderRadius: radius.lg, gap: spacing.xs },
  statusTabOn:    { backgroundColor: colors.cardHover },
  statusTabTxt:   { color: colors.textDim, fontSize: typography.size.caption },
  statusTabTxtOn: { color: colors.text },
  badge:          { backgroundColor: colors.accent, borderRadius: radius.md, minWidth:16, height:16, alignItems:'center', justifyContent:'center', paddingHorizontal: spacing.xxs+1 },
  badgeTxt:       { color: colors.bg, fontSize: typography.size.xs, fontWeight: typography.weight.bold },

  /* List */
  listHead:    { paddingHorizontal: spacing.xxl, paddingBottom: spacing.md },
  listHeadTxt: { color: colors.textDim, fontSize: typography.size.sm, letterSpacing: 2 },

  /* Groups */
  groupHeader: { flexDirection:'row', alignItems:'center', gap: spacing.md, paddingHorizontal: spacing.xxl, paddingVertical: spacing.lg, marginTop: spacing.xs },
  groupIcon:   { fontSize: 14 },
  groupLabel:  { color: colors.text, fontSize: typography.size.bodyLg, flex:1 },
  groupCount:  { color: colors.textDim, fontSize: typography.size.caption },

  /* Empty */
  empty:      { alignItems:'center', paddingVertical: 48, gap: spacing.md },
  emptyEmoji: { fontSize: 36 },
  emptyTitle: { color: colors.textMuted, fontSize: typography.size.subheading, fontWeight:'300' },
  emptyDesc:  { color: colors.textDim, fontSize: typography.size.body },

  /* Sign out */
  signOutBtn: { marginHorizontal: spacing.xxl, paddingVertical: spacing.lg, borderRadius: radius.xl, borderWidth:1, borderColor:'rgba(224,90,90,0.2)', alignItems:'center' },
  signOutTxt: { color: colors.red, fontSize: typography.size.bodyLg },
});
