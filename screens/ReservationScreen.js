import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, SafeAreaView, Alert, Image, RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../supabase';

const C = {
  bg:'#0d1628', bg2:'#111827', bg3:'#1a2332',
  accent:'#c8975a', accent2:'#4a7fa5',
  text:'#f0ece4', dim:'#8a9ab0', dimmer:'#4a5568',
  green:'#3d9970', red:'#e05a5a', card:'#141e2e',
  border:'rgba(255,255,255,0.07)',
  borderAccent:'rgba(200,151,90,0.2)',
};

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
}

function formatDateLong(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

function daysUntil(dateStr) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + 'T00:00:00');
  const diff = Math.round((target - today) / 86400000);
  if (diff === 0) return "Aujourd'hui";
  if (diff === 1) return 'Demain';
  if (diff > 1)  return `Dans ${diff} jours`;
  return `Il y a ${Math.abs(diff)} jour${Math.abs(diff) > 1 ? 's' : ''}`;
}

function statusCfg(status) {
  switch (status) {
    case 'confirmed': return { label: 'Confirmé',   color: C.green,   bg: 'rgba(61,153,112,0.12)',  border: 'rgba(61,153,112,0.3)' };
    case 'pending':   return { label: 'En attente', color: C.accent,  bg: 'rgba(200,151,90,0.12)',  border: 'rgba(200,151,90,0.3)' };
    case 'arrived':   return { label: 'Arrivé',     color: C.accent2, bg: 'rgba(74,127,165,0.12)',  border: 'rgba(74,127,165,0.2)' };
    case 'no_show':   return { label: 'No Show',    color: C.dim,     bg: 'rgba(138,154,176,0.1)',  border: 'rgba(138,154,176,0.2)' };
    case 'cancelled': return { label: 'Annulé',     color: C.red,     bg: 'rgba(224,90,90,0.1)',    border: 'rgba(224,90,90,0.25)' };
    default:          return { label: status,       color: C.dim,     bg: 'rgba(138,154,176,0.1)',  border: 'rgba(138,154,176,0.2)' };
  }
}

function RestoThumb({ url, size = 52 }) {
  if (url) return <Image source={{ uri: url }} style={{ width: size, height: size, borderRadius: 12 }} resizeMode="cover" />;
  return (
    <View style={{ width: size, height: size, borderRadius: 12, backgroundColor: C.bg3, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: size * 0.4 }}>🍽️</Text>
    </View>
  );
}

