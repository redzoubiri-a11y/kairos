import { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, Platform, StatusBar, TextInput,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius } from '../src/theme';
import MLoader from '../src/components/MLoader';
import RestaurantCard from '../src/components/RestaurantCard';
import Tag from '../src/components/Tag';
import EmptyState from '../src/components/EmptyState';
import useHomeData, { FILTERS } from '../src/hooks/useHomeData';
import usePushNotifications from '../src/hooks/usePushNotifications';
import useDeepLink from '../src/hooks/useDeepLink';

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

// Ligne de villes — navigue vers Explorer (carte), pré-rempli avec le nom de la ville
const CITY_ROW = [
  { id: 'alger',       label: 'Alger' },
  { id: 'oran',        label: 'Oran' },
  { id: 'blida',       label: 'Blida' },
  { id: 'tipaza',      label: 'Tipaza' },
  { id: 'constantine', label: 'Constantine' },
  { id: 'tizi_ouzou',  label: 'Tizi Ouzou' },
  { id: 'bejaia',      label: 'Béjaïa' },
  { id: 'setif',       label: 'Sétif' },
];

export default function HomeScreen({ navigation }) {
  usePushNotifications(navigation);
  useDeepLink(navigation);

  const {
    loading,
    unreadNotifs,
    quickFilter, setQuickFilter,
    list,
    fadeAnim, slideAnim,
  } = useHomeData();

  const [searchText, setSearchText] = useState('');
  const [headerH, setHeaderH] = useState(0);
  const insets = useSafeAreaInsets();

  const goNotifications = useCallback(() => navigation.navigate('Notifications'), [navigation]);
  const goExplorer      = useCallback(() => navigation.navigate('Explorer'), [navigation]);
  const goOrderSearch   = useCallback(() => navigation.navigate('Search', { initialCity: 'all' }), [navigation]);
  const goNearMe        = useCallback(() => navigation.navigate('Explorer'), [navigation]);
  const goCity          = useCallback((label) => navigation.navigate('Explorer', { initialQuery: label }), [navigation]);
  const resetFilter     = useCallback(() => setQuickFilter('all'), [setQuickFilter]);
  const submitSearch    = useCallback(() => {
    navigation.navigate('Search', { initialQuery: searchText.trim(), initialCity: 'all' });
    setSearchText('');
  }, [navigation, searchText]);

  const emptyMessage = quickFilter === 'promo'
    ? { title: 'Aucune promo active', sub: 'Revenez bientôt, les restaurateurs pourront bientôt publier leurs offres.' }
    : quickFilter === 'terrace'
      ? { title: 'Aucune terrasse trouvée', sub: 'Aucun restaurant ne renseigne encore cette info.' }
      : { title: 'Aucun restaurant', sub: 'Réessayez plus tard.' };

  return (
    <SafeAreaView style={s.root} edges={['left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />

      {/* ── Zone header — flotte en transparence au-dessus du contenu scrollable ── */}
      <View
        style={[s.headerZone, { paddingTop: insets.top + spacing.section }]}
        onLayout={(e) => setHeaderH(e.nativeEvent.layout.height)}
      >
        <View style={s.header}>
          <View style={s.searchBar}>
            <Ionicons name="search" size={16} color={colors.textMuted} />
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

          <TouchableOpacity style={s.iconBtn} onPress={goNotifications}>
            <Ionicons name="notifications-outline" size={19} color={colors.text} />
            {unreadNotifs > 0 && (
              <View style={s.notifBadge}>
                <Text style={s.notifBadgeTxt}>{unreadNotifs > 9 ? '9+' : unreadNotifs}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Contenu scrollable ── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={s.scroll}
        contentContainerStyle={{ paddingTop: headerH }}
      >

        {/* Actions rapides */}
        <View style={s.quickActions}>
          <TouchableOpacity style={s.quickActionPrimary} onPress={goExplorer} activeOpacity={0.88}>
            <Ionicons name="calendar-outline" size={16} color={colors.noir} />
            <Text style={s.quickActionPrimaryTxt} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>Réserver une table</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.quickActionSecondary} onPress={goOrderSearch} activeOpacity={0.88}>
            <Ionicons name="bag-handle-outline" size={16} color={colors.noir} />
            <Text style={s.quickActionSecondaryTxt} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>Click & Collect</Text>
          </TouchableOpacity>
        </View>

        {/* Villes */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.cityRow}>
          <TouchableOpacity onPress={goNearMe}>
            <Tag size="filter" variant="filterInactive" style={s.glassChip}>Près de moi</Tag>
          </TouchableOpacity>
          {CITY_ROW.map(c => (
            <TouchableOpacity key={c.id} onPress={() => goCity(c.label)}>
              <Tag size="filter" variant="filterInactive" style={s.glassChip}>{c.label}</Tag>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow} delayContentTouches={false}>
          {FILTERS.map(f => (
            <TouchableOpacity key={f.id} delayPressIn={0} onPress={() => setQuickFilter(f.id)}>
              <Tag
                size="filter"
                variant={quickFilter === f.id ? 'filterActive' : 'filterInactive'}
                style={s.glassChipGreen}
                textStyle={quickFilter === f.id ? { color: colors.noir } : undefined}
              >
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
                promo={r.promoLabel}
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
  root:   { flex: 1, backgroundColor: colors.bg, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  scroll: { flex: 1, backgroundColor: colors.greyBg },

  /* Zone header — overlay transparent, jusqu'au bord de l'écran */
  headerZone: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, backgroundColor: 'transparent', paddingHorizontal: spacing.xl, paddingBottom: spacing.sm },
  header:     { flexDirection: 'row', alignItems: 'center', gap: spacing.sm + 2 },
  iconBtn:    { width: 38, height: 38, borderRadius: 11, backgroundColor: colors.tagNeutralBg, alignItems: 'center', justifyContent: 'center' },
  notifBadge: { position: 'absolute', top: -4, right: -4, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: colors.noir, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3, borderWidth: 1.5, borderColor: colors.bg },
  notifBadgeTxt: { fontFamily: typography.bodyBold, color: '#FFFFFF', fontSize: typography.size.xs },

  // Verre blanc, cadre vert — même ligne que le clochet
  searchBar:  { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.glassBg, borderRadius: 13, borderWidth: 1.5, borderColor: colors.primary, paddingHorizontal: 14, paddingVertical: 13 },
  searchInput:{ flex: 1, fontFamily: typography.body, color: colors.text, fontSize: 13.5, letterSpacing: 0.3, padding: 0 },

  /* Villes — scroll jusqu'aux bords de l'écran, sans marge gauche/droite */
  cityRow: { flexDirection: 'row', gap: spacing.xs + 2, paddingTop: spacing.lg },
  glassChip: { backgroundColor: colors.glassBg, borderWidth: 0 },
  // Chips Tout/Ouvert/Terrasse/Promo — même cadre vert que la recherche
  glassChipGreen: { backgroundColor: colors.glassBg, borderWidth: 1.5, borderColor: colors.primary },

  /* Actions rapides — cadre rectangle sans couleur (noir), pas de vert */
  quickActions:  { flexDirection: 'row', gap: spacing.sm + 2, paddingHorizontal: spacing.xl, paddingTop: spacing.sm },
  quickActionPrimary:   { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs + 2, borderRadius: radius.sm, paddingVertical: spacing.md, backgroundColor: colors.glassBg },
  quickActionPrimaryTxt:{ fontFamily: typography.bodySemibold, fontSize: 13.5, letterSpacing: -0.1, color: colors.noir },
  quickActionSecondary: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs + 2, borderRadius: radius.sm, paddingVertical: spacing.md, backgroundColor: colors.glassBg },
  quickActionSecondaryTxt:{ fontFamily: typography.bodySemibold, fontSize: 13.5, letterSpacing: -0.1, color: colors.noir },

  /* Filtres */
  filterRow:   { paddingHorizontal: spacing.xl, gap: spacing.xs + 2, paddingTop: spacing.xl, paddingBottom: spacing.xs },

  /* Empty */
  emptyWrap:   { marginHorizontal: spacing.xl, marginTop: spacing.lg },
});
