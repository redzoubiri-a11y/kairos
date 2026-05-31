import { useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, RefreshControl,
} from 'react-native';
import { colors, typography, spacing, radius } from '../src/theme';
import MLoader from '../src/components/MLoader';
import useNotifications, { TYPE_CFG, TABS, timeAgo } from '../src/hooks/useNotifications';

function SkeletonList() {
  return (
    <View>
      {[1, 2, 3, 4, 5].map(i => (
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
  const {
    loading, refreshing, tab, setTab,
    filtered, unread, unreadResa, unreadRappel, groups,
    markRead, markAllRead, deleteNotif, onRefresh,
  } = useNotifications();

  const goBack    = useCallback(() => navigation.goBack(), [navigation]);
  const badgeFor  = (id) => {
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
                const cfg  = TYPE_CFG[n.type] || { icon: '🔔', color: colors.textMuted, group: 'autre' };
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
