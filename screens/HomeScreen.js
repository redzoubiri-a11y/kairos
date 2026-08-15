import { useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, Platform, StatusBar, TextInput,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius } from '../src/theme';
import MLoader from '../src/components/MLoader';
import RestaurantListCard from '../src/components/RestaurantListCard';
import IntentToggle from '../src/components/IntentToggle';
import UsageFilters from '../src/components/UsageFilters';
import EmptyState from '../src/components/EmptyState';
import useHomeData from '../src/hooks/useHomeData';
import useHomeSearch from '../src/hooks/useHomeSearch';
import useMostViewed from '../src/hooks/useMostViewed';
import usePushNotifications from '../src/hooks/usePushNotifications';
import useDeepLink from '../src/hooks/useDeepLink';

function SkeletonCard() {
  return (
    <View style={[sk.card, { overflow: 'hidden' }]}>
      <MLoader width="100%" height={150} borderRadius={0} />
      <View style={{ padding: spacing.xl, gap: spacing.lg }}>
        <MLoader width="40%" height={9} borderRadius={4} />
        <MLoader width="75%" height={16} borderRadius={4} />
        <MLoader width="50%" height={10} borderRadius={4} />
      </View>
    </View>
  );
}
const sk = StyleSheet.create({
  card: { marginHorizontal: spacing.xl, marginBottom: spacing.xl - 4, backgroundColor: colors.card, borderRadius: radius.xxl, borderWidth: 1, borderColor: colors.cardBorder },
});

export default function HomeScreen({ navigation }) {
  usePushNotifications(navigation);
  useDeepLink(navigation);

  const { unreadNotifs, fadeAnim, slideAnim } = useHomeData();
  const {
    mode, setMode,
    query, setQuery,
    filters, toggleFilter,
    results, loading: searchLoading, searching,
  } = useHomeSearch();
  const { restaurants: mostViewed, loading: mostViewedLoading } = useMostViewed({ mode, filters });

  const insets = useSafeAreaInsets();
  const goNotifications = useCallback(() => navigation.navigate('Notifications'), [navigation]);
  const openRestaurant = useCallback(
    (r) => navigation.navigate('Restaurant', { restaurant: r }),
    [navigation],
  );

  const list = searching ? results : mostViewed;
  const loading = searching ? searchLoading : mostViewedLoading;
  const sectionTitle = searching ? 'Résultats' : 'Les plus consultés à Alger';
  const emptyMessage = searching
    ? { title: 'Aucun résultat', sub: 'Essayez un autre quartier ou une autre envie.' }
    : { title: 'Aucun restaurant', sub: 'Réessayez plus tard.' };

  return (
    <SafeAreaView style={s.root} edges={['left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />

      <View style={[s.topBar, { paddingTop: insets.top + spacing.lg }]}>
        <View style={{ flex: 1 }} />
        <TouchableOpacity style={s.iconBtn} onPress={goNotifications}>
          <Ionicons name="notifications-outline" size={19} color={colors.text} />
          {unreadNotifs > 0 && (
            <View style={s.notifBadge}>
              <Text style={s.notifBadgeTxt}>{unreadNotifs > 9 ? '9+' : unreadNotifs}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={s.scroll}>
        <View style={s.toggleWrap}>
          <IntentToggle mode={mode} onChange={setMode} />
        </View>

        <Text style={s.searchTitle}>Je cherche…</Text>
        <View style={s.searchBarWrap}>
          <View style={s.searchBar}>
            <Ionicons name="search" size={16} color={colors.textMuted} />
            <TextInput
              style={s.searchInput}
              placeholder="un resto, un quartier, une envie"
              placeholderTextColor={colors.textMuted}
              value={query}
              onChangeText={setQuery}
              returnKeyType="search"
            />
          </View>
        </View>

        <View style={s.filtersWrap}>
          <UsageFilters active={filters} onToggle={toggleFilter} />
        </View>

        <Text style={s.sectionTitle}>{sectionTitle}</Text>

        {loading ? (
          <View>
            {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
          </View>
        ) : list.length === 0 ? (
          <EmptyState
            style={s.emptyWrap}
            icon={<Text style={{ fontSize: 20 }}>🍽️</Text>}
            title={emptyMessage.title}
            subtitle={emptyMessage.sub}
          />
        ) : (
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], paddingHorizontal: spacing.xl, gap: spacing.md }}>
            {list.map(r => (
              <RestaurantListCard key={r.id} r={r} mode={mode} onPress={() => openRestaurant(r)} />
            ))}
          </Animated.View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: colors.bg, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  scroll: { flex: 1, backgroundColor: colors.greyBg },

  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xl, paddingBottom: spacing.sm },
  iconBtn:    { width: 38, height: 38, borderRadius: 11, backgroundColor: colors.tagNeutralBg, alignItems: 'center', justifyContent: 'center' },
  notifBadge: { position: 'absolute', top: -4, right: -4, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: colors.noir, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3, borderWidth: 1.5, borderColor: colors.bg },
  notifBadgeTxt: { fontFamily: typography.bodyBold, color: '#FFFFFF', fontSize: typography.size.xs },

  toggleWrap: { paddingHorizontal: spacing.xl, marginTop: spacing.sm },

  searchTitle: { fontFamily: typography.display, fontSize: typography.size.heading1, color: colors.textPrimary, letterSpacing: -0.3, marginTop: spacing.xxl, marginBottom: spacing.lg, marginHorizontal: spacing.xl },
  searchBarWrap: { paddingHorizontal: spacing.xl },
  searchBar:  { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.tagNeutralBg, borderRadius: 13, paddingHorizontal: 14, paddingVertical: 13 },
  searchInput:{ flex: 1, fontFamily: typography.bodyBold, color: colors.text, fontSize: 13.5, letterSpacing: 0.3, padding: 0 },

  filtersWrap: { marginTop: spacing.lg },

  sectionTitle: { fontFamily: typography.display, fontSize: typography.size.heading1, color: colors.textPrimary, letterSpacing: -0.3, marginTop: spacing.xxl, marginBottom: spacing.lg, marginHorizontal: spacing.xl },

  emptyWrap: { marginHorizontal: spacing.xl },
});
