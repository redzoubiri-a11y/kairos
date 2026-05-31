import { useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, TextInput, RefreshControl,
} from 'react-native';
import { colors, typography, spacing, radius } from '../src/theme';
import MLoader from '../src/components/MLoader';
import useFavoris, { CUISINE_EMOJI, SORT_OPTIONS, timeAdded } from '../src/hooks/useFavoris';
import FavCard, { CARD_W } from '../src/components/FavCard';
import MidaLogo from '../src/components/MidaLogo';

function SkeletonGrid() {
  return (
    <View style={{ paddingHorizontal: spacing.xxl, paddingTop: spacing.xl, gap: spacing.lg }}>
      {[1, 2, 3].map(i => (
        <View key={i} style={{ flexDirection: 'row', gap: spacing.lg }}>
          <MLoader width={CARD_W} height={200} borderRadius={radius.xxl} />
          <MLoader width={CARD_W} height={200} borderRadius={radius.xxl} />
        </View>
      ))}
    </View>
  );
}

export default function FavorisScreen({ navigation }) {
  const {
    favorites, loading, refreshing, removing,
    search, setSearch, sort,
    filtered, rows, avgRating, cuisineCount,
    removeFavorite, clearSearch, cycleSort, onRefresh,
  } = useFavoris();

  const goExplorer = useCallback(() => navigation.navigate('Explorer'), [navigation]);

  return (
    <SafeAreaView style={s.root}>

      <View style={s.header}>
        <View>
          <MidaLogo showTagline={false} style={{ alignItems: 'flex-start', marginBottom: spacing.xs }} />
          <Text style={s.headerSub}>MES PRÉFÉRÉS</Text>
        </View>
        {!loading && favorites.length > 0 && (
          <View style={s.countBadge}>
            <Text style={s.countTxt}>❤️  {favorites.length}</Text>
          </View>
        )}
      </View>

      {!loading && favorites.length > 0 && (
        <View style={s.controls}>
          <View style={s.searchBar}>
            <Text style={s.searchIcon}>🔍</Text>
            <TextInput
              style={s.searchInput}
              placeholder="Chercher dans mes favoris…"
              placeholderTextColor={colors.textDim}
              value={search}
              onChangeText={setSearch}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={clearSearch}>
                <Text style={{ color: colors.textDim, fontSize: typography.size.bodyLg }}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity style={s.sortBtn} onPress={cycleSort}>
            <Text style={s.sortTxt}>{SORT_OPTIONS.find(o => o.id === sort)?.label}</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <SkeletonGrid />
      ) : favorites.length === 0 ? (
        <View style={s.center}>
          <Text style={s.emptyEmoji}>🤍</Text>
          <Text style={s.emptyTitle}>Aucun favori</Text>
          <Text style={s.emptySub}>Appuyez sur ❤️ sur la page d'un restaurant{'\n'}pour l'ajouter ici.</Text>
          <TouchableOpacity style={s.exploreBtn} onPress={goExplorer}>
            <Text style={s.exploreBtnTxt}>EXPLORER LES RESTAURANTS</Text>
          </TouchableOpacity>
        </View>
      ) : filtered.length === 0 ? (
        <View style={s.center}>
          <Text style={{ fontSize: 36 }}>🔍</Text>
          <Text style={s.emptyTitle}>Aucun résultat</Text>
          <TouchableOpacity onPress={clearSearch}>
            <Text style={{ color: colors.blue, fontSize: typography.size.bodyLg }}>Effacer la recherche</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.grid}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        >
          <View style={s.statStrip}>
            <View style={s.statItem}>
              <Text style={s.statVal}>{favorites.length}</Text>
              <Text style={s.statLbl}>Favoris</Text>
            </View>
            <View style={s.statDiv} />
            <View style={s.statItem}>
              <Text style={s.statVal}>{avgRating}</Text>
              <Text style={s.statLbl}>Note moy.</Text>
            </View>
            <View style={s.statDiv} />
            <View style={s.statItem}>
              <Text style={s.statVal}>{cuisineCount}</Text>
              <Text style={s.statLbl}>Cuisines</Text>
            </View>
          </View>

          {rows.map((row, ri) => (
            <View key={ri} style={s.row}>
              {row.map((fav, ci) => fav ? (
                <FavCard
                  key={fav.id}
                  fav={fav}
                  index={ri * 2 + ci}
                  removing={removing.has(fav.id)}
                  onPress={() => navigation.navigate('Restaurant', { restaurant: fav.restaurants || {} })}
                  onReserve={() => navigation.navigate('ReservationForm', { restaurant: fav.restaurants || {} })}
                  onRemove={() => removeFavorite(fav)}
                />
              ) : (
                <View key="empty" style={{ width: CARD_W }} />
              ))}
            </View>
          ))}

          <View style={s.recentSection}>
            <Text style={s.recentLabel}>HISTORIQUE DES AJOUTS</Text>
            {[...favorites].slice(0, 5).map(fav => (
              <View key={fav.id} style={s.recentRow}>
                <Text style={s.recentEmoji}>{CUISINE_EMOJI[fav.restaurants?.cuisine_type] || '🍽️'}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={s.recentName} numberOfLines={1}>{fav.restaurants?.name || '—'}</Text>
                  <Text style={s.recentTime}>{timeAdded(fav.created_at)}</Text>
                </View>
                <TouchableOpacity onPress={() => navigation.navigate('Restaurant', { restaurant: fav.restaurants || {} })}>
                  <Text style={s.recentArrow}>›</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },

  header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.xxxl, paddingTop: 56, paddingBottom: spacing.xl, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  headerSub:   { color: colors.accent, fontSize: typography.size.xs, letterSpacing: 3, marginBottom: 2 },
  countBadge:  { backgroundColor: colors.accentSoft, borderRadius: radius.full, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderWidth: 1, borderColor: 'rgba(232,160,69,0.3)' },
  countTxt:    { color: colors.accent, fontSize: typography.size.bodyLg },

  controls:    { flexDirection: 'row', gap: spacing.md, paddingHorizontal: spacing.xxl, paddingVertical: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  searchBar:   { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.card, borderRadius: radius.lg, paddingHorizontal: spacing.lg, paddingVertical: spacing.md+1, borderWidth: 1, borderColor: colors.cardBorder },
  searchIcon:  { fontSize: 13 },
  searchInput: { flex: 1, color: colors.text, fontSize: typography.size.bodyLg },
  sortBtn:     { backgroundColor: colors.card, borderRadius: radius.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md+1, borderWidth: 1, borderColor: colors.cardBorder, justifyContent: 'center' },
  sortTxt:     { color: colors.accent, fontSize: typography.size.sm, fontWeight: typography.weight.medium },

  statStrip:   { flexDirection: 'row', backgroundColor: colors.card, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.cardBorder, marginHorizontal: spacing.xxl, marginBottom: spacing.xl },
  statItem:    { flex: 1, alignItems: 'center', paddingVertical: spacing.lg, gap: spacing.xxs },
  statVal:     { color: colors.text, fontSize: typography.size.heading1, fontWeight: typography.weight.regular },
  statLbl:     { color: colors.textDim, fontSize: typography.size.xs, letterSpacing: 1 },
  statDiv:     { width: 1, backgroundColor: colors.cardBorder, marginVertical: spacing.md },

  grid:        { paddingHorizontal: spacing.xxl, paddingTop: spacing.xl },
  row:         { flexDirection: 'row', gap: spacing.lg, marginBottom: spacing.lg },

  recentSection: { marginTop: spacing.md },
  recentLabel:   { color: colors.textDim, fontSize: typography.size.xs, letterSpacing: 4, marginBottom: spacing.lg },
  recentRow:     { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, paddingVertical: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  recentEmoji:   { fontSize: 22, width: 32, textAlign: 'center' },
  recentName:    { color: colors.text, fontSize: typography.size.subheading, fontWeight: typography.weight.regular, marginBottom: 2 },
  recentTime:    { color: colors.textDim, fontSize: typography.size.caption },
  recentArrow:   { color: colors.textDim, fontSize: 22, fontWeight: typography.weight.regular },

  center:       { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg, paddingHorizontal: 40 },
  emptyEmoji:   { fontSize: 56 },
  emptyTitle:   { color: colors.text, fontSize: typography.size.title, fontWeight: typography.weight.regular, letterSpacing: 0.5 },
  emptySub:     { color: colors.textMuted, fontSize: typography.size.bodyLg, textAlign: 'center', lineHeight: 20 },
  exploreBtn:   { backgroundColor: colors.accent, borderRadius: radius.xl, paddingVertical: 13, paddingHorizontal: spacing.xxxl, marginTop: spacing.md },
  exploreBtnTxt:{ color: colors.bg, fontSize: typography.size.body, fontWeight: typography.weight.medium, letterSpacing: 2 },
});
