import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  SafeAreaView, TextInput, Image, Keyboard, ScrollView,
} from 'react-native';
import { supabase } from '../supabase';
import { colors, typography, spacing, radius } from '../src/theme';
import MLoader from '../src/components/MLoader';

const CITIES = [
  { id: 'all',         label: 'Toutes' },
  { id: 'alger',       label: 'Alger' },
  { id: 'oran',        label: 'Oran' },
  { id: 'constantine', label: 'Constantine' },
  { id: 'tizi_ouzou',  label: 'Tizi Ouzou' },
  { id: 'bejaia',      label: 'Béjaïa' },
  { id: 'setif',       label: 'Sétif' },
  { id: 'annaba',      label: 'Annaba' },
  { id: 'tlemcen',     label: 'Tlemcen' },
];

const SUGGESTIONS = [
  { label: 'Couscous',      q: 'algerien',      emoji: '🥘' },
  { label: 'Pizzeria',      q: 'italien',       emoji: '🍕' },
  { label: 'Fruits de mer', q: 'mediterraneen', emoji: '🐟' },
  { label: 'Japonais',      q: 'japonais',      emoji: '🍣' },
  { label: 'Turc',          q: 'turc',          emoji: '🍢' },
  { label: 'Libanais',      q: 'libanais',      emoji: '🌿' },
];

const CUISINE_EMOJI = {
  algerien:'🥘', mediterraneen:'🐟', fast_casual:'☕',
  italien:'🍕', japonais:'🍣', turc:'🍢', libanais:'🌿', francais:'🍷', autre:'🍽️',
};

