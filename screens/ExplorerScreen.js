import { useRef, useCallback, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  SafeAreaView, ActivityIndicator, Platform,
  StatusBar as RNStatusBar, Image, FlatList,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { colors, typography, spacing, radius } from '../src/theme';
import useExplorer, { CITIES, getCoord } from '../src/hooks/useExplorer';
import RestaurantPin from '../src/components/RestaurantPin';
import ExplorerRestoCard, { CARD_W } from '../src/components/ExplorerRestoCard';


const TOP = Platform.OS === 'android' ? (RNStatusBar.currentHeight || 0) : 0;

export default function ExplorerScreen({ navigation, route }) {
  const mapRef = useRef(null);
  const initialCity = route?.params?.initialCity;
  const {
    city, setCity, mode, setMode, restaurants, loading, selected, setSelected,
    cityData, cityDefault,
    userLocation, nearMe, locLoading, requestNearMe,
  } = useExplorer(initialCity);

  const changeCity = useCallback((c) => {
    setCity(c);
    const r = CITIES.find(x => x.id === c)?.region;
    if (r) mapRef.current?.animateToRegion(r, 400);
  }, [setCity]);

  const handleNearMe = useCallback(async () => {
    await requestNearMe();
  }, [requestNearMe]);

  useEffect(() => {
    if (nearMe && userLocation) {
      mapRef.current?.animateToRegion(
        { ...userLocation, latitudeDelta: 0.04, longitudeDelta: 0.04 },
        500,
      );
    }
  }, [nearMe, userLocation]);

  const handleMarker = useCallback((r) => {
    const same = selected?.id === r.id;
    setSelected(same ? null : r);
    if (!same) {
      mapRef.current?.animateToRegion(
        { ...getCoord(r, cityDefault), latitudeDelta: 0.025, longitudeDelta: 0.025 },
        350,
      );
    }
  }, [selected, cityDefault, setSelected]);

  const renderItem = useCallback(({ item: r, index }) => (
    <ExplorerRestoCard
      r={r}
      rank={index}
      onPress={() => navigation.navigate('Restaurant', { restaurant: r })}
      onReserve={() => navigation.navigate('ReservationForm', { restaurant: r })}
    />
  ), [navigation]);

  const canBack           = navigation.canGoBack();
  const goBack            = useCallback(() => { if (navigation.canGoBack()) navigation.goBack(); }, [navigation]);
  const toggleMode        = useCallback(() => { setMode(m => m === 'map' ? 'list' : 'map'); setSelected(null); }, [setMode, setSelected]);
  const closeSelected     = useCallback(() => setSelected(null), [setSelected]);
  const goReserveSelected = useCallback(() => { const r = selected; setSelected(null); navigation.navigate('ReservationForm', { restaurant: r }); }, [navigation, selected, setSelected]);
  const goViewSelected    = useCallback(() => { const r = selected; setSelected(null); navigation.navigate('Restaurant', { restaurant: r }); }, [navigation, selected, setSelected]);

  useFocusEffect(useCallback(() => () => setSelected(null), [setSelected]));

  return (
    <View style={s.root}>

      {mode === 'map' && (
        <View style={s.mapWrap}>
          <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFill}
            initialRegion={cityData.region}
            showsUserLocation
            showsCompass={false}
            toolbarEnabled={false}
          >
            {restaurants.map(r => (
              <Marker
                key={String(r.id)}
                coordinate={getCoord(r, cityDefault)}
                tracksViewChanges={false}
                onPress={() => handleMarker(r)}
              >
                <RestaurantPin restaurant={r} isSelected={selected?.id === r.id} />
              </Marker>
            ))}
          </MapView>

          {selected && (
            <View style={s.selCard}>
              {selected.photos?.[0]
                ? <Image source={{ uri: selected.photos[0] }} style={s.selPhoto} resizeMode="cover" />
                : <View style={[s.selPhoto, { backgroundColor:colors.cardHover, alignItems:'center', justifyContent:'center' }]}><Text style={{ fontSize:28 }}>🍽️</Text></View>
              }
              <View style={s.selOverlay}>
                <Text style={s.selCuisine}>{(selected.cuisine_type||'').toUpperCase().replace(/_/g,' ')}</Text>
                <Text style={s.selName} numberOfLines={1}>{selected.name}</Text>
                <View style={s.selMeta}>
                  {selected.avg_rating > 0 && <Text style={s.selRating}>★ {Number(selected.avg_rating).toFixed(1)}</Text>}
                  {selected.quartier && <Text style={s.selAddr}>· {selected.quartier}</Text>}
                  {selected.avg_ticket > 0 && <Text style={s.selPrice}>· {selected.avg_ticket.toLocaleString('fr-FR')} DA</Text>}
                </View>
              </View>
              <View style={s.selActions}>
                <TouchableOpacity style={s.selBtnPrimary} onPress={goReserveSelected}>
                  <Text style={s.selBtnPrimaryTxt}>Réserver</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.selBtnSecondary} onPress={goViewSelected}>
                  <Text style={s.selBtnSecondaryTxt}>Voir le resto →</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={s.selClose} onPress={closeSelected}>
                <Text style={s.selCloseTxt}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      <SafeAreaView style={s.overlay} pointerEvents="box-none">
        <View style={s.header}>
          {canBack
            ? <TouchableOpacity style={s.backBtn} onPress={goBack}><Text style={s.backBtnTxt}>←</Text></TouchableOpacity>
            : <View style={{ width: 36 }} />
          }
          <Text style={s.headerTitle}>EXPLORER</Text>
          <View style={{ flexDirection:'row', gap:8, alignItems:'center' }}>
            {!loading && (
              <View style={s.countBadge}>
                <View style={s.countDot} />
                <Text style={s.countTxt}>{restaurants.length} restos</Text>
              </View>
            )}
            <TouchableOpacity style={[s.modeBtn, mode === 'list' && s.modeBtnOn]} onPress={toggleMode}>
              <Text style={s.modeBtnTxt}>{mode === 'map' ? '☰' : '🗺️'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      <View style={[s.sheet, mode === 'list' && s.sheetFull]}>
        {mode === 'map' && <View style={s.sheetHandle} />}

        <Text style={s.quartierLabel}>PAR QUARTIER</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.cityGrid}>
          <TouchableOpacity
            style={[s.cityChip, s.nearMeChip, nearMe && s.cityChipOn]}
            onPress={handleNearMe}
            disabled={locLoading}
          >
            <Text style={[s.cityTxt, nearMe && s.cityTxtOn]}>Près de moi</Text>
          </TouchableOpacity>
          {CITIES.map(c => (
            <TouchableOpacity key={c.id} style={[s.cityChip, !nearMe && city === c.id && s.cityChipOn]} onPress={() => changeCity(c.id)}>
              <Text style={[s.cityTxt, !nearMe && city === c.id && s.cityTxtOn]}>{c.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {loading ? (
          <View style={s.empty}><ActivityIndicator color={colors.accent} size="large" /></View>
        ) : restaurants.length === 0 ? (
          <View style={s.empty}>
            <Text style={{ fontSize: 36 }}>🍽️</Text>
            <Text style={s.emptyTitle}>Aucun restaurant trouvé</Text>
            <Text style={s.emptyDesc}>Aucun établissement pour cette ville.</Text>
          </View>
        ) : (
          <FlatList
            data={restaurants}
            keyExtractor={r => String(r.id)}
            numColumns={2}
            columnWrapperStyle={s.gridRow}
            contentContainerStyle={s.gridContent}
            showsVerticalScrollIndicator={false}
            renderItem={renderItem}
            ListFooterComponent={<View style={{ height: 60 }} />}
          />
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root:    { flex:1, backgroundColor:colors.bg },
  mapWrap: { flex:46 },

  overlay:     { position:'absolute', top:0, left:0, right:0, zIndex:10 },
  header:      { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingHorizontal:spacing.xl, paddingTop:TOP+14, paddingBottom:14, backgroundColor:'rgba(15,13,11,0.97)', borderBottomWidth:1, borderBottomColor:colors.cardBorder },
  headerItalic:{ color:colors.blue, fontSize:typography.size.caption, fontStyle:'italic', letterSpacing:1.5, marginBottom:2 },
  headerTitle: { color:colors.text, fontSize:typography.size.heading2, fontWeight:typography.weight.bold, letterSpacing:2 },
  countBadge:  { flexDirection:'row', alignItems:'center', gap:5, backgroundColor:colors.accentSoft, borderRadius:radius.full, paddingHorizontal:spacing.md, paddingVertical:5, borderWidth:1, borderColor:'rgba(232,160,69,0.3)' },
  countDot:    { width:6, height:6, borderRadius:3, backgroundColor:colors.green },
  countTxt:    { color:colors.accent, fontSize:typography.size.caption, fontWeight:'500' },
  modeBtn:     { width:36, height:36, borderRadius:18, backgroundColor:colors.card, borderWidth:1, borderColor:colors.cardBorder, alignItems:'center', justifyContent:'center' },
  modeBtnOn:   { backgroundColor:colors.accentSoft, borderColor:'rgba(232,160,69,0.3)' },
  modeBtnTxt:  { fontSize:16 },

  selCard:    { position:'absolute', bottom:8, left:14, right:14, backgroundColor:colors.card, borderRadius:radius.xxl, borderWidth:1, borderColor:'rgba(232,160,69,0.3)', overflow:'hidden', zIndex:5 },
  selPhoto:   { width:'100%', height:120 },
  selOverlay: { paddingHorizontal:spacing.xl, paddingTop:spacing.md, paddingBottom:spacing.xs },
  selCuisine: { color:colors.accent, fontSize:typography.size.xs, letterSpacing:2.5, marginBottom:3 },
  selName:    { color:colors.text, fontSize:typography.size.heading2, fontWeight:'300', letterSpacing:0.3, marginBottom:4 },
  selMeta:    { flexDirection:'row', flexWrap:'wrap', gap:6 },
  selRating:  { color:colors.accent, fontSize:typography.size.body, fontWeight:'500' },
  selAddr:    { color:colors.textMuted, fontSize:typography.size.body },
  selPrice:   { color:colors.textDim, fontSize:typography.size.body },
  selActions: { flexDirection:'row', gap:8, paddingHorizontal:spacing.xl, paddingVertical:spacing.lg },
  selBtnPrimary:    { flex:1, backgroundColor:colors.accent, borderRadius:radius.md, paddingVertical:11, alignItems:'center' },
  selBtnPrimaryTxt: { color:colors.bg, fontSize:typography.size.bodyLg, fontWeight:'500' },
  selBtnSecondary:  { flex:1, borderRadius:radius.md, paddingVertical:11, alignItems:'center', borderWidth:1, borderColor:colors.cardBorder },
  selBtnSecondaryTxt:{ color:colors.text, fontSize:typography.size.bodyLg },
  selClose:   { position:'absolute', top:10, right:10, width:28, height:28, borderRadius:14, backgroundColor:'rgba(15,13,11,0.72)', alignItems:'center', justifyContent:'center' },
  selCloseTxt:{ color:colors.text, fontSize:typography.size.body },

  sheet:       { flex:54, backgroundColor:colors.bg, borderTopWidth:1, borderTopColor:colors.cardBorder, paddingTop:8 },
  sheetFull:   { flex:1, borderTopWidth:1, borderTopColor:colors.cardBorder, marginTop:TOP+66 },
  sheetHandle: { width:36, height:3, backgroundColor:colors.textDim, borderRadius:2, alignSelf:'center', marginBottom:8, opacity:0.35 },

  quartierLabel:{ color:colors.textMuted, fontSize:typography.size.xs, letterSpacing:3, paddingHorizontal:spacing.xl, paddingTop:spacing.sm, paddingBottom:spacing.xs },
  cityGrid:    { flexDirection:'row', paddingHorizontal:14, paddingBottom:8, gap:8 },
  cityChip:    { flexDirection:'row', alignItems:'center', gap:5, paddingHorizontal:12, paddingVertical:8, borderRadius:radius.full, backgroundColor:colors.card, borderWidth:1, borderColor:colors.cardBorder },
  nearMeChip:  { borderColor:'rgba(90,155,224,0.3)', backgroundColor:colors.blueSoft },
  cityChipOn:  { backgroundColor:colors.accent, borderColor:colors.accent },
  cityEmoji:   { fontSize:13 },
  cityTxt:     { color:colors.text, fontSize:typography.size.body },
  cityTxtOn:   { color:colors.bg, fontWeight:'600' },

  backBtn:     { width:36, height:36, borderRadius:18, backgroundColor:colors.card, borderWidth:1, borderColor:colors.cardBorder, alignItems:'center', justifyContent:'center' },
  backBtnTxt:  { color:colors.text, fontSize:18, lineHeight:22 },

  gridRow:     { paddingHorizontal:14, justifyContent:'space-between' },
  gridContent: { paddingTop:6 },

  empty:       { flex:1, alignItems:'center', justifyContent:'center', gap:8, padding:30 },
  emptyTitle:  { color:colors.text, fontSize:typography.size.heading2, fontWeight:'300' },
  emptyDesc:   { color:colors.textMuted, fontSize:typography.size.body, textAlign:'center' },
});
