import { useState, useEffect, useCallback, useMemo } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, RefreshControl, Alert,
} from 'react-native';
import { supabase } from '../supabase';
import { colors, typography, spacing, radius } from '../src/theme';
import MLoader from '../src/components/MLoader';

const TYPE_CFG = {
  confirm:      { icon: '✅', color: colors.green,  label: 'Confirmation', group: 'resa' },
  cancellation: { icon: '❌', color: colors.red,    label: 'Annulation',   group: 'resa' },
  new_resa:     { icon: '📅', color: colors.blue,   label: 'Réservation',  group: 'resa' },
  reminder:     { icon: '⏰', color: colors.accent, label: 'Rappel',       group: 'rappel' },
  review_ask:   { icon: '⭐', color: colors.accent,  label: 'Avis',         group: 'rappel' },
};

const TABS = [
  { id: 'all',    label: 'Tout' },
  { id: 'resa',   label: 'Réservations' },
  { id: 'rappel', label: 'Rappels' },
];

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1)   return "à l'instant";
  if (m < 60)  return `il y a ${m} min`;
  if (h < 24)  return `il y a ${h}h`;
  if (d === 1) return 'hier';
  if (d < 7)   return `il y a ${d} jours`;
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function grouped(notifs) {
  const today   = new Date(); today.setHours(0, 0, 0, 0);
  const weekAgo = new Date(today.getTime() - 6 * 86400000);
  const out = [
    { label: "Aujourd'hui",   items: [] },
    { label: 'Cette semaine', items: [] },
    { label: 'Plus ancien',   items: [] },
  ];
  notifs.forEach(n => {
    const d = new Date(n.sent_at);
    if (d >= today)        out[0].items.push(n);
    else if (d >= weekAgo) out[1].items.push(n);
    else                   out[2].items.push(n);
  });
  return out.filter(g => g.items.length > 0);
}

function SkeletonList() {
  return (
    <View>
      {[1,2,3,4,5].map(i => (
        <View key={i} style={{ flexDirection: 'row', gap: spacing.lg, paddingHorizontal: spacing.xxl, paddingVertical: spacing.lg }}>
          <MLoader width={46} height={46} borderRadius={radius.lg} />
          <View style={{ flex: 1, gap: spacing.sm }}>
            <MLoader width="40%" height={10} borderRadius={radius.sm} />
            <MLoader width="80%" height={14} borderRadius={radius.sm} />
            <MLoader width="55%" height={10} borderRadius={radius.sm} />
          </View>
        </View>
      ))}
    </View>
  );
}