export default function ReservationScreen() {
  const [tab,        setTab]        = useState('avenir');
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reservations, setReservations] = useState([]);

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true); else setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setLoading(false); setRefreshing(false); return; }

    const { data: pu } = await supabase.from('users').select('id').eq('auth_id', session.user.id).single();
    if (!pu) { setLoading(false); setRefreshing(false); return; }

    const { data } = await supabase
      .from('reservations')
      .select('*, restaurants(name, photo_url, cuisine_type, avg_rating)')
      .eq('user_id', pu.id)
      .order('date', { ascending: true })
      .order('time_slot', { ascending: true });

    setReservations(data || []);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function cancelResa(resa) {
    Alert.alert(
      'Annuler la réservation',
      `Annuler votre table chez ${resa.restaurants?.name || 'ce restaurant'} le ${formatDate(resa.date)} à ${resa.time_slot} ?`,
      [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Oui, annuler', style: 'destructive',
          onPress: async () => {
            await supabase.from('reservations')
              .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
              .eq('id', resa.id);
            load(true);
          },
        },
      ]
    );
  }

  const today    = new Date().toISOString().split('T')[0];
  const aVenir   = reservations.filter(r => r.date >= today && ['confirmed','pending'].includes(r.status));
  const historique = reservations.filter(r => r.date < today || ['cancelled','no_show','arrived'].includes(r.status));
  const next     = aVenir[0];
  const later    = aVenir.slice(1);
  const pending  = aVenir.filter(r => r.status === 'pending').length;

  if (loading) return (
    <SafeAreaView style={s.root}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={C.accent} size="large" />
      </View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={s.root}>

      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>Mes réservations</Text>
          <Text style={s.headerSub}>
            {aVenir.length} à venir
            {pending > 0 ? ` · ${pending} en attente` : ''}
          </Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={s.tabs}>
        <TouchableOpacity style={[s.tab, tab === 'avenir' && s.tabOn]} onPress={() => setTab('avenir')}>
          <Text style={[s.tabTxt, tab === 'avenir' && s.tabTxtOn]}>À venir</Text>
          {aVenir.length > 0 && (
            <View style={s.tabBadge}><Text style={s.tabBadgeTxt}>{aVenir.length}</Text></View>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={[s.tab, tab === 'historique' && s.tabOn]} onPress={() => setTab('historique')}>
          <Text style={[s.tabTxt, tab === 'historique' && s.tabTxtOn]}>Historique</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={C.accent} />}
      >
        {tab === 'avenir' ? (
          !next ? (
            <View style={s.empty}>
              <Text style={s.emptyEmoji}>📅</Text>
              <Text style={s.emptyTitle}>Aucune réservation à venir</Text>
              <Text style={s.emptySub}>Explorez les restaurants et réservez votre prochaine table.</Text>
            </View>
          ) : (
            <>
              <Text style={s.sectionLabel}>PROCHAINE RÉSERVATION</Text>

              {/* Grande card */}
              <View style={s.mainCard}>
                {next.restaurants?.photo_url
                  ? <Image source={{ uri: next.restaurants.photo_url }} style={s.mainPhoto} resizeMode="cover" />
                  : <View style={[s.mainPhoto, { backgroundColor: C.bg3, alignItems: 'center', justifyContent: 'center' }]}><Text style={{ fontSize: 40 }}>🍽️</Text></View>
                }

                <View style={s.mainBody}>
                  <View style={s.mainTopRow}>
                    <Text style={s.mainName}>{next.restaurants?.name || '—'}</Text>
                    {(() => { const sc = statusCfg(next.status); return (
                      <View style={[s.badge, { backgroundColor: sc.bg, borderColor: sc.border }]}>
                        <Text style={[s.badgeTxt, { color: sc.color }]}>{sc.label}</Text>
                      </View>
                    ); })()}
                  </View>

                  {next.restaurants?.cuisine_type && (
                    <Text style={s.mainCuisine}>{next.restaurants.cuisine_type}</Text>
                  )}

                  <View style={s.countdownRow}>
                    <Text style={s.countdownIcon}>⏳</Text>
                    <Text style={s.countdownTxt}>{daysUntil(next.date)} — {formatDateLong(next.date)}</Text>
                  </View>

                  <View style={s.detailsGrid}>
                    <View style={s.detailBox}>
                      <Text style={s.detailLbl}>HEURE</Text>
                      <Text style={[s.detailVal, { color: C.accent2 }]}>{next.time_slot}</Text>
                    </View>
                    <View style={s.detailBox}>
                      <Text style={s.detailLbl}>ADULTES</Text>
                      <Text style={s.detailVal}>{next.nb_adults}</Text>
                    </View>
                    {next.nb_children > 0 && (
                      <View style={s.detailBox}>
                        <Text style={s.detailLbl}>ENFANTS</Text>
                        <Text style={s.detailVal}>{next.nb_children}</Text>
                      </View>
                    )}
                  </View>

                  {!!next.notes && (
                    <View style={s.notesBox}>
                      <Text style={s.notesLabel}>📝  Note</Text>
                      <Text style={s.notesTxt}>{next.notes}</Text>
                    </View>
                  )}

                  {['confirmed','pending'].includes(next.status) && (
                    <TouchableOpacity style={s.cancelBtn} onPress={() => cancelResa(next)}>
                      <Text style={s.cancelTxt}>Annuler la réservation</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Plus tard */}
              {later.length > 0 && (
                <>
                  <Text style={[s.sectionLabel, { marginTop: 24 }]}>PLUS TARD</Text>
                  {later.map(r => {
                    const sc = statusCfg(r.status);
                    return (
                      <View key={r.id} style={s.smallCard}>
                        <RestoThumb url={r.restaurants?.photo_url} size={54} />
                        <View style={{ flex: 1 }}>
                          <Text style={s.smallName}>{r.restaurants?.name || '—'}</Text>
                          <Text style={s.smallMeta}>{formatDate(r.date)} · {r.time_slot} · {r.nb_adults} pers.</Text>
                          <Text style={s.smallCountdown}>{daysUntil(r.date)}</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end', gap: 6 }}>
                          <View style={[s.badge, { backgroundColor: sc.bg, borderColor: sc.border }]}>
                            <Text style={[s.badgeTxt, { color: sc.color }]}>{sc.label}</Text>
                          </View>
                          {['confirmed','pending'].includes(r.status) && (
                            <TouchableOpacity onPress={() => cancelResa(r)}>
                              <Text style={s.smallCancel}>Annuler</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    );
                  })}
                </>
              )}
            </>
          )
        ) : (
          historique.length === 0 ? (
            <View style={s.empty}>
              <Text style={s.emptyEmoji}>🕰️</Text>
              <Text style={s.emptyTitle}>Aucun historique</Text>
              <Text style={s.emptySub}>Vos réservations passées apparaîtront ici.</Text>
            </View>
          ) : historique.map(r => {
            const sc = statusCfg(r.status);
            return (
              <View key={r.id} style={s.histCard}>
                <RestoThumb url={r.restaurants?.photo_url} size={48} />
                <View style={{ flex: 1 }}>
                  <Text style={s.histName}>{r.restaurants?.name || '—'}</Text>
                  <Text style={s.histMeta}>{formatDate(r.date)} · {r.time_slot} · {r.nb_adults} pers.</Text>
                  {!!r.notes && <Text style={s.histNote} numberOfLines={1}>📝 {r.notes}</Text>}
                </View>
                <View style={[s.badge, { backgroundColor: sc.bg, borderColor: sc.border }]}>
                  <Text style={[s.badgeTxt, { color: sc.color }]}>{sc.label}</Text>
                </View>
              </View>
            );
          })
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:          { flex: 1, backgroundColor: C.bg },

  /* Header */
  header:        { paddingHorizontal: 24, paddingTop: 56, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  headerTitle:   { color: C.text, fontSize: 26, fontWeight: '300', letterSpacing: 0.5, marginBottom: 4 },
  headerSub:     { color: C.dim, fontSize: 12, fontWeight: '300' },

  /* Tabs */
  tabs:          { flexDirection: 'row', margin: 16, backgroundColor: C.bg3, borderRadius: 12, padding: 4, borderWidth: 1, borderColor: C.border },
  tab:           { flex: 1, flexDirection: 'row', paddingVertical: 10, borderRadius: 9, alignItems: 'center', justifyContent: 'center', gap: 6 },
  tabOn:         { backgroundColor: C.bg2 },
  tabTxt:        { color: C.dim, fontSize: 13, fontWeight: '300' },
  tabTxtOn:      { color: C.text, fontWeight: '400' },
  tabBadge:      { backgroundColor: C.accent, borderRadius: 10, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  tabBadgeTxt:   { color: C.bg, fontSize: 10, fontWeight: '600' },

  /* Sections */
  sectionLabel:  { color: C.dimmer, fontSize: 10, letterSpacing: 5, paddingHorizontal: 20, marginBottom: 12 },

  /* Main card */
  mainCard:      { marginHorizontal: 16, backgroundColor: C.bg2, borderRadius: 20, borderWidth: 1, borderColor: C.borderAccent, overflow: 'hidden', marginBottom: 8 },
  mainPhoto:     { width: '100%', height: 160 },
  mainBody:      { padding: 18 },
  mainTopRow:    { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 4 },
  mainName:      { color: C.text, fontSize: 20, fontWeight: '300', letterSpacing: 0.5, flex: 1 },
  mainCuisine:   { color: C.dim, fontSize: 12, marginBottom: 14 },

  /* Countdown */
  countdownRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(200,151,90,0.07)', borderWidth: 1, borderColor: 'rgba(200,151,90,0.15)', borderRadius: 10, padding: 10, marginBottom: 14 },
  countdownIcon: { fontSize: 13 },
  countdownTxt:  { color: C.accent, fontSize: 12, fontWeight: '300', flex: 1 },

  /* Details */
  detailsGrid:   { flexDirection: 'row', gap: 8, marginBottom: 14 },
  detailBox:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: 10, padding: 10, alignItems: 'center' },
  detailLbl:     { color: C.dimmer, fontSize: 9, letterSpacing: 2, marginBottom: 4 },
  detailVal:     { color: C.text, fontSize: 14, fontWeight: '400' },

  /* Notes */
  notesBox:      { backgroundColor: C.bg3, borderRadius: 10, padding: 12, marginBottom: 14, borderWidth: 1, borderColor: C.border },
  notesLabel:    { color: C.dim, fontSize: 10, letterSpacing: 1, marginBottom: 4 },
  notesTxt:      { color: C.text, fontSize: 13, fontWeight: '300', lineHeight: 18 },

  /* Cancel */
  cancelBtn:     { borderWidth: 1, borderColor: 'rgba(224,90,90,0.3)', borderRadius: 12, paddingVertical: 11, alignItems: 'center', backgroundColor: 'rgba(224,90,90,0.06)' },
  cancelTxt:     { color: C.red, fontSize: 13, fontWeight: '400' },

  /* Badge */
  badge:         { borderWidth: 1, borderRadius: 100, paddingHorizontal: 10, paddingVertical: 4 },
  badgeTxt:      { fontSize: 10, fontWeight: '400', letterSpacing: 0.5 },

  /* Small card */
  smallCard:     { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 16, marginBottom: 10, backgroundColor: C.bg2, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: C.border },
  smallName:     { color: C.text, fontSize: 14, fontWeight: '300', marginBottom: 3 },
  smallMeta:     { color: C.dim, fontSize: 11, marginBottom: 2 },
  smallCountdown:{ color: C.accent, fontSize: 11 },
  smallCancel:   { color: C.red, fontSize: 11 },

  /* History */
  histCard:      { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: C.border },
  histName:      { color: C.text, fontSize: 14, fontWeight: '300', marginBottom: 3 },
  histMeta:      { color: C.dim, fontSize: 11, marginBottom: 2 },
  histNote:      { color: C.dimmer, fontSize: 10 },

  /* Empty */
  empty:         { alignItems: 'center', paddingTop: 80, gap: 10 },
  emptyEmoji:    { fontSize: 52 },
  emptyTitle:    { color: C.text, fontSize: 16, fontWeight: '300' },
  emptySub:      { color: C.dim, fontSize: 13, textAlign: 'center', lineHeight: 20, paddingHorizontal: 32 },
});
