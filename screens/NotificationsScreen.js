import { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, ActivityIndicator,
} from 'react-native';
import { supabase } from '../supabase';

const C = {
  bg: '#0d1628', bg2: '#111827', bg3: '#1a2332',
  accent: '#c8975a', accent2: '#4a7fa5',
  text: '#f0ece4', dim: '#8a9ab0', dimmer: '#4a5568',
  green: '#3d9970', red: '#e05a5a', card: '#141e2e',
  border: 'rgba(255,255,255,0.07)',
};

const TYPE_CFG = {
  confirm:      { icon: '✅', color: '#3d9970' },
  cancellation: { icon: '❌', color: '#e05a5a' },
  reminder:     { icon: '⏰', color: '#c8975a' },
  review_ask:   { icon: '⭐', color: '#f0c040' },
  new_resa:     { icon: '📅', color: '#4a7fa5' },
};

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1)  return "à l'instant";
  if (m < 60) return `il y a ${m} min`;
  if (h < 24) return `il y a ${h}h`;
  if (d === 1) return 'hier';
  return `il y a ${d} jours`;
}

function grouped(notifs) {
  const today   = new Date(); today.setHours(0,0,0,0);
  const weekAgo = new Date(today.getTime() - 6 * 86400000);
  const out = [
    { label: "Aujourd'hui",  items: [] },
    { label: 'Cette semaine', items: [] },
    { label: 'Plus ancien',   items: [] },
  ];
  notifs.forEach(n => {
    const d = new Date(n.sent_at);
    if (d >= today)   out[0].items.push(n);
    else if (d >= weekAgo) out[1].items.push(n);
    else              out[2].items.push(n);
  });
  return out.filter(g => g.items.length > 0);
}

export default function NotificationsScreen({ navigation }) {
  const [notifs, setNotifs]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId]   = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const u = data?.user;
      if (!u) return;
      supabase.from('users').select('id').eq('auth_id', u.id).single()
        .then(({ data: row }) => { if (row) setUserId(row.id); });
    });
  }, []);

  useFocusEffect(useCallback(() => {
    if (!userId) return;
    setLoading(true);
    supabase
      .from('notifications')
      .select('*')
      .eq('recipient_id', userId)
      .eq('recipient_type', 'user')
      .order('sent_at', { ascending: false })
      .then(({ data }) => {
        setNotifs(data ?? []);
        setLoading(false);
      });
  }, [userId]));

  const markAllRead = async () => {
    if (!userId) return;
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('recipient_id', userId)
      .eq('recipient_type', 'user')
      .eq('is_read', false);
    setNotifs(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const unread = notifs.filter(n => !n.is_read).length;
  const groups = grouped(notifs);

  return (
    <SafeAreaView style={s.root}>

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backBtnTxt}>←</Text>
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.headerSub}>alertes & rappels</Text>
          <Text style={s.headerTitle}>Notifications</Text>
        </View>
        <TouchableOpacity onPress={markAllRead} disabled={unread === 0} style={s.markAllBtn}>
          <Text style={[s.markAllTxt, unread === 0 && s.markAllDim]}>Tout lire</Text>
        </TouchableOpacity>
      </View>

      {/* Badge résumé */}
      {unread > 0 && !loading && (
        <View style={s.summaryBar}>
          <View style={s.summaryDot} />
          <Text style={s.summaryTxt}>{unread} non lue{unread > 1 ? 's' : ''}</Text>
        </View>
      )}

      {loading ? (
        <View style={s.center}><ActivityIndicator color={C.accent} /></View>
      ) : notifs.length === 0 ? (
        <View style={s.center}>
          <Text style={s.emptyEmoji}>🔔</Text>
          <Text style={s.emptyTitle}>Aucune notification</Text>
          <Text style={s.emptySub}>
            {'Vous serez notifié ici de vos\nréservations et rappels'}
          </Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.list}>
          {groups.map(({ label, items }) => (
            <View key={label}>
              <Text style={s.groupLabel}>{label.toUpperCase()}</Text>
              {items.map(n => {
                const cfg = TYPE_CFG[n.type] || { icon: '🔔', color: C.dim };
                return (
                  <View key={n.id} style={[s.card, !n.is_read && s.cardUnread]}>
                    <View style={[s.iconWrap, { backgroundColor: cfg.color + '20' }]}>
                      <Text style={s.icon}>{cfg.icon}</Text>
                    </View>
                    <View style={s.cardContent}>
                      <Text style={[s.cardTitle, !n.is_read && s.cardTitleBold]}>{n.title}</Text>
                      <Text style={s.cardBody} numberOfLines={2}>{n.body}</Text>
                      <Text style={s.cardTime}>{timeAgo(n.sent_at)}</Text>
                    </View>
                    {!n.is_read && <View style={[s.dot, { backgroundColor: cfg.color }]} />}
                  </View>
                );
              })}
            </View>
          ))}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:          { flex: 1, backgroundColor: C.bg },
  header:        { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: C.border },
  backBtn:       { width: 36, height: 36, borderRadius: 18, backgroundColor: C.bg2, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  backBtnTxt:    { color: C.text, fontSize: 16 },
  headerCenter:  { flex: 1, alignItems: 'center' },
  headerSub:     { color: C.accent, fontSize: 10, fontStyle: 'italic', letterSpacing: 3, marginBottom: 2 },
  headerTitle:   { color: C.text, fontSize: 22, fontWeight: '300', letterSpacing: 1 },
  markAllBtn:    { width: 60, alignItems: 'flex-end' },
  markAllTxt:    { color: C.accent2, fontSize: 12 },
  markAllDim:    { color: C.dimmer },
  summaryBar:    { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: 'rgba(200,151,90,0.06)', borderBottomWidth: 1, borderBottomColor: C.border },
  summaryDot:    { width: 7, height: 7, borderRadius: 4, backgroundColor: C.accent },
  summaryTxt:    { color: C.accent, fontSize: 12, fontWeight: '300' },
  center:        { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyEmoji:    { fontSize: 52 },
  emptyTitle:    { color: C.text, fontSize: 20, fontWeight: '300', letterSpacing: 1 },
  emptySub:      { color: C.dim, fontSize: 13, textAlign: 'center', lineHeight: 20 },
  list:          { paddingTop: 4 },
  groupLabel:    { color: C.dimmer, fontSize: 9, letterSpacing: 3, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 },
  card:          { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  cardUnread:    { backgroundColor: 'rgba(200,151,90,0.04)' },
  iconWrap:      { width: 46, height: 46, borderRadius: 13, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  icon:          { fontSize: 22 },
  cardContent:   { flex: 1, gap: 3 },
  cardTitle:     { color: C.text, fontSize: 14, fontWeight: '300' },
  cardTitleBold: { fontWeight: '500' },
  cardBody:      { color: C.dim, fontSize: 12, lineHeight: 17 },
  cardTime:      { color: C.dimmer, fontSize: 11, marginTop: 2 },
  dot:           { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
});