export default function NotificationsScreen({ navigation }) {
  const [notifs,     setNotifs]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId,     setUserId]     = useState(null);
  const [tab,        setTab]        = useState('all');

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const u = data?.user;
      if (!u) return;
      const { data: row } = await supabase.from('users').select('id').eq('auth_id', u.id).single();
      if (row) setUserId(row.id);
    })();
  }, []);

  const load = useCallback(async (refresh = false) => {
    if (!userId) return;
    if (refresh) setRefreshing(true); else setLoading(true);
    try {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_id', userId)
        .eq('recipient_type', 'user')
        .order('sent_at', { ascending: false });
      setNotifs(data ?? []);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const markRead = useCallback(async (n) => {
    if (n.is_read) return;
    await supabase.from('notifications').update({ is_read: true }).eq('id', n.id);
    setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, is_read: true } : x));
  }, []);

  const markAllRead = useCallback(async () => {
    if (!userId) return;
    await supabase.from('notifications')
      .update({ is_read: true })
      .eq('recipient_id', userId)
      .eq('recipient_type', 'user')
      .eq('is_read', false);
    setNotifs(prev => prev.map(n => ({ ...n, is_read: true })));
  }, [userId]);

  const deleteNotif = useCallback((n) => {
    Alert.alert('Supprimer', 'Supprimer cette notification ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer', style: 'destructive',
        onPress: async () => {
          await supabase.from('notifications').delete().eq('id', n.id);
          setNotifs(prev => prev.filter(x => x.id !== n.id));
        },
      },
    ]);
  }, []);

  const filtered = useMemo(() => notifs.filter(n =>
    tab === 'all' || (TYPE_CFG[n.type]?.group || 'autre') === tab
  ), [notifs, tab]);

  const { unread, unreadResa, unreadRappel } = useMemo(() => {
    let unread = 0, unreadResa = 0, unreadRappel = 0;
    for (const n of notifs) {
      if (n.is_read) continue;
      unread++;
      const group = TYPE_CFG[n.type]?.group;
      if (group === 'resa')   unreadResa++;
      if (group === 'rappel') unreadRappel++;
    }
    return { unread, unreadResa, unreadRappel };
  }, [notifs]);

  const groups    = useMemo(() => grouped(filtered), [filtered]);
  const goBack    = useCallback(() => navigation.goBack(), [navigation]);
  const onRefresh = useCallback(() => load(true), [load]);

  const badgeFor = (id) => {
    if (id === 'all')    return unread;
    if (id === 'resa')   return unreadResa;
    if (id === 'rappel') return unreadRappel;
    return 0;
  };

  return (
    <SafeAreaView style={s.root}>

      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={goBack}>
          <Text style={s.backBtnTxt}>←</Text>
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.headerSub}>ALERTES & RAPPELS</Text>
          <Text style={s.headerTitle}>Notifications</Text>
        </View>
        <TouchableOpacity onPress={markAllRead} disabled={unread === 0} style={s.markAllBtn}>
          <Text style={[s.markAllTxt, unread === 0 && s.markAllDim]}>Tout lire</Text>
        </TouchableOpacity>
      </View>

      {unread > 0 && !loading && (
        <View style={s.summaryBar}>
          <View style={s.summaryDot} />
          <Text style={s.summaryTxt}>{unread} non lue{unread > 1 ? 's' : ''}</Text>
          <Text style={s.summaryHint}>  ·  Appuyez pour marquer comme lue</Text>
        </View>
      )}

      <View style={s.tabBar}>
        {TABS.map(t => {
          const badge = badgeFor(t.id);
          return (
            <TouchableOpacity key={t.id} style={[s.tabBtn, tab === t.id && s.tabBtnOn]} onPress={() => setTab(t.id)}>
              <Text style={[s.tabTxt, tab === t.id && s.tabTxtOn]}>{t.label}</Text>
              {badge > 0 && (
                <View style={s.tabBadge}><Text style={s.tabBadgeTxt}>{badge}</Text></View>
              )}
              {tab === t.id && <View style={s.tabLine} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <SkeletonList />
      ) : filtered.length === 0 ? (
        <View style={s.center}>
          <Text style={s.emptyEmoji}>
            {tab === 'resa' ? '📅' : tab === 'rappel' ? '⏰' : '🔔'}
          </Text>
          <Text style={s.emptyTitle}>
            {tab === 'all' ? 'Aucune notification' : `Aucune notification\n${TABS.find(t => t.id === tab)?.label.toLowerCase()}`}
          </Text>
          <Text style={s.emptySub}>Vous serez notifié ici de vos{'\n'}réservations et rappels.</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        >
          {groups.map(({ label, items }) => (
            <View key={label}>
              <Text style={s.groupLabel}>{label.toUpperCase()}</Text>
              {items.map(n => {
                const cfg = TYPE_CFG[n.type] || { icon: '🔔', color: colors.textMuted, group: 'autre' };
                const isResa = cfg.group === 'resa';
                return (
                  <TouchableOpacity
                    key={n.id}
                    style={[s.card, !n.is_read && s.cardUnread, { borderLeftColor: cfg.color }]}
                    onPress={() => markRead(n)}
                    onLongPress={() => deleteNotif(n)}
                    activeOpacity={0.75}
                  >
                    <View style={[s.iconWrap, { backgroundColor: cfg.color + '18', borderColor: cfg.color + '35' }]}>
                      <Text style={s.icon}>{cfg.icon}</Text>
                    </View>

                    <View style={s.cardContent}>
                      <View style={s.cardTopRow}>
                        <View style={[s.typeBadge, { backgroundColor: cfg.color + '15', borderColor: cfg.color + '30' }]}>
                          <Text style={[s.typeBadgeTxt, { color: cfg.color }]}>{cfg.label}</Text>
                        </View>
                        <Text style={s.cardTime}>{timeAgo(n.sent_at)}</Text>
                      </View>
                      <Text style={[s.cardTitle, !n.is_read && s.cardTitleBold]}>{n.title}</Text>
                      <Text style={s.cardBody}>{n.body}</Text>
                      {isResa && (
                        <TouchableOpacity
                          style={s.actionBtn}
                          onPress={() => { markRead(n); navigation.navigate('Main'); }}
                        >
                          <Text style={s.actionBtnTxt}>Voir mes réservations →</Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    {!n.is_read && <View style={[s.unreadDot, { backgroundColor: cfg.color }]} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
          <View style={{ height: 60 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },

  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xxl, paddingTop: spacing.xl, paddingBottom: spacing.xl, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  backBtn:      { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, alignItems: 'center', justifyContent: 'center' },
  backBtnTxt:   { color: colors.text, fontSize: typography.size.heading2 },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerSub:    { color: colors.accent, fontSize: typography.size.xs, letterSpacing: 3, marginBottom: 2 },
  headerTitle:  { color: colors.text, fontSize: typography.size.title, fontWeight: typography.weight.regular, letterSpacing: 1 },
  markAllBtn:   { width: 60, alignItems: 'flex-end' },
  markAllTxt:   { color: colors.blue, fontSize: typography.size.body },
  markAllDim:   { color: colors.textDim },

  summaryBar:   { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.xxl, paddingVertical: spacing.md+1, backgroundColor: 'rgba(232,160,69,0.06)', borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  summaryDot:   { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.accent },
  summaryTxt:   { color: colors.accent, fontSize: typography.size.body },
  summaryHint:  { color: colors.textDim, fontSize: typography.size.caption },

  tabBar:       { flexDirection: 'row', backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  tabBtn:       { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.lg, gap: spacing.sm, position: 'relative' },
  tabBtnOn:     {},
  tabTxt:       { color: colors.textMuted, fontSize: typography.size.body, fontWeight: typography.weight.regular },
  tabTxtOn:     { color: colors.text },
  tabBadge:     { backgroundColor: colors.accent, borderRadius: radius.md, minWidth: 16, height: 16, paddingHorizontal: spacing.xxs+1, alignItems: 'center', justifyContent: 'center' },
  tabBadgeTxt:  { color: colors.bg, fontSize: typography.size.xs, fontWeight: typography.weight.bold },
  tabLine:      { position: 'absolute', bottom: 0, left: '15%', right: '15%', height: 2, backgroundColor: colors.accent, borderRadius: 1 },

  groupLabel:   { color: colors.textDim, fontSize: typography.size.xs, letterSpacing: 4, paddingHorizontal: spacing.xxl, paddingTop: spacing.xxl, paddingBottom: spacing.md },

  card:         { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.lg, paddingHorizontal: spacing.xxl, paddingVertical: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.cardBorder, borderLeftWidth: 3, borderLeftColor: 'transparent' },
  cardUnread:   { backgroundColor: 'rgba(255,255,255,0.02)' },
  iconWrap:     { width: 46, height: 46, borderRadius: radius.xl, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 },
  icon:         { fontSize: 20 },
  cardContent:  { flex: 1, gap: spacing.xs },
  cardTopRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  typeBadge:    { borderRadius: radius.sm, borderWidth: 1, paddingHorizontal: spacing.sm+1, paddingVertical: spacing.xxs },
  typeBadgeTxt: { fontSize: typography.size.xs, fontWeight: typography.weight.medium, letterSpacing: 0.5 },
  cardTime:     { color: colors.textDim, fontSize: typography.size.sm },
  cardTitle:    { color: colors.text, fontSize: typography.size.subheading, fontWeight: typography.weight.regular, lineHeight: 20 },
  cardTitleBold:{ fontWeight: typography.weight.medium },
  cardBody:     { color: colors.textMuted, fontSize: typography.size.body, lineHeight: 18 },
  unreadDot:    { width: 8, height: 8, borderRadius: 4, flexShrink: 0, marginTop: spacing.sm },

  actionBtn:    { alignSelf: 'flex-start', marginTop: spacing.sm, paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, backgroundColor: colors.blueSoft, borderRadius: radius.md, borderWidth: 1, borderColor: 'rgba(90,155,224,0.25)' },
  actionBtnTxt: { color: colors.blue, fontSize: typography.size.caption },

  center:       { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg },
  emptyEmoji:   { fontSize: 52 },
  emptyTitle:   { color: colors.text, fontSize: typography.size.heading1, fontWeight: typography.weight.regular, textAlign: 'center', lineHeight: 26 },
  emptySub:     { color: colors.textMuted, fontSize: typography.size.bodyLg, textAlign: 'center', lineHeight: 20 },
});
