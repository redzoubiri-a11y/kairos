import { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, Platform, StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius } from '../src/theme';
import MLoader from '../src/components/MLoader';
import HomeListRow from '../src/components/HomeListRow';
import EmptyState from '../src/components/EmptyState';
import useHomeData from '../src/hooks/useHomeData';
import useHomeDiscovery from '../src/hooks/useHomeDiscovery';
import useMostViewed from '../src/hooks/useMostViewed';
import usePushNotifications from '../src/hooks/usePushNotifications';
import useDeepLink from '../src/hooks/useDeepLink';

// Onglets de zone — motif "Japan / Near me / Tokyo / Osaka" de l'app Tabelog,
// villes réelles reprises de useSearch.js (CITIES).
const AREA_TABS = [
  { id: 'alger',       label: 'Alger' },
  { id: 'near',        label: 'Près de moi' },
  { id: 'oran',        label: 'Oran' },
  { id: 'constantine', label: 'Constantine' },
  { id: 'tizi_ouzou',  label: 'Tizi Ouzou' },
];

function SkeletonTile() {
  return (
    <View style={{ flex: 1 }}>
      <MLoader width="100%" height={0} borderRadius={radius.md} style={{ aspectRatio: 1 }} />
      <MLoader width="70%" height={9} borderRadius={4} style={{ marginTop: 6, alignSelf: 'center' }} />
    </View>
  );
}
function SkeletonRow() {
  return (
    <View style={{ flexDirection: 'row', gap: spacing.lg, paddingVertical: spacing.lg - 1 }}>
      <MLoader width={74} height={74} borderRadius={radius.sm + 5} />
      <View style={{ flex: 1, gap: spacing.sm, justifyContent: 'center' }}>
        <MLoader width="60%" height={14} borderRadius={4} />
        <MLoader width="40%" height={10} borderRadius={4} />
      </View>
    </View>
  );
}

