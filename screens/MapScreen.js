import { useRef, useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image,
  ActivityIndicator, Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { colors, typography, spacing, radius } from '../src/theme';
import useMapScreen, { INITIAL_REGION, CUISINE_EMOJI, getCoordinate } from '../src/hooks/useMapScreen';

let MapView, Marker;
if (Platform.OS !== 'web') {
  const maps = require('react-native-maps');
  MapView = maps.default;
  Marker  = maps.Marker;
}

export default function MapScreen({ navigation }) {
  const mapRef = useRef(null);
  const insets = useSafeAreaInsets();
  const { restaurants, loading, selected, setSelected } = useMapScreen();
  const [hasLocationPermission, setHasLocationPermission] = useState(false);

  useEffect(() => {
    Location.getForegroundPermissionsAsync().then(({ status }) => {
      setHasLocationPermission(status === 'granted');
    });
  }, []);

  const handleMarkerPress = useCallback((r) => {
    setSelected(prev => (prev?.id === r.id ? null : r));
    mapRef.current?.animateToRegion(
      { ...getCoordinate(r), latitudeDelta: 0.04, longitudeDelta: 0.04 },
      350,
    );
  }, [setSelected]);

  const recenter = useCallback(async () => {
    let granted = hasLocationPermission;
    if (!granted) {
      const { status } = await Location.requestForegroundPermissionsAsync();
      granted = status === 'granted';
      setHasLocationPermission(granted);
    }
    if (!granted) return;
    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    mapRef.current?.animateToRegion(
      { latitude: loc.coords.latitude, longitude: loc.coords.longitude, latitudeDelta: 0.05, longitudeDelta: 0.05 },
      400,
    );
  }, [hasLocationPermission]);

  const closeCard  = useCallback(() => setSelected(null), [setSelected]);
  const goSelected = useCallback(() => navigation.navigate('Restaurant', { id: selected?.id, restaurant: selected }), [navigation, selected]);

  if (Platform.OS === 'web') {
    return (
      <View style={s.root}>
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32 }}>
          <Text style={{ fontSize: 48 }}>🗺️</Text>
          <Text style={{ color: colors.primary, fontFamily: typography.display, fontSize: 20, fontWeight: typography.weight.bold, letterSpacing: 1 }}>Carte</Text>
          <Text style={{ color: colors.textMuted, fontSize: 13, textAlign: 'center', lineHeight: 20 }}>
            La carte interactive est disponible sur l'application mobile.
          </Text>
          {loading ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <View style={{ backgroundColor: colors.card, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.cardBorder, padding: 14, width: '100%' }}>
              <Text style={{ color: colors.textDim, fontSize: 11, letterSpacing: 2, marginBottom: 8 }}>RESTAURANTS DISPONIBLES</Text>
              {restaurants.slice(0, 6).map(r => (
                <TouchableOpacity
                  key={r.id}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.cardBorder }}
                  onPress={() => navigation.navigate('Restaurant', { id: r.id, restaurant: r })}
                >
                  <Text style={{ fontSize: 18 }}>{CUISINE_EMOJI[r.cuisine_type] || '🍽️'}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.text, fontSize: 13 }}>{r.name}</Text>
                    <Text style={{ color: colors.textMuted, fontSize: 11 }}>{r.quartier || '—'}</Text>
                  </View>
                  {r.avg_rating > 0 && <Text style={{ color: colors.star, fontSize: 11 }}>★ {Number(r.avg_rating).toFixed(1)}</Text>}
                </TouchableOpacity>
              ))}
              {restaurants.length > 6 && (
                <Text style={{ color: colors.textDim, fontSize: 11, textAlign: 'center', marginTop: 8 }}>+{restaurants.length - 6} autres</Text>
              )}
            </View>
          )}
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={s.root}>

      <MapView
        ref={mapRef}
        style={s.map}
        initialRegion={INITIAL_REGION}
        showsUserLocation={hasLocationPermission}
        showsCompass={false}
        showsScale={false}
        toolbarEnabled={false}
      >
        {restaurants.map((r) => {
          const isOn = selected?.id === r.id;
          const rating = r.avg_rating > 0 ? Number(r.avg_rating).toFixed(1).replace('.', ',') : null;
          return (
            <Marker
              key={String(r.id)}
              coordinate={getCoordinate(r)}
              tracksViewChanges={false}
              onPress={() => handleMarkerPress(r)}
            >
              <View style={[s.pin, isOn && s.pinOn]}>
                <View style={s.pinInner}>
                  {rating
                    ? <Text style={[s.pinRating, isOn && s.pinRatingLg]}>{rating}</Text>
                    : <Text style={s.pinEmoji}>{CUISINE_EMOJI[r.cuisine_type] || '🍽️'}</Text>
                  }
                </View>
              </View>
            </Marker>
          );
        })}
      </MapView>

      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={[s.backBtn, { top: insets.top + spacing.lg }]}
      >
        <Text style={s.backBtnTxt}>←</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={recenter} style={s.recenterBtn}>
        <Text style={s.recenterTxt}>◎</Text>
      </TouchableOpacity>

      {loading && (
        <View style={s.spinner}>
          <ActivityIndicator color={colors.text} size="small" />
        </View>
      )}

      {selected && (
        <View style={s.cardWrap}>
          <TouchableOpacity style={s.card} activeOpacity={0.9} onPress={goSelected}>
            {selected.photos?.[0]
              ? <Image source={{ uri: selected.photos[0] }} style={s.cardThumb} resizeMode="cover" />
              : <LinearGradient colors={colors.photoFallbackGradient} style={s.cardThumb} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
            }
            <View style={s.cardInfo}>
              <Text style={s.cardName} numberOfLines={1}>{selected.name}</Text>
              {selected.avg_rating > 0 && (
                <Text style={s.cardRating}>{'★ ' + Number(selected.avg_rating).toFixed(1).replace('.', ',')}</Text>
              )}
              <Text style={s.cardMeta} numberOfLines={1}>
                {[(selected.cuisine_type || '').replace(/_/g, ' '), selected.quartier, selected.avg_ticket > 0 ? `${selected.avg_ticket.toLocaleString('fr-FR')} DA` : null]
                  .filter(Boolean).join(' · ')}
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={s.closeBtn} onPress={closeCard}>
            <Text style={s.closeBtnTxt}>✕</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  map:  { flex: 1 },

  // Pin "goutte" — Carte plein écran.dc.html : carré tourné 45°, un coin resté droit,
  // plus grand + accent quand sélectionné.
  pin: {
    width: 36, height: 36, backgroundColor: colors.noir,
    borderTopLeftRadius: 18, borderTopRightRadius: 18, borderBottomRightRadius: 18, borderBottomLeftRadius: 3,
    transform: [{ rotate: '45deg' }],
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 4,
  },
  pinOn: {
    backgroundColor: colors.primary, width: 42, height: 42,
    borderTopLeftRadius: 21, borderTopRightRadius: 21, borderBottomRightRadius: 21, borderBottomLeftRadius: 4,
  },
  pinInner:    { transform: [{ rotate: '-45deg' }], alignItems: 'center', justifyContent: 'center' },
  pinRating:   { fontFamily: typography.bodyBold, fontSize: 11.5, color: '#FFFFFF' },
  pinRatingLg: { fontSize: 13 },
  pinEmoji:    { fontSize: 16 },

  backBtn:    {
    position: 'absolute', left: spacing.xl,
    width: 38, height: 38, borderRadius: 19, backgroundColor: '#FFFFFF',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  backBtnTxt: { color: colors.text, fontSize: 16 },

  recenterBtn: {
    position: 'absolute', right: spacing.xl, bottom: 210,
    width: 42, height: 42, borderRadius: 21, backgroundColor: '#FFFFFF',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  recenterTxt: { color: colors.text, fontSize: 17 },

  spinner: {
    position: 'absolute', bottom: 140, alignSelf: 'center',
    backgroundColor: 'rgba(10,10,10,0.92)',
    borderRadius: radius.full, padding: spacing.lg,
  },

  cardWrap: {
    position: 'absolute', bottom: spacing.xxl - 4, left: spacing.lg, right: spacing.lg,
    flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md,
  },
  card: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: radius.floating, overflow: 'hidden',
    padding: spacing.md + 2, gap: spacing.md + 2,
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 6,
  },
  cardThumb: { width: 64, height: 64, borderRadius: radius.md + 1, flexShrink: 0 },
  cardInfo:  { flex: 1 },
  cardName:  { fontFamily: typography.display, fontSize: typography.size.subheading, color: colors.text },
  cardRating:{ fontFamily: typography.bodyBold, fontSize: typography.size.caption, color: colors.primary, marginTop: 2 },
  cardMeta:  { fontFamily: typography.body, fontSize: typography.size.caption, color: colors.textMuted, marginTop: 4 },

  closeBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  closeBtnTxt: { color: colors.textMuted, fontSize: typography.size.bodyLg },
});
