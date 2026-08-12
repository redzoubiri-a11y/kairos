import { useCallback, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, Platform, StatusBar, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, radius } from '../src/theme';
import MLoader from '../src/components/MLoader';
import RestaurantCard from '../src/components/RestaurantCard';
import Tag from '../src/components/Tag';
import EmptyState from '../src/components/EmptyState';
import useHomeData, { FILTERS } from '../src/hooks/useHomeData';
import usePushNotifications from '../src/hooks/usePushNotifications';
import useDeepLink from '../src/hooks/useDeepLink';

function greetingWord() {
  return new Date().getHours() < 18 ? 'Bonjour' : 'Bonsoir';
}

function SkeletonCard() {
  return (
    <View style={[sk.card, { overflow: 'hidden' }]}>
      <MLoader width="100%" height={200} borderRadius={0} />
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

  const {
    loading,
    userName,
    unreadNotifs,
    quickFilter, setQuickFilter,
    list,
    fadeAnim, slideAnim,
  } = useHomeData();

  const [searchText, setSearchText] = useState('');

  const goNotifications = useCallback(() => navigation.navigate('Notifications'), [navigation]);
  const goExplorer      = useCallback(() => navigation.navigate('Explorer'), [navigation]);
  const goOrderSearch   = useCallback(() => navigation.navigate('Search', { initialCity: 'all' }), [navigation]);
  const resetFilter     = useCallback(() => setQuickFilter('all'), [setQuickFilter]);
  const submitSearch    = useCallback(() => {
    navigation.navigate('Search', { initialQuery: searchText.trim(), initialCity: 'all' });
    setSearchText('');
  }, [navigation, searchText]);

  const greeting = useMemo(
    () => greetingWord() + (userName ? ` ${userName}.` : ' !'),
    [userName],
  );

  const emptyMessage = quickFilter === 'promo'
    ? { title: 'Aucune promo active', sub: 'Revenez bientôt, les restaurateurs pourront bientôt publier leurs offres.' }
    : quickFilter === 'terrace'
      ? { title: 'Aucune terrasse trouvée', sub: 'Aucun restaurant ne renseigne encore cette info.' }
      : { title: 'Aucun restaurant', sub: 'Réessayez plus tard.' };

  return (
    <SafeAreaView style={s.root} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.noir} />

      {/* ── Zone header (couleur de marque) ── */}
      <View style={s.headerZone}>
        <View style={s.header}>
          <View style={{ flex: 1 }} />
          <TouchableOpacity style={s.iconBtn} onPress={goNotifications}>
            <Text style={s.iconBtnTxt}>🔔</Text>
            {unreadNotifs > 0 && (
              <View style={s.notifBadge}>
                <Text style={s.notifBadgeTxt}>{unreadNotifs > 9 ? '9+' : unreadNotifs}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <Text style={s.greeting}>
          {greeting}{'\n'}On mange où ce soir ?
        </Text>

        <View style={s.searchBar}>
          <Text style={s.searchIcon}>🔍</Text>
          <TextInput
            style={s.searchInput}
            placeholder="Restaurant, cuisine, quartier…"
            placeholderTextColor={colors.textMuted}
            value={searchText}
            onChangeText={setSearchText}
            returnKeyType="search"
            onSubmitEditing={submitSearch}
          />
        </View>
      </View>

      {/* ── Contenu scrollable ── */}
      <ScrollView showsVerticalScrollIndicator={false} style={s.scroll}>

        {/* Actions rapides */}
        <View style={s.quickActions}>
          <TouchableOpacity style={s.quickAction} onPress={goExplorer} activeOpacity={0.85}>
            <View style={[s.quickActionIcon, { backgroundColor: colors.resa }]}>
              <Text style={s.quickActionEmoji}>📅</Text>
            </View>
            <Text style={s.quickActionTxt}>Réserver{'\n'}une table</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.quickAction} onPress={goOrderSearch} activeOpacity={0.85}>
            <View style={[s.quickActionIcon, { backgroundColor: colors.primary }]}>
              <Text style={s.quickActionEmoji}>🛍️</Text>
            </View>
            <Text style={s.quickActionTxt}>Click &{'\n'}Collect</Text>
          </TouchableOpacity>
        </View>

        {/* Près de vous */}
        <View style={s.sectionHead}>
          <Text style={s.sectionLabel}>Près de vous</Text>
          <TouchableOpacity onPress={resetFilter}>
            <Text style={s.sectionRight}>Filtrer</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow} delayContentTouches={false}>
          {FILTERS.map(f => (
            <TouchableOpacity key={f.id} delayPressIn={0} onPress={() => setQuickFilter(f.id)}>
              <Tag size="filter" variant={quickFilter === f.id ? 'filterActive' : 'filterInactive'}>
                {f.label}
              </Tag>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {loading ? (
          <View style={{ marginTop: spacing.lg }}>
            {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
          </View>
        ) : list.length === 0 ? (
          <EmptyState
            style={s.emptyWrap}
            icon={<Text style={{ fontSize: 20 }}>🍽️</Text>}
            title={emptyMessage.title}
            subtitle={emptyMessage.sub}
            actionLabel={quickFilter !== 'all' ? 'Voir tout' : undefined}
            onAction={resetFilter}
          />
        ) : (
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], paddingHorizontal: spacing.xl, gap: spacing.md, marginTop: spacing.lg }}>
            {list.map((r, i) => (
              <RestaurantCard
                key={r.id} r={r} variant={i === 0 ? 'featured' : 'compact'}
                onPress={() => navigation.navigate('Restaurant', { restaurant: r })}
              />
            ))}
          </Animated.View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: colors.noir, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  scroll: { flex: 1, backgroundColor: colors.greyBg },

  /* Zone header */
  headerZone: { backgroundColor: colors.primary, paddingHorizontal: spacing.xl, paddingBottom: spacing.xl, borderBottomLeftRadius: radius.xxl, borderBottomRightRadius: radius.xxl },
  header:     { flexDirection: 'row', alignItems: 'center', paddingTop: spacing.sm },
  iconBtn:    { width: 38, height: 38, borderRadius: 11, backgroundColor: 'rgba(245,237,214,0.14)', alignItems: 'center', justifyContent: 'center' },
  iconBtnTxt: { fontSize: 17 },
  notifBadge: { position: 'absolute', top: -4, right: -4, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: colors.noir, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3, borderWidth: 1.5, borderColor: colors.primary },
  notifBadgeTxt: { fontFamily: typography.bodyBold, color: '#FFFFFF', fontSize: typography.size.xs },

  greeting: { fontFamily: typography.display, fontSize: 25, color: colors.cream, letterSpacing: -0.3, lineHeight: 30, marginTop: spacing.lg },

  searchBar:  { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: '#FFFFFF', borderRadius: 13, paddingHorizontal: 14, paddingVertical: 13, marginTop: spacing.lg },
  searchIcon: { fontSize: 14 },
  searchInput:{ flex: 1, fontFamily: typography.body, color: colors.text, fontSize: 13.5, letterSpacing: 0.3, padding: 0 },

  /* Actions rapides */
  quickActions:     { flexDirection: 'row', gap: spacing.sm + 2, paddingHorizontal: spacing.xl, paddingTop: spacing.xl },
  quickAction:      { flex: 1, backgroundColor: colors.cream, borderRadius: radius.xl - 2, padding: spacing.lg + 2 },
  quickActionIcon:  { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  quickActionEmoji: { fontSize: 15 },
  quickActionTxt:   { fontFamily: typography.display, fontSize: 13.5, color: colors.noir, marginTop: spacing.lg - 1, letterSpacing: -0.1, lineHeight: 17 },

  /* Section */
  sectionHead:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', paddingHorizontal: spacing.xl, marginTop: spacing.xxl - 2, marginBottom: spacing.sm },
  sectionLabel:  { color: colors.text, fontFamily: typography.display, fontSize: 17, letterSpacing: -0.3 },
  sectionRight:  { fontFamily: typography.bodySemibold, color: colors.primary, fontSize: typography.size.caption + 0.5 },

  /* Filtres */
  filterRow:   { paddingHorizontal: spacing.xl, gap: spacing.xs + 2, paddingBottom: spacing.xs },

  /* Empty */
  emptyWrap:   { marginHorizontal: spacing.xl, marginTop: spacing.lg },
});