export default function HomeScreen({ navigation }) {
  usePushNotifications(navigation);
  useDeepLink(navigation);

  const { unreadNotifs, fadeAnim, slideAnim } = useHomeData();
  const [area, setArea] = useState('alger');
  const [sortTab, setSortTab] = useState('week'); // cosmétique pour l'instant, cf. résumé du lot
  const { topQuartiers, topCuisines, loading: discoveryLoading } = useHomeDiscovery(area);
  const { restaurants: mostViewed, loading: mostViewedLoading } = useMostViewed(area);

  const insets = useSafeAreaInsets();
  const areaLabel = AREA_TABS.find(a => a.id === area)?.label || 'Alger';

  const goNotifications = useCallback(() => navigation.navigate('Notifications'), [navigation]);
  const openRestaurant = useCallback(
    (r) => navigation.navigate('Restaurant', { restaurant: r }),
    [navigation],
  );
  const goExplorer = useCallback(
    (query) => navigation.navigate('Explorer', { initialQuery: query }),
    [navigation],
  );

  return (
    <SafeAreaView style={s.root} edges={['left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />

      <View style={[s.topbar, { paddingTop: insets.top + spacing.sm }]}>
        <Text style={s.wordmark}>MIDA</Text>
        <TouchableOpacity style={s.bell} onPress={goNotifications}>
          <Ionicons name="notifications-outline" size={16} color={colors.text} />
          {unreadNotifs > 0 && (
            <View style={s.notifBadge}>
              <Text style={s.notifBadgeTxt}>{unreadNotifs > 9 ? '9+' : unreadNotifs}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={s.scroll}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.areaTabs}>
          {AREA_TABS.map(a => (
            <TouchableOpacity key={a.id} onPress={() => setArea(a.id)}>
              <View style={[s.areaTab, area === a.id && s.areaTabOn]}>
                <Text style={[s.areaTabTxt, area === a.id && s.areaTabTxtOn]}>{a.label}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <TouchableOpacity style={s.quickSearchCard} onPress={() => navigation.navigate('QuickSearch')} activeOpacity={0.85}>
          <View style={{ flex: 1 }}>
            <Text style={s.quickSearchTitle}>Réserver ou commander</Text>
            <Text style={s.quickSearchSub}>Trouvez une table selon vos disponibilités</Text>
          </View>
          <Text style={s.quickSearchArrow}>›</Text>
        </TouchableOpacity>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Quartiers populaires</Text>
          {discoveryLoading ? (
            <View style={s.tileGrid}>
              {[1, 2, 3, 4].map(i => <SkeletonTile key={i} />)}
            </View>
          ) : topQuartiers.length === 0 ? null : (
            <View style={s.tileGrid}>
              {topQuartiers.map(t => (
                <TouchableOpacity key={t.id} style={s.tile} onPress={() => goExplorer(t.label)} activeOpacity={0.8}>
                  <View style={[s.tilePhoto, { backgroundColor: t.gradient[0] }]} />
                  <Text style={s.tileLbl} numberOfLines={1}>{t.label}</Text>
                  <Text style={s.tileCt}>{t.count}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Cuisines populaires</Text>
          {discoveryLoading ? (
            <View style={s.tileGrid}>
              {[1, 2, 3, 4].map(i => <SkeletonTile key={i} />)}
            </View>
          ) : topCuisines.length === 0 ? null : (
            <View style={s.tileGrid}>
              {topCuisines.map(t => (
                <TouchableOpacity key={t.id} style={s.tile} onPress={() => goExplorer(t.label)} activeOpacity={0.8}>
                  <View style={[s.tilePhoto, { backgroundColor: t.gradient[0] }]} />
                  <Text style={s.tileLbl} numberOfLines={1}>{t.label}</Text>
                  <Text style={s.tileCt}>{t.count}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Les plus consultés {areaLabel === 'Près de moi' ? '' : `à ${areaLabel}`}</Text>
          <View style={s.subTabs}>
            <TouchableOpacity onPress={() => setSortTab('week')}>
              <Text style={[s.subTab, sortTab === 'week' && s.subTabOn]}>Cette semaine</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setSortTab('near')}>
              <Text style={[s.subTab, sortTab === 'near' && s.subTabOn]}>Près de vous</Text>
            </TouchableOpacity>
          </View>

          {mostViewedLoading ? (
            <View>{[1, 2, 3].map(i => <SkeletonRow key={i} />)}</View>
          ) : mostViewed.length === 0 ? (
            <EmptyState
              icon={<Text style={{ fontSize: 20 }}>🍽️</Text>}
              title="Aucun restaurant"
              subtitle="Réessayez plus tard."
            />
          ) : (
            <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
              {mostViewed.map(r => (
                <HomeListRow key={r.id} r={r} onPress={() => openRestaurant(r)} />
              ))}
            </Animated.View>
          )}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: colors.bg, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  scroll: { flex: 1 },

  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingBottom: spacing.md },
  wordmark: { fontFamily: typography.display, fontSize: typography.size.heading1 - 2, color: colors.text },
  bell:    { width: 36, height: 36, borderRadius: radius.md + 2, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, alignItems: 'center', justifyContent: 'center' },
  notifBadge: { position: 'absolute', top: -4, right: -4, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: colors.noir, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3, borderWidth: 1.5, borderColor: colors.bg },
  notifBadgeTxt: { fontFamily: typography.bodyBold, color: '#FFFFFF', fontSize: typography.size.xs },

  areaTabs: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.xl },
  areaTab:  { paddingHorizontal: spacing.lg + 3, paddingVertical: spacing.sm + 1, borderRadius: radius.pill, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder },
  areaTabOn:{ backgroundColor: colors.primary, borderColor: colors.primary },
  areaTabTxt:  { fontFamily: typography.bodyBold, fontSize: typography.size.body, color: colors.textMuted },
  areaTabTxtOn:{ color: '#FFFFFF' },

  quickSearchCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginHorizontal: spacing.xl, marginTop: spacing.lg, backgroundColor: colors.noir, borderRadius: radius.lg + 1, paddingHorizontal: spacing.xl, paddingVertical: spacing.lg },
  quickSearchTitle: { fontFamily: typography.display, color: '#FFFFFF', fontSize: typography.size.body + 1 },
  quickSearchSub:   { fontFamily: typography.body, color: 'rgba(255,255,255,0.6)', fontSize: typography.size.caption, marginTop: 2 },
  quickSearchArrow: { color: 'rgba(255,255,255,0.6)', fontSize: 22 },

  section: { paddingHorizontal: spacing.xl, marginTop: spacing.xxl + 2 },
  sectionTitle: { fontFamily: typography.display, fontSize: typography.size.heading2 - 1, color: colors.text, marginBottom: spacing.lg - 2 },

  tileGrid: { flexDirection: 'row', gap: spacing.sm },
  tile:      { flex: 1 },
  tilePhoto: { aspectRatio: 1, borderRadius: radius.md + 2 },
  tileLbl:   { fontFamily: typography.bodyBold, fontSize: typography.size.caption - 0.5, color: colors.text, marginTop: spacing.sm - 2, textAlign: 'center' },
  tileCt:    { fontFamily: typography.body, fontSize: typography.size.xs, color: colors.textDim, textAlign: 'center' },

  subTabs: { flexDirection: 'row', gap: spacing.xl, borderBottomWidth: 1, borderBottomColor: colors.cardBorder, marginBottom: spacing.sm },
  subTab:   { fontFamily: typography.bodyBold, fontSize: typography.size.body, color: colors.textDim, paddingBottom: spacing.sm + 1 },
  subTabOn: { color: colors.text, borderBottomWidth: 2, borderBottomColor: colors.primary },
});
