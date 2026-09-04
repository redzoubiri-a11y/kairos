import { useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, ActivityIndicator, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, radius } from '../src/theme';
import useSearch, { SUGGESTIONS } from '../src/hooks/useSearch';
import HomeListRow from '../src/components/HomeListRow';

export default function SearchScreen({ navigation, route }) {
  const { initialQuery = '', initialCity = 'alger' } = route?.params ?? {};

  const {
    inputRef,
    query, setQuery,
    quartier, setQuartier,
    results, loading, searched,
    nearMe, locLoading, requestNearMe,
    searchSuggestion, clearQuery,
  } = useSearch({ initialQuery, initialCity });

  const goRestaurant = useCallback((r) => navigation.navigate('Restaurant', { id: r.id, restaurant: r }), [navigation]);

  return (
    <SafeAreaView style={s.root} edges={['top', 'left', 'right']}>
      <View style={s.header}>
        <TouchableOpacity style={s.iconBtn} onPress={() => navigation.goBack()}>
          <Text style={s.iconBtnTxt}>←</Text>
        </TouchableOpacity>
        <View style={s.searchBar}>
          <Text style={s.searchIcon}>🔍</Text>
          <TextInput
            ref={inputRef}
            style={s.searchInput}
            placeholder="Nom du restaurant…"
            placeholderTextColor={colors.textDim}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
          />
          {(query.length > 0 || quartier.length > 0) && (
            <TouchableOpacity onPress={clearQuery} hitSlop={8}>
              <Text style={s.clearTxt}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={s.quartierRow}>
        <Text style={s.quartierIcon}>📍</Text>
        <TextInput
          style={s.quartierInput}
          placeholder="Quartier (optionnel)…"
          placeholderTextColor={colors.textDim}
          value={quartier}
          onChangeText={setQuartier}
          returnKeyType="search"
        />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>
          {SUGGESTIONS.map(sug => (
            <TouchableOpacity key={sug.label} style={s.chip} onPress={() => searchSuggestion(sug.q)}>
              <Text style={s.chipTxt}>{sug.label} {sug.emoji}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={[s.chip, nearMe && s.chipOn]} onPress={requestNearMe} disabled={locLoading}>
            <Text style={[s.chipTxt, nearMe && s.chipTxtOn]}>{locLoading ? '···' : '📍 Près de moi'}</Text>
          </TouchableOpacity>
        </ScrollView>

        {loading ? (
          <ActivityIndicator style={{ marginTop: 60 }} color={colors.text} />
        ) : searched && results.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyEmoji}>🍽️</Text>
            <Text style={s.emptyTitle}>Aucun résultat</Text>
            <Text style={s.emptySub}>Essayez un autre nom ou quartier</Text>
          </View>
        ) : results.length > 0 ? (
          <>
            <Text style={s.sectionTitle}>{results.length} résultat{results.length > 1 ? 's' : ''}</Text>
            {results.map(r => (
              <HomeListRow key={r.id} r={r} onPress={() => goRestaurant(r)} />
            ))}
          </>
        ) : (
          <Text style={s.tipTxt}>Tapez un nom pour trouver un restaurant</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },

  header:      { flexDirection: 'row', alignItems: 'center', gap: spacing.md + 2, paddingHorizontal: spacing.xl, paddingTop: spacing.sm, paddingBottom: spacing.md },
  iconBtn:     { width: 36, height: 36, borderRadius: radius.control, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  iconBtnTxt:  { color: colors.text, fontSize: 15 },
  searchBar:   { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.noir, borderRadius: radius.control + 1, paddingHorizontal: spacing.lg, paddingVertical: spacing.md + 1 },
  searchIcon:  { fontSize: typography.size.body },
  searchInput: { flex: 1, fontFamily: typography.bodyBold, fontSize: typography.size.caption + 1.5, color: colors.text, padding: 0 },
  clearTxt:    { color: colors.textDim, fontSize: typography.size.bodyLg },

  quartierRow:   { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.xl + 46, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  quartierIcon:  { fontSize: typography.size.caption },
  quartierInput: { flex: 1, fontFamily: typography.body, fontSize: typography.size.caption + 0.5, color: colors.text, padding: 0 },

  scroll: { paddingHorizontal: spacing.xl, paddingBottom: 60 },

  chips:    { flexDirection: 'row', gap: spacing.sm, paddingTop: spacing.md, paddingBottom: spacing.xs },
  chip:     { paddingHorizontal: spacing.lg - 2, paddingVertical: spacing.sm + 1, borderRadius: radius.badgeSm, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder },
  chipOn:   { backgroundColor: colors.noir, borderColor: colors.noir },
  chipTxt:  { fontFamily: typography.bodyBold, fontSize: typography.size.caption + 0.5, color: colors.textMuted },
  chipTxtOn:{ color: colors.card },

  sectionTitle: { fontFamily: typography.bodyBold, fontSize: typography.size.body, color: colors.textDim, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: spacing.xl, marginBottom: spacing.md },

  empty:      { alignItems: 'center', paddingVertical: 64, gap: spacing.md },
  emptyEmoji: { fontSize: 44 },
  emptyTitle: { fontFamily: typography.display, color: colors.text, fontSize: typography.size.heading3 },
  emptySub:   { fontFamily: typography.body, color: colors.textMuted, fontSize: typography.size.body, textAlign: 'center' },

  tipTxt: { fontFamily: typography.body, color: colors.textDim, fontSize: typography.size.body, textAlign: 'center', marginTop: 48 },
});
