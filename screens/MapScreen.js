import { useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
  const { restaurants, loading, selected, setSelected } = useMapScreen();

  const handleMarkerPress = useCallback((r) => {
    setSelected(prev => (prev?.id === r.id ? null : r));
    mapRef.current?.animateToRegion(
      { ...getCoordinate(r), latitudeDelta: 0.04, longitudeDelta: 0.04 },
      350,
    );
  }, [setSelected]);

  const closeCard  = useCallback(() => setSelected(null), [setSelected]);
  const goSelected = useCallback(() => navigation.navigate('Restaurant', { restaurant: selected }), [navigation, selected]);

  if (Platform.OS === 'web') {
    return (
      <View style={s.root}>
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32 }}>
          <Text style={{ fontSize: 48 }}>🗺️</Text>
          <Text style={{ color: colors.accent, fontSize: 20, fontWeight: '600', letterSpacing: 4 }}>CARTE</Text>
          <Text style={{ color: colors.textMuted, fontSize: 13, textAlign: 'center', lineHeight: 20 }}>
            La carte interactive est disponible sur l'application mobile.
          </Text>
          {loading ? (
            <ActivityIndicator color={colors.accent} />
          ) : (
            <View style={{ backgroundColor: colors.accentSoft, borderRadius: 0, borderWidth: 1, borderColor: 'rgba(232,160,69,0.3)', padding: 14, width: '100%' }}>
              <Text style={{ color: colors.accent, fontSize: 11, letterSpacing: 2, marginBottom: 8 }}>RESTAURANTS DISPONIBLES</Text>
              {restaurants.slice(0, 6).map(r => (
                <TouchableOpacity
                  key={r.id}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.cardBorder }}
                  onPress={() => navigation.navigate('Restaurant', { restaurant: r })}
                >
                  <Text style={{ fontSize: 18 }}>{CUISINE_EMOJI[r.cuisine_type] || '🍽️'}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.text, fontSize: 13 }}>{r.name}</Text>
                    <Text style={{ color: colors.textMuted, fontSize: 11 }}>{r.quartier || '—'}</Text>
                  </View>
                  {r.avg_rating > 0 && <Text style={{ color: colors.accent, fontSize: 11 }}>★ {Number(r.avg_rating).toFixed(1)}</Text>}
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
        showsUserLocation
        showsCompass={false}
        showsScale={false}
        toolbarEnabled={false}
      >
        {restaurants.map((r) => (
          <Marker
            key={String(r.id)}
            coordinate={getCoordinate(r)}
            tracksViewChanges={false}
            onPress={() => handleMarkerPress(r)}
          >
            <View style={[s.pin, selected?.id === r.id && s.pinActive]}>
              <Text style={[s.pinEmoji, selected?.id === r.id && s.pinEmojiLg]}>
                {CUISINE_EMOJI[r.cuisine_type] || '🍽️'}
              </Text>
            </View>
          </Marker>
        ))}
      </MapView>

      <SafeAreaView style={s.headerWrap} pointerEvents="box-none">
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
            <Text style={s.backBtnTxt}>←</Text>
          </TouchableOpacity>
          <View>
            <Text style={s.headerSub}>Alger</Text>
          </View>
          <View style={s.countBadge}>
            <View style={s.countDot} />
            <Text style={s.countTxt}>
              {loading ? '…' : restaurants.length + ' tables'}
            </Text>
          </View>
        </View>
      </SafeAreaView>

      {loading && (
        <View style={s.spinner}>
          <ActivityIndicator color={colors.accent} size="small" />
        </View>
      )}

      {selected && (
        <View style={s.cardWrap}>
          <TouchableOpacity style={s.card} activeOpacity={0.88} onPress={goSelected}>
            <View style={s.cardThumb}>
              <Text style={s.cardEmoji}>
                {CUISINE_EMOJI[selected.cuisine_type] || '🍽️'}
              </Text>
            </View>
            <View style={s.cardInfo}>
              <Text style={s.cardTag}>
                {selected.cuisine_type ? selected.cuisine_type.toUpperCase() : '—'}
              </Text>
              <Text style={s.cardName} numberOfLines={1}>{selected.name}</Text>
              <Text style={s.cardAddr} numberOfLines={1}>{'📍 ' + (selected.quartier || 'Alger')}</Text>
              {selected.avg_rating > 0 && (
                <Text style={s.cardRating}>{'★ ' + Number(selected.avg_rating).toFixed(1)}</Text>
              )}
            </View>
            <View style={s.cardArrow}>
              <Text style={s.cardArrowTxt}>›</Text>
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

  pin: {
    width: 38, height: 38, borderRadius: 0,
    backgroundColor: 'rgba(15,13,11,0.9)',
    borderWidth: 2, borderColor: colors.cardBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  pinActive: {
    borderColor: '#c8975a', borderWidth: 2.5,
    backgroundColor: colors.card,
    width: 46, height: 46, borderRadius: 0,
    shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 10, shadowOffset: { width: 0, height: 0 }, elevation: 6,
  },
  pinEmoji:   { fontSize: 18 },
  pinEmojiLg: { fontSize: 22 },

  headerWrap: { position: 'absolute', top: 0, left: 0, right: 0 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginHorizontal: spacing.xl, marginTop: spacing.lg,
    backgroundColor: 'rgba(15,13,11,0.92)',
    borderRadius: radius.xxl, paddingHorizontal: spacing.xxl, paddingVertical: spacing.lg,
    borderWidth: 1, borderColor: colors.cardBorder,
  },
  backBtn:    { marginRight: spacing.sm },
  backBtnTxt: { color: 'rgba(240,235,227,0.85)', fontSize: 22 },
  headerSub:  { color: colors.textMuted, fontSize: typography.size.caption, marginTop: 1 },
  countBadge: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.accentSoft,
    borderRadius: radius.full, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
    borderWidth: 1, borderColor: 'rgba(200,151,90,0.4)',
    shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 0 }, elevation: 3,
  },
  countDot: { width: 6, height: 6, borderRadius: 0, backgroundColor: colors.green },
  countTxt:  { color: colors.accent, fontSize: typography.size.caption, fontWeight: '500' },

  spinner: {
    position: 'absolute', bottom: 140, alignSelf: 'center',
    backgroundColor: 'rgba(15,13,11,0.92)',
    borderRadius: radius.full, padding: spacing.lg,
  },

  cardWrap: {
    position: 'absolute', bottom: 110, left: spacing.xl, right: spacing.xl,
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
  },
  card: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.xxl, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(232,160,69,0.3)',
    padding: spacing.xl, gap: spacing.lg,
  },
  cardThumb: {
    width: 50, height: 50, borderRadius: radius.xl,
    backgroundColor: colors.cardHover,
    alignItems: 'center', justifyContent: 'center',
  },
  cardEmoji: { fontSize: 24 },
  cardInfo:  { flex: 1 },
  cardTag:   { color: colors.accent, fontSize: typography.size.xs, letterSpacing: 2.5, marginBottom: 3 },
  cardName:  { color: colors.text,   fontSize: typography.size.heading3, fontWeight: '400', marginBottom: 3 },
  cardAddr:  { color: colors.textMuted, fontSize: typography.size.caption, marginBottom: 4 },
  cardRating:{ color: colors.accent, fontSize: typography.size.caption, fontWeight: '500' },
  cardArrow: {
    width: 32, height: 32, borderRadius: 0,
    backgroundColor: '#c8975a',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 10, shadowOffset: { width: 0, height: 0 }, elevation: 5,
  },
  cardArrowTxt: { color: colors.bg, fontSize: 20, fontWeight: '700', marginTop: -1 },

  closeBtn: {
    width: 40, height: 40, borderRadius: 0,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  closeBtnTxt: { color: colors.textMuted, fontSize: typography.size.bodyLg },
});
