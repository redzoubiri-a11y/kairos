import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, Platform, TextInput, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
let MapView, Marker;
if (Platform.OS !== 'web') {
  const maps = require('react-native-maps');
  MapView = maps.default;
  Marker  = maps.Marker;
}
import { colors, typography, spacing, radius, shadows } from '../src/theme';
import useExplorer, { getCoord } from '../src/hooks/useExplorer';
import RestaurantCard from '../src/components/RestaurantCard';
import Tag from '../src/components/Tag';
import EmptyState from '../src/components/EmptyState';

// Chips visibles mais non filtrantes : pas de donnée réelle en base
// (open_time/close_time/amenities NULL, pas de table promotions) — même
// convention que HomeScreen.
const FAKE_CHIPS = ['Ouvert', 'Terrasse', '€€', 'Note 4,5+'];

const SORT_OPTIONS = [
  { id: 'pertinence', label: 'Pertinence' },
  { id: 'note', label: 'Note' },
];

export default function ExplorerScreen({ navigation }) {
  const { restaurants, loading, query, setQuery, sortBy, setSortBy } = useExplorer();
  const [sortOpen, setSortOpen] = useState(false);

  const goMap = useCallback(() => navigation.navigate('Map'), [navigation]);
  const goRestaurant = useCallback(
    (r) => navigation.navigate('Restaurant', { restaurant: r }),
    [navigation],
  );
  const pickSort = useCallback((id) => { setSortBy(id); setSortOpen(false); }, [setSortBy]);

  const sortLabel = SORT_OPTIONS.find(o => o.id === sortBy)?.label ?? 'Trier';
  const count = restaurants.length;

  const renderItem = useCallback(({ item: r }) => (
    <View style={s.cardWrap}>
      <RestaurantCard r={r} variant="compact" onPress={() => goRestaurant(r)} />
    </View>
  ), [goRestaurant]);

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <FlatList
        data={restaurants}
        keyExtractor={(r) => String(r.id)}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        contentContainerStyle={s.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            <View style={s.header}>
              <Text style={s.title}>Explorer</Text>

              <View style={s.searchBar}>
                <Ionicons name="search-outline" size={14} color={colors.primary} />
                <TextInput
                  style={s.searchInput}
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Restaurant, cuisine, quartier…"
                  placeholderTextColor={colors.textPlaceholder}
                />
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={s.chipsRow}
              >
                <TouchableOpacity onPress={goMap}>
                  <Tag variant="filterActive" size="filter">Carte</Tag>
                </TouchableOpacity>
                {FAKE_CHIPS.map((label) => (
                  <Tag key={label} variant="filterInactive" size="filter">{label}</Tag>
                ))}
              </ScrollView>
            </View>

            <TouchableOpacity style={s.miniMap} activeOpacity={0.92} onPress={goMap}>
              {Platform.OS !== 'web' ? (
                <MapView
                  style={StyleSheet.absoluteFill}
                  initialRegion={{ latitude: 36.7538, longitude: 3.0588, latitudeDelta: 0.12, longitudeDelta: 0.12 }}
                  scrollEnabled={false}
                  zoomEnabled={false}
                  rotateEnabled={false}
                  pitchEnabled={false}
                  showsCompass={false}
                  toolbarEnabled={false}
                  pointerEvents="none"
                >
                  {restaurants.slice(0, 30).map((r) => (
                    <Marker key={String(r.id)} coordinate={getCoord(r)} tracksViewChanges={false}>
                      <View style={[s.pin, shadows.mapPin]} />
                    </Marker>
                  ))}
                </MapView>
              ) : (
                <View style={[StyleSheet.absoluteFill, s.miniMapWebFallback]}>
                  <Text style={s.miniMapWebTxt}>Carte disponible sur mobile</Text>
                </View>
              )}
              <View style={s.miniMapBadge}>
                <Text style={s.miniMapBadgeTxt}>{count} restaurant{count > 1 ? 's' : ''} ici</Text>
              </View>
              <View style={[s.locateBtn, shadows.mapControl]}>
                <Ionicons name="locate-outline" size={15} color={colors.text} />
              </View>
            </TouchableOpacity>

            <View style={s.resultsRow}>
              <Text style={s.resultsCount}>{count} résultat{count > 1 ? 's' : ''}</Text>
              <TouchableOpacity onPress={() => setSortOpen((o) => !o)}>
                <Text style={s.sortTxt}>{sortLabel} ▾</Text>
              </TouchableOpacity>
            </View>

            {sortOpen && (
              <View style={s.sortMenu}>
                {SORT_OPTIONS.map((o) => (
                  <TouchableOpacity key={o.id} style={s.sortItem} onPress={() => pickSort(o.id)}>
                    <Text style={[s.sortItemTxt, sortBy === o.id && s.sortItemTxtActive]}>{o.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        }
        ListEmptyComponent={
          loading ? (
            <View style={s.loading}>
              <ActivityIndicator color={colors.primary} size="large" />
            </View>
          ) : (
            <EmptyState
              icon={<Text style={{ fontSize: 20 }}>🔍</Text>}
              title="Aucun restaurant trouvé"
              subtitle="Essayez un autre nom, une autre cuisine ou un autre quartier."
              style={s.emptyState}
            />
          )
        }
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  listContent: { paddingBottom: 84 },

  header: { paddingTop: spacing.xl, paddingHorizontal: 20 },
  title: { fontFamily: typography.display, fontSize: typography.size.heading2 + 6, color: colors.text, letterSpacing: -0.44 },

  searchBar: {
    marginTop: 14, flexDirection: 'row', alignItems: 'center', gap: 9,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder,
    borderRadius: radius.lg, paddingVertical: spacing.lg, paddingHorizontal: spacing.lg + 1,
  },
  searchInput: { flex: 1, fontFamily: typography.body, fontSize: typography.size.bodyLg, color: colors.text, padding: 0 },

  chipsRow: { flexDirection: 'row', gap: 6, marginTop: spacing.lg, paddingRight: 20 },

  miniMap: {
    marginTop: 14, marginHorizontal: 20, height: 230,
    borderRadius: radius.xl, overflow: 'hidden', backgroundColor: colors.cardHover,
  },
  miniMapWebFallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cardHover, padding: spacing.xl },
  miniMapWebTxt: { fontFamily: typography.body, fontSize: typography.size.body, color: colors.textMuted, textAlign: 'center' },
  pin: {
    width: 30, height: 30, backgroundColor: colors.primary,
    borderTopLeftRadius: 15, borderTopRightRadius: 15, borderBottomRightRadius: 15, borderBottomLeftRadius: 0,
    transform: [{ rotate: '-45deg' }],
  },
  miniMapBadge: {
    position: 'absolute', top: 12, left: 12, backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.badgeSm,
  },
  miniMapBadgeTxt: { fontFamily: typography.bodySemibold, fontSize: typography.size.caption - 0.5, color: colors.text },
  locateBtn: {
    position: 'absolute', bottom: 12, right: 12, width: 34, height: 34,
    borderRadius: radius.control, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center',
  },

  resultsRow: {
    marginTop: 18, paddingHorizontal: 20, marginBottom: spacing.lg,
    flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between',
  },
  resultsCount: { fontFamily: typography.display, fontSize: typography.size.heading3, color: colors.text, letterSpacing: -0.15 },
  sortTxt: { fontFamily: typography.bodySemibold, fontSize: typography.size.caption + 0.5, color: colors.primary },

  sortMenu: {
    alignSelf: 'flex-end', marginRight: 20, marginTop: -spacing.sm, marginBottom: spacing.lg,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: radius.lg,
    paddingVertical: spacing.xs, ...shadows.sm,
  },
  sortItem: { paddingVertical: spacing.sm, paddingHorizontal: spacing.xl },
  sortItemTxt: { fontFamily: typography.body, fontSize: typography.size.bodyLg, color: colors.textMuted },
  sortItemTxtActive: { fontFamily: typography.bodySemibold, color: colors.primary },

  cardWrap: { paddingHorizontal: 20 },
  loading: { paddingVertical: spacing.section, alignItems: 'center', justifyContent: 'center' },
  emptyState: { marginHorizontal: 20 },
});