function SkeletonResult() {
  return (
    <View style={s.card}>
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
  const inputRef = useRef(null);
  const [query,      setQuery]      = useState('');
  const [city,       setCity]       = useState('all');
  const [results,    setResults]    = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [searched,   setSearched]   = useState(false);

  // Auto-focus à l'ouverture
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 150);
    return () => clearTimeout(t);
  }, []);

  // Recherche debouncée
  useEffect(() => {
    const q = query.trim();
    if (!q) { setResults([]); setSearched(false); return; }

    const timer = setTimeout(async () => {
      setLoading(true);
      setSearched(true);
      try {
        let req = supabase
          .from('restaurants')
          .select('id, name, cuisine_type, quartier, city, avg_rating, avg_ticket, photos')
          .eq('status', 'active')
          .or(`name.ilike.%${q}%,cuisine_type.ilike.%${q}%,quartier.ilike.%${q}%`)
          .limit(25);

        if (city !== 'all') req = req.eq('city', city);

        const { data } = await req;
        setResults(data ?? []);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, city]);

  const searchSuggestion = useCallback((q) => {
    setQuery(q);
    Keyboard.dismiss();
  }, []);

  const clearQuery = useCallback(() => {
    setQuery('');
    setResults([]);
    setSearched(false);
    inputRef.current?.focus();
  }, []);

  const goBack = useCallback(() => navigation.goBack(), [navigation]);

  const renderCard = useCallback(({ item: r }) => {
    const photo = r.photos?.[0];
    return (
      <TouchableOpacity
        style={s.card}
        onPress={() => { Keyboard.dismiss(); navigation.navigate('Restaurant', { restaurant: r }); }}
        activeOpacity={0.85}
      >
        <View style={s.cardThumb}>
          {photo
            ? <Image source={{ uri: photo }} style={s.cardPhoto} resizeMode="cover" />
            : <Text style={s.cardEmoji}>{CUISINE_EMOJI[r.cuisine_type] || '🍽️'}</Text>
          }
        </View>
        <View style={s.cardInfo}>
          <Text style={s.cardCuisine}>
            {r.cuisine_type?.toUpperCase()}
            {r.quartier ? '  ·  ' + r.quartier : ''}
            {r.city ? '  ·  ' + r.city.charAt(0).toUpperCase() + r.city.slice(1) : ''}
          </Text>
          <Text style={s.cardName} numberOfLines={1}>{r.name}</Text>
          <View style={s.cardMeta}>
            <Text style={s.cardRating}>⭐ {r.avg_rating > 0 ? Number(r.avg_rating).toFixed(1) : '—'}</Text>
            <Text style={s.cardSep}>·</Text>
            <Text style={s.cardPrice}>{r.avg_ticket > 0 ? r.avg_ticket.toLocaleString('fr-FR') + ' DA' : '—'}</Text>
          </View>
        </View>
        <Text style={s.cardArrow}>›</Text>
      </TouchableOpacity>
    );
  }, [navigation]);

  return (
    <SafeAreaView style={s.root}>

      {/* ── Barre de recherche ── */}
      <View style={s.searchBar}>
        <TouchableOpacity onPress={goBack} style={s.backBtn}>
          <Text style={s.backBtnTxt}>←</Text>
        </TouchableOpacity>
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
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.cityRow}>
        {CITIES.map((c) => (
          <TouchableOpacity
            key={c.id}
            style={[s.cityChip, city === c.id && s.cityChipOn]}
            onPress={() => setCity(c.id)}
          >
            <Text style={[s.cityTxt, city === c.id && s.cityTxtOn]}>{c.label}</Text>
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
          {[1,2,3,4,5].map((i) => <SkeletonResult key={i} />)}
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

  /* Barre */
  searchBar:  { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  backBtn:    { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, alignItems: 'center', justifyContent: 'center' },
  backBtnTxt: { color: colors.text, fontSize: typography.size.body },
  inputWrap:  { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.cardBorder, paddingHorizontal: spacing.md, height: 44, gap: spacing.sm },
  searchIcon: { fontSize: 15 },
  input:      { flex: 1, color: colors.text, fontSize: typography.size.body, fontWeight: typography.weight.light },
  clearBtn:   { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.cardHover, alignItems: 'center', justifyContent: 'center' },
  clearBtnTxt:{ color: colors.textDim, fontSize: typography.size.xs },

  /* Ville chips */
  cityRow:    { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  cityChip:   { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.full, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder },
  cityChipOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  cityTxt:    { color: colors.text, fontSize: typography.size.sm },
  cityTxtOn:  { color: colors.bg, fontWeight: typography.weight.semibold },

  /* Suggestions */
  suggestionsWrap: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.xl },
  suggestTitle:    { color: colors.textDim, fontSize: typography.size.xxs, letterSpacing: 3, marginBottom: spacing.lg },
  suggestGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  suggestCard:     { width: '30%', backgroundColor: colors.card, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.cardBorder, alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.sm },
  suggestEmoji:    { fontSize: 28 },
  suggestLabel:    { color: colors.textMuted, fontSize: typography.size.xs, textAlign: 'center' },

  /* Skeleton */
  skeletonList: { flex: 1 },

  /* État centre */
  center:     { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { color: colors.text, fontSize: typography.size.heading3, fontWeight: typography.weight.light },
  emptySub:   { color: colors.textMuted, fontSize: typography.size.sm, textAlign: 'center', lineHeight: 20 },

  /* Résultats */
  list:        { paddingBottom: spacing.xxxl },
  resultCount: { color: colors.textDim, fontSize: typography.size.xxs, letterSpacing: 2, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  card:        { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  cardThumb:   { width: 68, height: 68, borderRadius: radius.lg, backgroundColor: colors.cardHover, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 },
  cardPhoto:   { width: 68, height: 68 },
  cardEmoji:   { fontSize: 28 },
  cardInfo:    { flex: 1, gap: spacing.xs },
  cardCuisine: { color: colors.accent, fontSize: typography.size.xxs, letterSpacing: 2 },
  cardName:    { color: colors.text, fontSize: typography.size.body, fontWeight: typography.weight.light },
  cardMeta:    { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  cardRating:  { color: colors.accent, fontSize: typography.size.sm },
  cardSep:     { color: colors.textDim, fontSize: typography.size.sm },
  cardPrice:   { color: colors.textMuted, fontSize: typography.size.sm },
  cardArrow:   { color: colors.textDim, fontSize: 22, fontWeight: typography.weight.light },
});
