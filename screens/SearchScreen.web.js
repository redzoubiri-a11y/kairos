import { useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, FlatList, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../src/theme';
import useSearch, { SUGGESTIONS } from '../src/hooks/useSearch';
import SearchResultCard from '../src/components/SearchResultCard';

export default function SearchScreen({ navigation, route }) {
  const { initialQuery = '', initialCity = 'alger' } = route?.params ?? {};

  const {
    inputRef,
    query, setQuery,
    quartier, setQuartier,
    results, loading, searched,
    clearQuery, searchSuggestion,
  } = useSearch({ initialQuery, initialCity });

  const goRestaurant = useCallback((r) => {
    navigation.navigate('Restaurant', { restaurant: r });
  }, [navigation]);

  return (
    <SafeAreaView style={s.root} edges={['top', 'left', 'right']}>

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backBtnTxt}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>RECHERCHE</Text>
        <View style={s.backBtn} />
      </View>

      {/* Inputs */}
      <View style={s.inputBlock}>
        <View style={s.inputRow}>
          <Ionicons name="search-outline" size={16} color={colors.textDim} />
          <TextInput
            ref={inputRef}
            style={s.input}
            placeholder="Nom du restaurant…"
            placeholderTextColor={colors.textDim}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            autoFocus
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={clearQuery} hitSlop={8}>
              <Ionicons name="close" size={16} color={colors.textDim} />
            </TouchableOpacity>
          )}
        </View>
        <View style={s.inputDivider} />
        <View style={s.inputRow}>
          <Ionicons name="location-outline" size={16} color={colors.textDim} />
          <TextInput
            style={s.input}
            placeholder="Quartier (optionnel)…"
            placeholderTextColor={colors.textDim}
            value={quartier}
            onChangeText={setQuartier}
            returnKeyType="search"
          />
          {quartier.length > 0 && (
            <TouchableOpacity onPress={() => setQuartier('')} hitSlop={8}>
              <Ionicons name="close" size={16} color={colors.textDim} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Suggestions */}
      {!query && !quartier && (
        <View style={s.suggestions}>
          {SUGGESTIONS.map(s2 => (
            <TouchableOpacity key={s2.q} style={s.chip} onPress={() => searchSuggestion(s2.q)}>
              <Text style={s.chipEmoji}>{s2.emoji}</Text>
              <Text style={s.chipTxt}>{s2.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Résultats */}
      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color={colors.text} size="large" />
          <Text style={s.centerTxt}>Recherche en cours…</Text>
        </View>
      ) : searched && results.length === 0 ? (
        <View style={s.center}>
          <Text style={s.emptyEmoji}>🍽️</Text>
          <Text style={s.emptyTitle}>Aucun résultat</Text>
          <Text style={s.emptySub}>Essayez un autre nom ou quartier</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={r => r.id}
          renderItem={({ item }) => (
            <SearchResultCard r={item} onPress={() => goRestaurant(item)} />
          )}
          contentContainerStyle={s.list}
          keyboardShouldPersistTaps="handled"
        />
      )}

    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:        { flex: 1, backgroundColor: colors.bg },

  header:      { height: 52, flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  headerTitle: { flex: 1, color: colors.text, fontSize: typography.size.heading2, fontWeight: typography.weight.bold, letterSpacing: 3, textAlign: 'center' },
  backBtn:     { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backBtnTxt:  { color: colors.text, fontSize: 22 },

  inputBlock:  { borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  inputRow:    { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.xl, height: 50 },
  inputDivider:{ height: 1, backgroundColor: colors.cardBorder, marginLeft: spacing.xl + 16 + spacing.md },
  input:       { flex: 1, color: colors.text, fontSize: typography.size.bodyLg, fontWeight: '300', padding: 0 },

  suggestions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, padding: spacing.xl },
  chip:        { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 20 },
  chipEmoji:   { fontSize: 16 },
  chipTxt:     { color: colors.textMuted, fontSize: typography.size.body },

  list:  { paddingBottom: 32 },

  center:     { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  centerTxt:  { color: colors.textMuted, fontSize: typography.size.body },
  emptyEmoji: { fontSize: 44 },
  emptyTitle: { color: colors.text, fontSize: typography.size.heading3, fontWeight: '300' },
  emptySub:   { color: colors.textMuted, fontSize: typography.size.body, textAlign: 'center' },
});
