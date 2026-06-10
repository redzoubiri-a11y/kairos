import { useCallback, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, Keyboard, ActivityIndicator, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../src/theme';
import useSearch from '../src/hooks/useSearch';
import { CUISINE_EMOJI } from '../src/hooks/useMapScreen';
import BottomTabBar from '../src/components/BottomTabBar';

let MapView, Marker;
if (Platform.OS !== 'web') {
  const maps = require('react-native-maps');
  MapView = maps.default;
  Marker  = maps.Marker;
}

const CITY_REGIONS = {
  all:         { latitude: 36.7538, longitude: 3.0588, latitudeDelta: 4.0,  longitudeDelta: 4.0  },
  alger:       { latitude: 36.7538, longitude: 3.0588, latitudeDelta: 0.22, longitudeDelta: 0.22 },
  oran:        { latitude: 35.6971, longitude: -0.6420,latitudeDelta: 0.22, longitudeDelta: 0.22 },
  constantine: { latitude: 36.3650, longitude: 6.6147, latitudeDelta: 0.22, longitudeDelta: 0.22 },
  tizi_ouzou:  { latitude: 36.7117, longitude: 4.0451, latitudeDelta: 0.22, longitudeDelta: 0.22 },
  bejaia:      { latitude: 36.7506, longitude: 5.0568, latitudeDelta: 0.22, longitudeDelta: 0.22 },
  setif:       { latitude: 36.1901, longitude: 5.4100, latitudeDelta: 0.22, longitudeDelta: 0.22 },
  annaba:      { latitude: 36.9000, longitude: 7.7667, latitudeDelta: 0.22, longitudeDelta: 0.22 },
  tlemcen:     { latitude: 34.8780, longitude: -1.3200,latitudeDelta: 0.22, longitudeDelta: 0.22 },
};


export default function SearchScreen({ navigation, route }) {
  const { initialQuery = '', initialCity = 'alger' } = route?.params ?? {};

  const {
    inputRef,
    query, setQuery,
    quartier, setQuartier,
    city,
    results, loading, searched,
    clearQuery,
  } = useSearch({ initialQuery, initialCity });

  const mapRef = useRef(null);

  // Recentre la carte sur les résultats
  useEffect(() => {
    if (!mapRef.current) return;
    const coords = results
      .filter(r => r.latitude && r.longitude)
      .map(r => ({ latitude: r.latitude, longitude: r.longitude }));
    if (coords.length === 1) {
      mapRef.current.animateToRegion(
        { latitude: coords[0].latitude, longitude: coords[0].longitude, latitudeDelta: 0.05, longitudeDelta: 0.05 },
        400,
      );
    } else if (coords.length > 1) {
      mapRef.current.fitToCoordinates(coords, {
        edgePadding: { top: 80, right: 60, bottom: 80, left: 60 },
        animated: true,
      });
    } else if (!query.trim() && !quartier.trim()) {
      mapRef.current.animateToRegion(CITY_REGIONS[city] || CITY_REGIONS.alger, 400);
    }
  }, [results, city, query, quartier]);

  const goRestaurant = useCallback((r) => {
    Keyboard.dismiss();
    navigation.navigate('Restaurant', { restaurant: r });
  }, [navigation]);

  const initialRegion = CITY_REGIONS[city] || CITY_REGIONS.alger;

  return (
    <SafeAreaView style={s.root} edges={['top', 'left', 'right']}>

      {/* ── Header ── */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backBtnTxt}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>RECHERCHE</Text>
        <View style={s.backBtn} />
      </View>

      {/* ── Inputs ── */}
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

      {/* ── Carte ── */}
      <View style={s.mapWrap}>

        {Platform.OS !== 'web' && MapView ? (
          <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFill}
            initialRegion={initialRegion}
            showsMyLocationButton={false}
          >
            {results.filter(r => r.latitude && r.longitude).map(r => (
              <Marker
                key={r.id}
                coordinate={{ latitude: r.latitude, longitude: r.longitude }}
                onPress={() => goRestaurant(r)}
              >
                <View style={s.pin}>
                  <Text style={s.pinEmoji}>{CUISINE_EMOJI[r.cuisine_type] || '🍽️'}</Text>
                  <Text style={s.pinName} numberOfLines={1}>{r.name}</Text>
                </View>
              </Marker>
            ))}
          </MapView>
        ) : (
          <View style={s.mapPlaceholder}>
            <Text style={{ fontSize: 40 }}>🗺️</Text>
          </View>
        )}

        {/* Badge résultats */}
        {results.length > 0 && !loading && (
          <View style={s.countBadge}>
            <Text style={s.countTxt}>
              {results.length} résultat{results.length > 1 ? 's' : ''}
            </Text>
          </View>
        )}

        {/* Chargement */}
        {loading && (
          <View style={s.overlay}>
            <ActivityIndicator color={colors.text} size="large" />
            <Text style={s.overlayTxt}>Recherche en cours…</Text>
          </View>
        )}

        {/* Aucun résultat */}
        {query.trim() && !loading && results.length === 0 && searched && (
          <View style={s.overlay}>
            <Text style={s.emptyEmoji}>🍽️</Text>
            <Text style={s.emptyTitle}>Aucun résultat</Text>
            <Text style={s.emptySub}>Essayez un autre nom ou quartier</Text>
          </View>
        )}

        {/* Tip initial */}
        {!query.trim() && !quartier.trim() && (
          <View style={s.tipBadge}>
            <Text style={s.tipTxt}>Tapez un nom pour localiser un restaurant</Text>
          </View>
        )}

      </View>

      <BottomTabBar navigation={navigation} activeTab="Recherche" />

    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },

  header:      { height: 52, flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  headerTitle: { flex: 1, color: colors.text, fontSize: typography.size.heading2, fontWeight: typography.weight.bold, letterSpacing: 3, textAlign: 'center' },
  backBtn:     { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backBtnTxt:  { color: colors.text, fontSize: 22 },

  inputBlock:  { borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  inputRow:    { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.xl, height: 50 },
  inputDivider:{ height: 1, backgroundColor: colors.cardBorder, marginLeft: spacing.xl + 16 + spacing.md },
  input:       { flex: 1, color: colors.text, fontSize: typography.size.bodyLg, fontWeight: '300', padding: 0 },

  mapWrap:        { flex: 1 },
  mapPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#e8e8e8' },

  pin:      { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#1A1A1A', paddingHorizontal: 8, paddingVertical: 5, alignItems: 'center', maxWidth: 120 },
  pinEmoji: { fontSize: 14 },
  pinName:  { color: '#1A1A1A', fontSize: 9, fontWeight: '600', marginTop: 2, letterSpacing: 0.3 },

  countBadge: { position: 'absolute', top: spacing.lg, left: spacing.lg, backgroundColor: '#1A1A1A', paddingHorizontal: spacing.lg, paddingVertical: spacing.xs },
  countTxt:   { color: '#fff', fontSize: typography.size.caption, fontWeight: typography.weight.semibold, letterSpacing: 1 },

  tipBadge: { position: 'absolute', bottom: spacing.lg, alignSelf: 'center', backgroundColor: 'rgba(255,255,255,0.92)', paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderWidth: 1, borderColor: colors.cardBorder },
  tipTxt:   { color: colors.textMuted, fontSize: typography.size.caption },

  overlay:    { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.88)', alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  overlayTxt: { color: colors.textMuted, fontSize: typography.size.body },
  emptyEmoji: { fontSize: 44 },
  emptyTitle: { color: colors.text, fontSize: typography.size.heading3, fontWeight: '300' },
  emptySub:   { color: colors.textMuted, fontSize: typography.size.body, textAlign: 'center' },
});
