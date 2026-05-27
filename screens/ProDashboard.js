import { useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, ActivityIndicator, Alert, RefreshControl, Image,
} from 'react-native';
import { supabase } from '../supabase';

const C = {
  bg:'#0d1628', bg2:'#111827', bg3:'#1a2332',
  accent:'#c8975a', accent2:'#4a7fa5',
  text:'#f0ece4', dim:'#8a9ab0', dimmer:'#4a5568',
  green:'#3d9970', red:'#e05a5a', orange:'#e07a2a', card:'#141e2e',
  border:'rgba(255,255,255,0.07)',
  borderAccent:'rgba(200,151,90,0.3)',
};

const STATUS = {
  pending:   { label:'EN ATTENTE', color:'#c8975a', bg:'rgba(200,151,90,0.1)',  border:'rgba(200,151,90,0.3)'  },
  confirmed: { label:'CONFIRMÉE',  color:'#3d9970', bg:'rgba(61,153,112,0.1)',  border:'rgba(61,153,112,0.3)'  },
  cancelled: { label:'ANNULÉE',    color:'#e05a5a', bg:'rgba(224,90,90,0.1)',   border:'rgba(224,90,90,0.3)'   },
  completed: { label:'TERMINÉE',   color:'#8a9ab0', bg:'rgba(138,154,176,0.1)', border:'rgba(138,154,176,0.3)' },
  arrived:   { label:'ARRIVÉ',     color:'#4a7fa5', bg:'rgba(74,127,165,0.1)',  border:'rgba(74,127,165,0.3)'  },
  no_show:   { label:'NO SHOW',    color:'#e05a5a', bg:'rgba(224,90,90,0.1)',   border:'rgba(224,90,90,0.3)'   },
};

const FILTERS      = ['Tout','En attente','Confirmées','Annulées'];
const FILTER_MAP   = { 'En attente':'pending', 'Confirmées':'confirmed', 'Annulées':'cancelled' };
const DATE_FILTERS = ["Aujourd'hui",'Demain','Cette semaine','Tout'];

const AVATAR_COLORS = ['#c8975a','#4a7fa5','#3d9970','#9b6cc8','#e07a2a','#5ab4c8'];
function avatarColor(name) {
  let h = 0;
  for (let i = 0; i < (name||'').length; i++) h = (h * 31 + name.charCodeAt(i)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[Math.abs(h)];
}

function todayStr()    { return new Date().toISOString().split('T')[0]; }
function tomorrowStr() { const d = new Date(); d.setDate(d.getDate()+1); return d.toISOString().split('T')[0]; }
function weekEndStr()  { const d = new Date(); d.setDate(d.getDate()+6); return d.toISOString().split('T')[0]; }

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
                <View style={[ws.bar, { height: barH || 2, backgroundColor: d.isToday ? C.accent : d.count > 0 ? C.accent2 : C.bg3 }]} />
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
  wrap:         { marginHorizontal:20, marginBottom:16, backgroundColor:C.bg2, borderRadius:16, borderWidth:1, borderColor:C.border, padding:16 },
  title:        { color:C.dimmer, fontSize:9, letterSpacing:3, marginBottom:12 },
  row:          { flexDirection:'row', justifyContent:'space-between', alignItems:'flex-end' },
  col:          { alignItems:'center', gap:3, flex:1 },
  countLbl:     { color:C.accent, fontSize:9, fontWeight:'500', minHeight:12 },
  barTrack:     { height:38, justifyContent:'flex-end', width:'70%' },
  bar:          { borderRadius:3, minHeight:2 },
  dayNum:       { color:C.dim, fontSize:11 },
  dayNumToday:  { color:C.accent, fontWeight:'500' },
  dayLabel:     { color:C.dimmer, fontSize:9 },
  dayLabelToday:{ color:C.accent },
});

