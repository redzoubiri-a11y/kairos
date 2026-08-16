import { useCallback, useRef, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, Platform, FlatList, ScrollView, TouchableOpacity, Image,
  Animated, useWindowDimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
let MapView, Marker;
if (Platform.OS !== 'web') {
  const maps = require('react-native-maps');
  MapView = maps.default;
  Marker  = maps.Marker;
}
import { colors, typography, spacing, radius, shadows } from '../src/theme';
import useExplorer, { getCoord, haversineKm } from '../src/hooks/useExplorer';
import EmptyState from '../src/components/EmptyState';

const ALGER_REGION = { latitude: 36.7538, longitude: 3.0588, latitudeDelta: 0.14, longitudeDelta: 0.14 };
// Hauteur "repos" du panneau — bandeau + un aperçu de la liste (photos comprises),
// pas juste le compteur seul (les images doivent être sur le même bandeau).
const PANEL_PEEK_H = 300;

function formatDistance(km) {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

const FILTER_CHIPS = [
  { id: 'ouvert',   label: 'Ouvert maintenant' },
  { id: 'terrasse', label: 'Terrasse' },
  { id: 'parking',  label: 'Parking' },
];

export default function ExplorerScreen({ navigation, route }) {
  const { restaurants, loading, query, setQuery, userLocation, requestLocation, activeFilters, toggleFilter } = useExplorer();
  const mapRef = useRef(null);
  const insets = useSafeAreaInsets();
  const { height: screenH } = useWindowDimensions();

  // Bandeau "N restaurants à proximité" — les vignettes sont sur le même bandeau,
  // dès l'état au repos. Tap sur l'en-tête = monte le bandeau vers la carte.
  const [listExpanded, setListExpanded] = useState(false);
  const panelAnim = useRef(new Animated.Value(0)).current;
  const panelPeekH = PANEL_PEEK_H + insets.bottom;
  const panelExpandedH = Math.round(screenH * 0.82);
  const panelHeight = panelAnim.interpolate({ inputRange: [0, 1], outputRange: [panelPeekH, panelExpandedH] });
  const toggleList = useCallback(() => {
    setListExpanded(prev => {
      const next = !prev;
      Animated.timing(panelAnim, { toValue: next ? 1 : 0, duration: 320, useNativeDriver: false }).start();
      return next;
    });
  }, [panelAnim]);

  useEffect(() => { requestLocation(); }, [requestLocation]);

  // Préremplit la recherche quand on arrive depuis une catégorie/ville de l'Accueil
  useFocusEffect(useCallback(() => {
    const initial = route?.params?.initialQuery;
    if (initial) setQuery(initial);
  }, [route?.params?.initialQuery]));

  useEffect(() => {
    if (!mapRef.current) return;
    if (!query.trim() || restaurants.length === 0) {
      mapRef.current.animateToRegion(ALGER_REGION, 400);
      return;
    }
    const coords = restaurants.map(getCoord);
    const lats = coords.map(c => c.latitude);
    const lngs = coords.map(c => c.longitude);
    const minLat = Math.min(...lats), maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
    mapRef.current.animateToRegion({
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: Math.max((maxLat - minLat) * 1.8, 0.03),
      longitudeDelta: Math.max((maxLng - minLng) * 1.8, 0.03),
    }, 450);
  }, [query, restaurants]);

  const goRestaurant = useCallback(
    (r) => navigation.navigate('Restaurant', { restaurant: r }),
    [navigation],
  );

  return (
    <SafeAreaView style={s.root} edges={[]}>
      {Platform.OS !== 'web' ? (
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          initialRegion={ALGER_REGION}
          showsCompass={false}
          toolbarEnabled={false}
          showsUserLocation={!!userLocation}
        >
          {restaurants.map((r) => {
            const coord = getCoord(r);
            const distance = userLocation
              ? formatDistance(haversineKm(userLocation.latitude, userLocation.longitude, coord.latitude, coord.longitude))
              : null;
            const rating = r.avg_rating > 0 ? Number(r.avg_rating).toFixed(1).replace('.', ',') : null;
            return (
              <Marker
                key={String(r.id)}
                coordinate={coord}
                tracksViewChanges={true}
                onPress={() => goRestaurant(r)}
                anchor={{ x: 0.5, y: 0 }}
              >
                <View style={s.pinWrap}>
                  <View style={[s.pin, shadows.mapPin]}>
                    <View style={s.pinInner}>
                      {rating
                        ? <Text style={s.pinRating}>{rating}</Text>
                        : <View style={s.pinDot} />
                      }
                    </View>
                  </View>
                  {!!distance && (
                    <View style={s.distancePill}>
                      <Text style={s.distanceTxt}>{distance}</Text>
                    </View>
                  )}
                </View>
              </Marker>
            );
          })}
        </MapView>
      ) : (
        <View style={[StyleSheet.absoluteFill, s.webFallback]}>
          <Text style={s.webFallbackTxt}>Carte disponible sur mobile</Text>
        </View>
      )}

      <View style={[s.topBar, { paddingTop: insets.top + spacing.xl }]}>
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
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipsRow}>
          {FILTER_CHIPS.map(c => {
            const active = activeFilters.has(c.id);
            return (
              <TouchableOpacity key={c.id} style={[s.chip, active && s.chipOn]} onPress={() => toggleFilter(c.id)}>
                <Text style={[s.chipTxt, active && s.chipTxtOn]}>{c.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {!loading && restaurants.length === 0 && (
        <EmptyState
          icon={<Text style={{ fontSize: 20 }}>🔍</Text>}
          title="Aucun restaurant trouvé"
          subtitle="Essayez un autre nom, une autre cuisine ou un autre quartier."
          style={s.emptyState}
        />
      )}

      {/* Bandeau "N restaurants à proximité" — tap = monte en liste complète sur la carte */}
      {!loading && (
        <Animated.View style={[s.bottomPanel, { height: panelHeight, paddingBottom: insets.bottom }]}>
          <TouchableOpacity style={s.bottomPanelHeader} onPress={toggleList} activeOpacity={0.8}>
            <View style={s.bottomPanelHandle} />
            <Text style={s.bottomPanelTitle}>
              {restaurants.length} restaurant{restaurants.length !== 1 ? 's' : ''} à proximité
            </Text>
          </TouchableOpacity>

          <FlatList
            style={{ flex: 1 }}
            data={restaurants}
            keyExtractor={(r) => String(r.id)}
            contentContainerStyle={s.bottomListContent}
            showsVerticalScrollIndicator={false}
            renderItem={({ item: r }) => {
              const rating = r.avg_rating > 0 ? Number(r.avg_rating).toFixed(1).replace('.', ',') : null;
              const meta = [(r.cuisine_type || '').replace(/_/g, ' '), r.quartier].filter(Boolean).join(' · ');
              const photo = r.photos?.[0];
              return (
                <TouchableOpacity style={s.bottomRow} onPress={() => goRestaurant(r)} activeOpacity={0.85}>
                  <View style={s.bottomRowInfo}>
                    <Text style={s.bottomRowName} numberOfLines={1}>{r.name}</Text>
                    {!!meta && <Text style={s.bottomRowMeta} numberOfLines={1}>{meta}</Text>}
                    {!!rating && (
                      <View style={s.bottomRowRating}>
                        <Text style={s.bottomRowStar}>★</Text>
                        <Text style={s.bottomRowRatingTxt}>{rating}</Text>
                      </View>
                    )}
                  </View>
                  {photo
                    ? <Image source={{ uri: photo }} style={s.bottomRowImg} resizeMode="cover" />
                    : <View style={[s.bottomRowImg, s.imgPlaceholder]} />
                  }
                </TouchableOpacity>
              );
            }}
          />
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },

  topBar: { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: 20 },

  // Verre blanc, cadre vert — cohérent avec le reste de l'app
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 9,
    backgroundColor: colors.glassBg,
    borderWidth: 1.5, borderColor: colors.primary,
    borderRadius: radius.lg, paddingVertical: spacing.lg, paddingHorizontal: spacing.lg + 1,
  },
  searchInput: { flex: 1, fontFamily: typography.body, fontSize: typography.size.bodyLg, color: colors.text, padding: 0 },

  chipsRow: { flexDirection: 'row', gap: spacing.sm, paddingTop: spacing.md },
  chip:     { paddingHorizontal: spacing.lg - 2, paddingVertical: spacing.sm + 1, borderRadius: radius.badgeSm, backgroundColor: colors.glassBgStrong, borderWidth: 1, borderColor: colors.cardBorder },
  chipOn:   { backgroundColor: colors.noir, borderColor: colors.noir },
  chipTxt:  { fontFamily: typography.bodyBold, fontSize: typography.size.caption + 0.5, color: colors.textMuted },
  chipTxtOn:{ color: '#FFFFFF' },

  // Pin "goutte" — Explorer.dc.html : carré tourné 45°, un coin resté droit
  pinWrap: { alignItems: 'center' },
  pin: {
    width: 34, height: 34, backgroundColor: colors.noir,
    borderTopLeftRadius: 17, borderTopRightRadius: 17, borderBottomRightRadius: 17, borderBottomLeftRadius: 3,
    transform: [{ rotate: '45deg' }],
    alignItems: 'center', justifyContent: 'center',
  },
  pinInner:  { transform: [{ rotate: '-45deg' }], alignItems: 'center', justifyContent: 'center' },
  pinRating: { fontFamily: typography.bodyBold, fontSize: 11, color: '#FFFFFF' },
  pinDot: { width: 9, height: 9, borderRadius: 4.5, backgroundColor: '#FFFFFF' },

  imgPlaceholder: { backgroundColor: colors.cardHover },
  distancePill: {
    marginTop: 3, backgroundColor: 'rgba(10,10,10,0.78)', borderRadius: radius.sm,
    paddingHorizontal: spacing.xs + 1, paddingVertical: 2,
  },
  distanceTxt: { fontFamily: typography.bodySemibold, fontSize: typography.size.xs, color: '#FFFFFF' },

  webFallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cardHover, padding: spacing.xl },
  webFallbackTxt: { fontFamily: typography.body, fontSize: typography.size.body, color: colors.textMuted },

  emptyState: {
    position: 'absolute', left: 20, right: 20, top: '45%',
  },

  // Bandeau bas — collé au bord de l'écran, monte en liste complète au tap
  bottomPanel: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    backgroundColor: colors.glassBgStrong,
    borderTopLeftRadius: radius.xxl, borderTopRightRadius: radius.xxl,
    overflow: 'hidden',
    ...shadows.md,
  },
  bottomPanelHeader: { alignItems: 'center', paddingTop: spacing.sm, paddingBottom: spacing.md },
  bottomPanelHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: colors.cardBorder, marginBottom: spacing.sm },
  bottomPanelTitle: { fontFamily: typography.bodySemibold, fontSize: typography.size.body, color: colors.text },

  bottomListContent: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxl, gap: spacing.md },
  bottomRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.cardBorder },
  bottomRowInfo: { flex: 1, minWidth: 0 },
  bottomRowName: { fontFamily: typography.display, fontSize: typography.size.subheading, color: colors.text },
  bottomRowMeta: { fontFamily: typography.body, fontSize: typography.size.caption, color: colors.textMuted, marginTop: 2 },
  bottomRowRating: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4 },
  bottomRowStar: { fontSize: 11, color: colors.star },
  bottomRowRatingTxt: { fontFamily: typography.bodyBold, fontSize: typography.size.caption, color: colors.text },
  bottomRowImg: { width: 64, height: 64, borderRadius: radius.md, flexShrink: 0 },
});
