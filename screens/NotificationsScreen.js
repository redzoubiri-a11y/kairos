import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
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
    loading, refreshing, tab, setTab, erreur, reessayer,
    filtered, unread, unreadResa, unreadRappel, unreadCommande, groups,
    markRead, markAllRead, deleteNotif, onRefresh,
  } = useNotifications();

  const badgeFor  = (id) => {
    if (id === 'all')      return unread;
    if (id === 'resa')     return unreadResa;
    if (id === 'rappel')   return unreadRappel;
    if (id === 'commande') return unreadCommande;
    return 0;
  };

  return (
    <SafeAreaView style={s.root} edges={['top', 'left', 'right']}>

      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backBtnTxt}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerSub}>ALERTES & RAPPELS</Text>
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
      ) : erreur ? (
        <View style={s.center}>
          <Text style={s.emptyEmoji}>{erreur === 'network' ? '📡' : '⚠️'}</Text>
          <Text style={s.emptyTitle}>{erreur === 'network' ? 'Pas de connexion' : 'Erreur serveur'}</Text>
          <Text style={s.emptySub}>
            {erreur === 'network' ? 'Vérifie ta connexion internet.' : "Une erreur inattendue s'est produite."}
          </Text>
          <TouchableOpacity onPress={reessayer} style={s.retryBtn}>
            <Text style={s.retryBtnTxt}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      ) : filtered.length === 0 ? (
        <View style={s.center}>
          <Text style={s.emptyEmoji}>
            {tab === 'resa' ? '📅' : tab === 'rappel' ? '⏰' : tab === 'commande' ? '🛍️' : '🔔'}
          </Text>
          <Text style={s.emptyTitle}>
            {tab === 'all' ? 'Aucune notification' : `Aucune notification\n${TABS.find(t => t.id === tab)?.label.toLowerCase()}`}
          </Text>
          <Text style={s.emptySub}>Vous serez notifié ici de vos{'\n'}réservations et rappels.</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
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
                    style={s.card}
                    onPress={() => markRead(n)}
                    onLongPress={() => deleteNotif(n)}
                    activeOpacity={0.75}
                  >
                    <View style={[s.iconWrap, { backgroundColor: cfg.bg || cfg.color + '18' }]}>
                      {cfg.iconLib === 'ionicons'
                        ? <Ionicons name={cfg.icon} size={17} color={cfg.color} />
                        : <Text style={s.icon}>{cfg.icon}</Text>
                      }
                    </View>
                    <View style={s.cardContent}>
                      <Text style={s.cardTitle}>{n.title}</Text>
                      <Text style={s.cardBody}>{n.body}</Text>
                      <View style={s.cardTimeRow}>
                        <Text style={s.cardTime}>{timeAgo(n.sent_at)}</Text>
                        {!n.is_read && <View style={[s.unreadDot, { backgroundColor: cfg.color }]} />}
                      </View>
                      {isResa && (
                        <TouchableOpacity
                          style={s.actionBtn}
                          onPress={() => { markRead(n); try { navigation.navigate('Main', { screen: 'Resa' }); } catch (_) { navigation.navigate('Main'); } }}
                        >
                          <Text style={s.actionBtnTxt}>Voir mes réservations →</Text>
                        </TouchableOpacity>
                      )}
                    </View>
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

  header:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xxl, paddingTop: spacing.xl, paddingBottom: spacing.xl, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  backBtn:      { width: 60, alignItems: 'flex-start' },
  backBtnTxt:   { color: colors.text, fontSize: 22 },
  headerSub:    { flex: 1, fontFamily: typography.bodyBold, color: colors.primary, fontSize: typography.size.xs, letterSpacing: 3, textAlign: 'center' },
  markAllBtn:   { width: 60, alignItems: 'flex-end' },
  markAllTxt:   { fontFamily: typography.bodyMedium, color: colors.blue, fontSize: typography.size.body },
  markAllDim:   { color: colors.textDim },

  summaryBar:   { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.xxl, paddingVertical: spacing.md+1, backgroundColor: colors.primaryDim, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  summaryDot:   { width: 7, height: 7, borderRadius: 3.5, backgroundColor: colors.primary },
  summaryTxt:   { fontFamily: typography.bodyMedium, color: colors.primary, fontSize: typography.size.body },
  summaryHint:  { fontFamily: typography.body, color: colors.textDim, fontSize: typography.size.caption },

  tabBar:       { flexDirection: 'row', backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  tabBtn:       { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.lg, gap: spacing.sm, position: 'relative' },
  tabBtnOn:     { backgroundColor: colors.primaryDim },
  tabTxt:       { fontFamily: typography.body, color: colors.textMuted, fontSize: typography.size.body },
  tabTxtOn:     { fontFamily: typography.bodySemibold, color: colors.primary },
  tabBadge:     { backgroundColor: colors.primary, borderRadius: radius.md, minWidth: 16, height: 16, paddingHorizontal: spacing.xxs+1, alignItems: 'center', justifyContent: 'center' },
  tabBadgeTxt:  { color: colors.card, fontSize: typography.size.xs, fontWeight: typography.weight.bold },
  tabLine:      { position: 'absolute', bottom: 0, left: '15%', right: '15%', height: 2, backgroundColor: colors.primary, borderRadius: 1 },

  groupLabel:   { fontFamily: typography.bodySemibold, color: colors.textFaint, fontSize: typography.size.caption - 0.5, letterSpacing: 0.84, textTransform: 'uppercase', paddingHorizontal: spacing.xxl, paddingTop: spacing.xxl, paddingBottom: spacing.md },

  card:         { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.lg, paddingHorizontal: spacing.xxl, paddingVertical: spacing.lg + 1, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  iconWrap:     { width: 38, height: 38, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  icon:         { fontSize: typography.size.heading3 },
  cardContent:  { flex: 1 },
  cardTitle:    { fontFamily: typography.bodySemibold, color: colors.text, fontSize: typography.size.bodyLg + 0.5, lineHeight: 17.5 },
  cardBody:     { fontFamily: typography.body, color: colors.textMuted, fontSize: typography.size.bodyLg - 0.5, lineHeight: 18, marginTop: 3 },
  cardTimeRow:  { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 6 },
  cardTime:     { fontFamily: typography.body, color: colors.accentDim, fontSize: typography.size.caption },
  unreadDot:    { width: 6, height: 6, borderRadius: 3, flexShrink: 0 },

  actionBtn:    { alignSelf: 'flex-start', marginTop: spacing.sm, paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, backgroundColor: colors.blueSoft, borderRadius: radius.md, borderWidth: 1, borderColor: 'rgba(90,155,224,0.25)' },
  actionBtnTxt: { color: colors.blue, fontSize: typography.size.caption },

  center:       { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg },
  emptyEmoji:   { fontSize: 52 },
  emptyTitle:   { fontFamily: typography.display, color: colors.text, fontSize: typography.size.heading1, textAlign: 'center', lineHeight: 26 },
  emptySub:     { fontFamily: typography.body, color: colors.textMuted, fontSize: typography.size.bodyLg, textAlign: 'center', lineHeight: 20 },
  retryBtn:     { marginTop: spacing.xl, paddingVertical: spacing.md, paddingHorizontal: spacing.xxl, borderRadius: radius.md, borderWidth: 1, borderColor: colors.cardBorder },
  retryBtnTxt:  { fontFamily: typography.bodyMedium, color: colors.primary, fontSize: typography.size.body },
});
