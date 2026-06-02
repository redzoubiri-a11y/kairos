import { useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  SafeAreaView, TextInput, Image, Keyboard, ScrollView,
} from 'react-native';
import { colors, typography, spacing, radius } from '../src/theme';
import MLoader from '../src/components/MLoader';
import SearchResultCard from '../src/components/SearchResultCard';
import useSearch, { CITIES, SUGGESTIONS } from '../src/hooks/useSearch';


function SkeletonResult() {
  return (
    <View style={s.skeletonCard}>
      <MLoader width={68} height={68} borderRadius={radius.lg} />
      <View style={{ flex: 1, gap: spacing.xs }}>
        <MLoader width="40%" height={10} borderRadius={radius.sm} />
        <MLoader width="75%" height={14} borderRadius={radius.sm} />
        <MLoader width="50%" height={10} borderRadius={radius.sm} />
      </View>
    </View>
  );
}

export default function SearchScreen({ navigation }) {
  const {
    inputRef,
    query, setQuery,
    city, setCity,
    results, loading, searched,
    nearMe, locLoading, requestNearMe,
    searchSuggestion, clearQuery,
  } = useSearch();

  const goBack = useCallback(() => navigation.goBack(), [navigation]);

  const renderCard = useCallback(({ item: r }) => (
    <SearchResultCard
      r={r}
      onPress={() => { Keyboard.dismiss(); navigation.navigate('Restaurant', { restaurant: r }); }}
    />
  ), [navigation]);

  return (
    <SafeAreaView style={s.root}>

      {/* ── Header ── */}
      <View style={s.header}>
        <TouchableOpacity onPress={goBack} style={s.backBtn}>
          <Text style={s.backBtnTxt}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>RECHERCHE</Text>
        <View style={{ width: 38 }} />
      </View>

      {/* ── Barre de recherche ── */}
      <View style={s.searchBar}>
        <View style={s.inputWrap}>
          <Text style={s.searchIcon}>🔍</Text>
          <TextInput
            ref={inputRef}
            style={s.input}
            placeholder="Restaurant, cuisine, quartier…"
            placeholderTextColor={colors.textDim}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            clearButtonMode="never"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={clearQuery} style={s.clearBtn}>
              <Text style={s.clearBtnTxt}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Filtres ville ── */}
      <Text style={s.quartierLabel}>PAR QUARTIER</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.cityRow}>
        <TouchableOpacity
          style={[s.cityChip, s.nearMeChip, nearMe && s.nearMeChipOn]}
          onPress={requestNearMe}
          disabled={locLoading}
        >
          <Text style={[s.cityTxt, nearMe && s.cityTxtOn]}>Près de moi</Text>
        </TouchableOpacity>
        {CITIES.map((c) => (
          <TouchableOpacity
            key={c.id}
            style={[s.cityChip, !nearMe && city === c.id && s.cityChipOn]}
            onPress={() => setCity(c.id)}
          >
            <Text style={[s.cityTxt, !nearMe && city === c.id && s.cityTxtOn]}>{c.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── Contenu ── */}
      {!query.trim() ? (
        <View style={s.suggestionsWrap}>
          <Text style={s.suggestTitle}>EXPLORER PAR CUISINE</Text>
          <View style={s.suggestGrid}>
            {SUGGESTIONS.map((sg) => (
              <TouchableOpacity
                key={sg.q}
                style={s.suggestCard}
                onPress={() => searchSuggestion(sg.q)}
              >
                <Text style={s.suggestEmoji}>{sg.emoji}</Text>
                <Text style={s.suggestLabel}>{sg.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : loading ? (
        <View style={s.skeletonList}>
          {[1, 2, 3, 4, 5].map((i) => <SkeletonResult key={i} />)}
        </View>
      ) : results.length === 0 && searched ? (
        <View style={s.center}>
          <Text style={s.emptyEmoji}>🍽️</Text>
          <Text style={s.emptyTitle}>Aucun résultat</Text>
          <Text style={s.emptySub}>Essayez un autre nom, quartier{'\n'}ou type de cuisine</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(r) => r.id}
          renderItem={renderCard}
          contentContainerStyle={s.list}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text style={s.resultCount}>{results.length} résultat{results.length > 1 ? 's' : ''}</Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },

  /* Header + Barre */
  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.xl, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  headerItalic: { color: colors.blue, fontSize: typography.size.caption, fontStyle: 'italic', letterSpacing: 1.5, marginBottom: 2 },
  headerTitle:  { color: colors.text, fontSize: typography.size.heading2, fontWeight: typography.weight.bold, letterSpacing: 2 },
  searchBar:    { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  backBtn:      { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, alignItems: 'center', justifyContent: 'center' },
  backBtnTxt:   { color: colors.text, fontSize: typography.size.body },
  inputWrap:    { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.cardBorder, paddingHorizontal: spacing.md, height: 44, gap: spacing.sm },
  searchIcon:   { fontSize: 15 },
  input:        { flex: 1, color: colors.text, fontSize: typography.size.body, fontWeight: typography.weight.light },
  clearBtn:     { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.cardHover, alignItems: 'center', justifyContent: 'center' },
  clearBtnTxt:  { color: colors.textDim, fontSize: typography.size.xs },

  /* Ville chips */
  quartierLabel: { color: colors.textMuted, fontSize: typography.size.xs, letterSpacing: 3, paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.xs },
  cityRow:       { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  cityChip:      { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.full, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder },
  cityChipOn:    { backgroundColor: colors.accent, borderColor: colors.accent },
  nearMeChip:    { flexDirection: 'row', alignItems: 'center', gap: 5, borderColor: 'rgba(90,155,224,0.4)', backgroundColor: colors.blueSoft },
  nearMeChipOn:  { backgroundColor: colors.blue, borderColor: colors.blue },
  nearMeEmoji:   { fontSize: 13 },
  cityTxt:       { color: colors.text, fontSize: typography.size.sm },
  cityTxtOn:     { color: colors.bg, fontWeight: typography.weight.semibold },

  /* Suggestions */
  suggestionsWrap: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.xl },
  suggestTitle:    { color: colors.textDim, fontSize: typography.size.xs, letterSpacing: 3, marginBottom: spacing.lg },
  suggestGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  suggestCard:     { width: '30%', backgroundColor: colors.card, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.cardBorder, alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.sm },
  suggestEmoji:    { fontSize: 28 },
  suggestLabel:    { color: colors.textMuted, fontSize: typography.size.xs, textAlign: 'center' },

  /* Skeleton */
  skeletonList: { flex: 1 },
  skeletonCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },

  /* État centre */
  center:     { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { color: colors.text, fontSize: typography.size.heading3, fontWeight: typography.weight.light },
  emptySub:   { color: colors.textMuted, fontSize: typography.size.sm, textAlign: 'center', lineHeight: 20 },

  /* Résultats */
  list:        { paddingBottom: spacing.xxxl },
  resultCount: { color: colors.textDim, fontSize: typography.size.xs, letterSpacing: 2, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
});