/* ─── Carte stat ─── */
function StatCard({ icon, value, label, color, alert, sub }) {
  return (
    <View style={[sc.card, alert && { borderColor: color + '55' }]}>
      {alert && <View style={[sc.dot, { backgroundColor:color }]} />}
      <Text style={sc.icon}>{icon}</Text>
      <Text style={[sc.value, { color }]}>{value}</Text>
      <Text style={sc.label}>{label}</Text>
      {!!sub && <Text style={sc.sub}>{sub}</Text>}
    </View>
  );
}
const sc = StyleSheet.create({
  card:  { width:116, backgroundColor:C.bg2, borderRadius:16, borderWidth:1, borderColor:C.border, padding:14, gap:4 },
  icon:  { fontSize:20 },
  value: { fontSize:26, fontWeight:'200' },
  label: { color:C.dimmer, fontSize:9, lineHeight:14 },
  sub:   { color:C.dim, fontSize:10, marginTop:2 },
  dot:   { position:'absolute', top:10, right:10, width:8, height:8, borderRadius:4 },
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
  wrap: { flexDirection:'row', alignItems:'center', gap:12, marginHorizontal:20, marginBottom:14, backgroundColor:'rgba(200,151,90,0.08)', borderRadius:14, borderWidth:1, borderColor:'rgba(200,151,90,0.3)', padding:14 },
  icon: { fontSize:18 },
  txt:  { color:C.dim, fontSize:12, lineHeight:18 },
  bold: { color:C.accent, fontWeight:'500' },
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
      {/* Top row */}
      <View style={rc.top}>
        {/* Heure + date */}
        <View style={rc.timeCol}>
          <Text style={rc.timeVal}>{r.time_slot?.slice(0,5) || '—'}</Text>
          <Text style={rc.dateVal}>{formatDate(r.date)}</Text>
        </View>

        {/* Avatar + nom */}
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

        {/* Badge statut */}
        <View style={[rc.badge, { backgroundColor:st.bg, borderColor:st.border }]}>
          <Text style={[rc.badgeTxt, { color:st.color }]}>{st.label}</Text>
        </View>
      </View>

      {/* Note client */}
      {!!r.notes && (
        <View style={rc.noteWrap}>
          <Text style={rc.noteIcon}>💬</Text>
          <Text style={rc.noteTxt}>{r.notes}</Text>
        </View>
      )}

      {/* Actions */}
      {(showActions || showArrivedBtn) && (
        <View style={rc.actions}>
          {showActions && (
            <>
              <TouchableOpacity style={rc.btnConfirm} onPress={onConfirm} disabled={isActing}>
                {isActing ? <ActivityIndicator size={14} color={C.green} />
                  : <Text style={rc.btnConfirmTxt}>✓  Confirmer</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={rc.btnRefuse} onPress={onCancel} disabled={isActing}>
                <Text style={rc.btnRefuseTxt}>✕  Refuser</Text>
              </TouchableOpacity>
            </>
          )}
          {showArrivedBtn && (
            <TouchableOpacity style={rc.btnArrived} onPress={onArrived} disabled={isActing}>
              {isActing ? <ActivityIndicator size={14} color={C.accent2} />
                : <Text style={rc.btnArrivedTxt}>🪑  Client arrivé</Text>}
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const rc = StyleSheet.create({
  card:       { backgroundColor:C.card, borderRadius:16, borderWidth:1, borderColor:C.border, borderLeftWidth:3, marginHorizontal:20, marginBottom:10, padding:16, gap:10 },
  top:        { flexDirection:'row', alignItems:'center', gap:10 },
  timeCol:    { alignItems:'center', minWidth:46 },
  timeVal:    { color:C.text, fontSize:15, fontWeight:'500' },
  dateVal:    { color:C.dimmer, fontSize:9, marginTop:2 },
  avatar:     { width:36, height:36, borderRadius:18, borderWidth:1, alignItems:'center', justifyContent:'center' },
  avatarTxt:  { fontSize:12, fontWeight:'500' },
  name:       { color:C.text, fontSize:14, fontWeight:'300', marginBottom:3 },
  coverRow:   { flexDirection:'row', gap:6, alignItems:'center' },
  coverTxt:   { color:C.dim, fontSize:12 },
  childTxt:   { color:C.dimmer, fontSize:11 },
  badge:      { borderRadius:8, borderWidth:1, paddingHorizontal:8, paddingVertical:4 },
  badgeTxt:   { fontSize:8, fontWeight:'600', letterSpacing:1 },
  noteWrap:   { flexDirection:'row', gap:8, backgroundColor:C.bg2, borderRadius:10, padding:10 },
  noteIcon:   { fontSize:13 },
  noteTxt:    { color:C.dim, fontSize:12, lineHeight:18, flex:1 },
  actions:    { flexDirection:'row', gap:8 },
  btnConfirm: { flex:1, flexDirection:'row', alignItems:'center', justifyContent:'center', gap:6, paddingVertical:11, borderRadius:10, backgroundColor:'rgba(61,153,112,0.1)', borderWidth:1, borderColor:'rgba(61,153,112,0.3)' },
  btnConfirmTxt:{ color:C.green, fontSize:13, fontWeight:'500' },
  btnRefuse:  { flex:1, flexDirection:'row', alignItems:'center', justifyContent:'center', gap:6, paddingVertical:11, borderRadius:10, backgroundColor:'rgba(224,90,90,0.07)', borderWidth:1, borderColor:'rgba(224,90,90,0.25)' },
  btnRefuseTxt: { color:C.red, fontSize:13 },
  btnArrived: { flex:1, flexDirection:'row', alignItems:'center', justifyContent:'center', gap:6, paddingVertical:11, borderRadius:10, backgroundColor:'rgba(74,127,165,0.1)', borderWidth:1, borderColor:'rgba(74,127,165,0.3)' },
  btnArrivedTxt:{ color:C.accent2, fontSize:13, fontWeight:'400' },
});

/* ─── Écran principal ─── */
export default function ProDashboard({ navigation }) {
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
    const { data:{ session } } = await supabase.auth.getSession();
    if (!session) { setLoading(false); setRefreshing(false); return; }

    const { data: ownerRow } = await supabase
      .from('restaurant_owners')
      .select('restaurant_id, restaurants(id, name, city, quartier, cuisine_type, photo_url, avg_rating, avg_ticket, capacity)')
      .eq('auth_id', session.user.id)
      .single();

    if (ownerRow?.restaurants) setRestaurant(ownerRow.restaurants);

    const { data: res } = await supabase
      .from('reservations')
      .select('id, date, time_slot, nb_adults, nb_children, notes, status, created_at, users(first_name, last_name, email)')
      .order('date', { ascending:true })
      .order('time_slot', { ascending:true });

    setReservations(res ?? []);
    setLoading(false);
    setRefreshing(false);
  }

  const clientName = (r) => {
    if (!r.users) return 'Client inconnu';
    const fn = r.users.first_name || '';
    const ln = r.users.last_name  || '';
    return (fn + ' ' + ln).trim() || r.users.email?.split('@')[0] || 'Client';
  };

  async function confirm(resa) {
    Alert.alert(
      'Confirmer la réservation',
      `${clientName(resa)} · ${formatDate(resa.date)} à ${resa.time_slot?.slice(0,5)}\n${resa.nb_adults} adulte${resa.nb_adults > 1 ? 's' : ''}`,
      [
        { text:'Annuler', style:'cancel' },
        { text:'Confirmer ✓', onPress: async () => {
          setActing(p => new Set(p).add(resa.id));
          await supabase.from('reservations').update({ status:'confirmed' }).eq('id', resa.id);
          if (resa.users) {
            const { data:u } = await supabase.from('users').select('id').eq('email', resa.users.email).maybeSingle();
            if (u) {
              await supabase.from('notifications').insert({
                recipient_id:u.id, recipient_type:'user', type:'confirm',
                title:'Réservation confirmée ✅',
                body:`Votre table chez ${restaurant?.name} le ${formatDate(resa.date)} à ${resa.time_slot?.slice(0,5)} est confirmée.`,
              });
            }
          }
          setActing(p => { const s = new Set(p); s.delete(resa.id); return s; });
          load();
        }},
      ]
    );
  }

  async function cancel(resa) {
    Alert.alert(
      'Refuser la réservation',
      `${clientName(resa)} · ${formatDate(resa.date)} à ${resa.time_slot?.slice(0,5)}`,
      [
        { text:'Retour', style:'cancel' },
        { text:'Refuser ✕', style:'destructive', onPress: async () => {
          setActing(p => new Set(p).add(resa.id));
          await supabase.from('reservations')
            .update({ status:'cancelled', cancelled_at: new Date().toISOString() })
            .eq('id', resa.id);
          if (resa.users) {
            const { data:u } = await supabase.from('users').select('id').eq('email', resa.users.email).maybeSingle();
            if (u) {
              await supabase.from('notifications').insert({
                recipient_id:u.id, recipient_type:'user', type:'cancellation',
                title:'Réservation annulée',
                body:`Votre réservation chez ${restaurant?.name} le ${formatDate(resa.date)} n'a pas pu être confirmée.`,
              });
            }
          }
          setActing(p => { const s = new Set(p); s.delete(resa.id); return s; });
          load();
        }},
      ]
    );
  }

  async function markArrived(resa) {
    setActing(p => new Set(p).add(resa.id));
    await supabase.from('reservations').update({ status:'arrived' }).eq('id', resa.id);
    setActing(p => { const s = new Set(p); s.delete(resa.id); return s; });
    load();
  }

  /* Stats */
  const t           = todayStr();
  const todayResas  = reservations.filter(r => r.date === t);
  const pendingAll  = reservations.filter(r => r.status === 'pending');
  const confirmedToday = todayResas.filter(r => r.status === 'confirmed' || r.status === 'arrived');
  const totalCovers = confirmedToday.reduce((acc, r) => acc + (r.nb_adults||0) + (r.nb_children||0), 0);
  const revenue     = restaurant?.avg_ticket > 0 ? totalCovers * restaurant.avg_ticket : null;

  /* Upcoming dans 1h */
  const now = new Date();
  const soon = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
  const inOneHour = new Date(now.getTime() + 60*60*1000);
  const soonLimit = `${String(inOneHour.getHours()).padStart(2,'0')}:${String(inOneHour.getMinutes()).padStart(2,'0')}`;
  const upcomingCount = confirmedToday.filter(r => {
    const ts = r.time_slot?.slice(0,5) || '00:00';
    return ts >= soon && ts <= soonLimit;
  }).length;

  /* Filtrage */
  const filtered = reservations.filter(r => {
    const statusOk = filter === 'Tout' || r.status === FILTER_MAP[filter];
    const tm = tomorrowStr(); const we = weekEndStr();
    let dateOk = true;
    if      (dateFilter === "Aujourd'hui")   dateOk = r.date === t;
    else if (dateFilter === 'Demain')        dateOk = r.date === tm;
    else if (dateFilter === 'Cette semaine') dateOk = r.date >= t && r.date <= we;
    return statusOk && dateOk;
  });

  /* Groupement Midi / Soir pour "Aujourd'hui" */
  const showGroups = dateFilter === "Aujourd'hui" && filter === 'Tout';
  const midi = filtered.filter(r => { const h = parseInt((r.time_slot || '00:00').split(':')[0]); return h < 17; });
  const soir = filtered.filter(r => { const h = parseInt((r.time_slot || '00:00').split(':')[0]); return h >= 17; });

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
          <View style={{ flex:1 }}>
            <Text style={s.headerGreeting}>{greeting()} 👋</Text>
            <Text style={s.headerTitle}>{restaurant?.name || 'Manager'}</Text>
          </View>
          <View style={{ gap:8, alignItems:'flex-end' }}>
            <TouchableOpacity style={s.comptoirBtn} onPress={() => navigation.navigate('ProComptoir')}>
              <Text style={s.comptoirBtnTxt}>📟  Comptoir</Text>
            </TouchableOpacity>
            <View style={s.onlineBadge}>
              <View style={s.onlineDot} />
              <Text style={s.onlineTxt}>En ligne</Text>
            </View>
          </View>
        </View>

        {/* ── Carte restaurant ── */}
        {restaurant && (
          <View style={s.restoCard}>
            {restaurant.photo_url
              ? <Image source={{ uri:restaurant.photo_url }} style={s.restoPhoto} resizeMode="cover" />
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
          </View>
        )}

        {/* ── KPIs ── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.statsRow}>
          <StatCard icon="📅" value={todayResas.length}  label={`Résa\naujourd'hui`} color={C.accent2} />
          <StatCard icon="⏳" value={pendingAll.length}   label="En attente" color={C.accent} alert={pendingAll.length > 0} sub={pendingAll.length > 0 ? 'Action requise' : ''} />
          <StatCard icon="✅" value={confirmedToday.length} label={`Confirmées\nauj.`} color={C.green} />
          <StatCard icon="🪑" value={totalCovers}         label="Couverts\nconfirmés" color={C.dim} />
          {revenue != null && (
            <StatCard icon="💰" value={`${(revenue/1000).toFixed(0)}k`} label="Revenus est.\naujourd'hui" color={C.accent} sub="DA" />
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

        <View style={{ height:24 }} />

        {/* ── Déconnexion ── */}
        <TouchableOpacity style={s.signOutBtn} onPress={() => supabase.auth.signOut()}>
          <Text style={s.signOutTxt}>Se déconnecter</Text>
        </TouchableOpacity>

        <View style={{ height:48 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:   { flex:1, backgroundColor:C.bg },
  center: { flex:1, alignItems:'center', justifyContent:'center' },

  /* Header */
  header:        { flexDirection:'row', alignItems:'flex-start', paddingHorizontal:20, paddingTop:16, paddingBottom:16, borderBottomWidth:1, borderBottomColor:C.border, gap:12 },
  headerGreeting:{ color:C.dim, fontSize:12, marginBottom:3 },
  headerTitle:   { color:C.text, fontSize:24, fontWeight:'300', letterSpacing:0.5 },
  comptoirBtn:   { flexDirection:'row', alignItems:'center', paddingHorizontal:12, paddingVertical:7, borderRadius:10, backgroundColor:'rgba(200,151,90,0.1)', borderWidth:1, borderColor:C.borderAccent },
  comptoirBtnTxt:{ color:C.accent, fontSize:12 },
  onlineBadge:   { flexDirection:'row', alignItems:'center', gap:5, backgroundColor:'rgba(61,153,112,0.1)', borderRadius:100, paddingHorizontal:10, paddingVertical:4, borderWidth:1, borderColor:'rgba(61,153,112,0.25)' },
  onlineDot:     { width:6, height:6, borderRadius:3, backgroundColor:C.green },
  onlineTxt:     { color:C.green, fontSize:10 },

  /* Restaurant */
  restoCard:            { flexDirection:'row', alignItems:'center', gap:12, marginHorizontal:20, marginTop:14, marginBottom:14, backgroundColor:C.bg2, borderRadius:16, borderWidth:1, borderColor:C.border, padding:14, overflow:'hidden' },
  restoPhoto:           { width:52, height:52, borderRadius:12 },
  restoPhotoPlaceholder:{ width:52, height:52, borderRadius:12, backgroundColor:C.bg3, alignItems:'center', justifyContent:'center' },
  restoName:            { color:C.text, fontSize:15, fontWeight:'400', marginBottom:3 },
  restoMeta:            { color:C.accent, fontSize:10, letterSpacing:1.5, marginBottom:3 },
  restoRating:          { color:C.dim, fontSize:11 },

  /* Stats */
  statsRow:  { paddingHorizontal:20, paddingBottom:16, gap:10 },

  /* Chips date */
  chipRow:   { paddingHorizontal:20, paddingBottom:12, gap:8 },
  chip:      { paddingHorizontal:14, paddingVertical:7, borderRadius:100, backgroundColor:C.bg2, borderWidth:1, borderColor:C.border },
  chipOn:    { backgroundColor:'rgba(200,151,90,0.12)', borderColor:C.accent },
  chipTxt:   { color:C.dim, fontSize:12 },
  chipTxtOn: { color:C.accent },

  /* Tabs statut */
  statusTabs:    { flexDirection:'row', marginHorizontal:20, marginBottom:10, backgroundColor:C.bg2, borderRadius:14, borderWidth:1, borderColor:C.border, padding:3, gap:2 },
  statusTab:     { flex:1, flexDirection:'row', alignItems:'center', justifyContent:'center', paddingVertical:8, borderRadius:11, gap:4 },
  statusTabOn:   { backgroundColor:C.bg3 },
  statusTabTxt:  { color:C.dimmer, fontSize:11 },
  statusTabTxtOn:{ color:C.text },
  badge:         { backgroundColor:C.accent, borderRadius:8, minWidth:16, height:16, alignItems:'center', justifyContent:'center', paddingHorizontal:3 },
  badgeTxt:      { color:C.bg, fontSize:9, fontWeight:'700' },

  /* List */
  listHead:    { paddingHorizontal:20, paddingBottom:8 },
  listHeadTxt: { color:C.dimmer, fontSize:10, letterSpacing:2 },

  /* Groups */
  groupHeader: { flexDirection:'row', alignItems:'center', gap:8, paddingHorizontal:20, paddingVertical:10, marginTop:4 },
  groupIcon:   { fontSize:14 },
  groupLabel:  { color:C.text, fontSize:13, fontWeight:'400', flex:1 },
  groupCount:  { color:C.dimmer, fontSize:11 },

  /* Empty */
  empty:      { alignItems:'center', paddingVertical:48, gap:8 },
  emptyEmoji: { fontSize:36 },
  emptyTitle: { color:C.dim, fontSize:14, fontWeight:'300' },
  emptyDesc:  { color:C.dimmer, fontSize:12 },

  /* Sign out */
  signOutBtn: { marginHorizontal:20, paddingVertical:14, borderRadius:14, borderWidth:1, borderColor:'rgba(224,90,90,0.2)', alignItems:'center' },
  signOutTxt: { color:C.red, fontSize:13 },
});
