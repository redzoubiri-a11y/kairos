import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, SafeAreaView, ActivityIndicator, Dimensions, Image, Platform, StatusBar as RNStatusBar,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { supabase } from '../supabase';

const SW = Dimensions.get('window').width;
const SH = Dimensions.get('window').height;
const TOP = Platform.OS === 'android' ? (RNStatusBar.currentHeight || 0) : 0;

const C = {
  bg:'#0d1628', bg2:'#111827', bg3:'#1a2332',
  accent:'#c8975a', accent2:'#4a7fa5',
  text:'#f0ece4', dim:'#8a9ab0', dimmer:'#4a5568',
  green:'#3d9970', red:'#e05a5a', card:'#141e2e',
  border:'rgba(255,255,255,0.07)',
  borderAccent:'rgba(200,151,90,0.3)',
};

const CITIES = [
  { id:'alger',       label:'Alger',       emoji:'🏛️', region:{ latitude:36.7538, longitude:3.0588,  latitudeDelta:0.13, longitudeDelta:0.13 } },
  { id:'oran',        label:'Oran',        emoji:'🌊', region:{ latitude:35.6969, longitude:-0.6331, latitudeDelta:0.13, longitudeDelta:0.13 } },
  { id:'constantine', label:'Constantine', emoji:'🌉', region:{ latitude:36.3650, longitude:6.6147,  latitudeDelta:0.13, longitudeDelta:0.13 } },
];

const CUISINE_EMOJI = {
  algerien:'🥘', mediterraneen:'🐟', fast_casual:'☕',
  italien:'🍕', japonais:'🍣', turc:'🍢', libanais:'🌿', francais:'🍷', autre:'🍽️',
};

const SORT_OPTIONS = [
  { id:'rating', label:'Mieux notés' },
  { id:'price_asc', label:'Prix ↑' },
  { id:'price_desc', label:'Prix ↓' },
];

const QUARTIER_COORDS = {
  'hydra':{ latitude:36.7539, longitude:3.0427 },
  'bab el oued':{ latitude:36.7900, longitude:3.0573 },
  'el biar':{ latitude:36.7614, longitude:3.0364 },
  'centre':{ latitude:36.7625, longitude:3.0521 },
  'ben aknoun':{ latitude:36.7611, longitude:3.0157 },
  'bir mourad raïs':{ latitude:36.7381, longitude:3.0521 },
  'chéraga':{ latitude:36.7669, longitude:2.9605 },
  'dely ibrahim':{ latitude:36.7608, longitude:2.9843 },
  'sidi fredj':{ latitude:36.7760, longitude:2.9102 },
  'pins maritimes':{ latitude:36.7522, longitude:3.0980 },
  'casbah':{ latitude:36.7866, longitude:3.0601 },
  'centre-ville':{ latitude:35.6973, longitude:-0.6342 },
  'les falaises':{ latitude:35.7273, longitude:-0.6462 },
  'bir el djir':{ latitude:35.6889, longitude:-0.5882 },
  'la corniche':{ latitude:35.7384, longitude:-0.6718 },
  'sidi el houari':{ latitude:35.7094, longitude:-0.6531 },
  'eckmuhl':{ latitude:35.6923, longitude:-0.6291 },
  'médina jedida':{ latitude:35.7065, longitude:-0.6422 },
  'le plateau':{ latitude:35.7012, longitude:-0.6178 },
  'aïn turk':{ latitude:35.7582, longitude:-0.7685 },
  "sidi m'cid":{ latitude:36.3800, longitude:6.6100 },
  'médina':{ latitude:36.3700, longitude:6.6050 },
  'mansourah':{ latitude:36.3500, longitude:6.5950 },
  'faubourg lamy':{ latitude:36.3620, longitude:6.6200 },
  'el kantara':{ latitude:36.3450, longitude:6.6000 },
  'daksi':{ latitude:36.3750, longitude:6.6400 },
  'zouaghi':{ latitude:36.3300, longitude:6.5800 },
};

function getCoord(r, cityDefault) {
  const key  = (r.quartier || '').toLowerCase();
  const base = QUARTIER_COORDS[key] || cityDefault;
  const seed = typeof r.id === 'string'
    ? r.id.charCodeAt(0) + r.id.charCodeAt(r.id.length - 1)
    : (r.id || 0);
  return {
    latitude:  base.latitude  + (((seed * 7919) % 1000) / 1000 - 0.5) * 0.006,
    longitude: base.longitude + (((seed * 6271) % 1000) / 1000 - 0.5) * 0.006,
  };
}

function RestoThumb({ url, size = 44, radius = 12 }) {
  if (url) return <Image source={{ uri: url }} style={{ width: size, height: size, borderRadius: radius }} resizeMode="cover" />;
  return (
    <View style={{ width: size, height: size, borderRadius: radius, backgroundColor: C.bg3, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: size * 0.45 }}>🍽️</Text>
    </View>
  );
}

function RatingStars({ value }) {
  const v = Number(value || 0);
  return <Text style={{ color: '#f0c040', fontSize: 10 }}>{'★'.repeat(Math.round(v))}</Text>;
}

/* ─── Pin carte ─── */
function RestaurantPin({ restaurant, isSelected }) {
  return (
    <View style={[p.wrap, isSelected && p.wrapOn]}>
      <Text style={[p.emoji, isSelected && p.emojiOn]}>
        {CUISINE_EMOJI[restaurant.cuisine_type] || '🍽️'}
      </Text>
      {restaurant.avg_rating > 0 && (
        <View style={[p.badge, isSelected && p.badgeOn]}>
          <Text style={[p.badgeTxt, isSelected && { color: C.bg }]}>
            {Number(restaurant.avg_rating).toFixed(1)}
          </Text>
        </View>
      )}
    </View>
  );
}

const p = StyleSheet.create({
  wrap:     { alignItems: 'center', gap: 2 },
  wrapOn:   {},
  emoji:    { fontSize: 22, lineHeight: 28 },
  emojiOn:  { fontSize: 28, lineHeight: 34 },
  badge:    { backgroundColor: 'rgba(13,22,40,0.88)', borderRadius: 8, paddingHorizontal: 5, paddingVertical: 2, borderWidth: 1, borderColor: C.borderAccent },
  badgeOn:  { backgroundColor: C.accent, borderColor: C.accent },
  badgeTxt: { color: C.accent, fontSize: 9, fontWeight: '600' },
});

/* ─── Écran principal ─── */
export default function ExplorerScreen({ navigation }) {
  const mapRef = useRef(null);

  const [city,       setCity]       = useState('alger');
  const [search,     setSearch]     = useState('');
  const [cuisine,    setCuisine]    = useState(null);
  const [sort,       setSort]       = useState('rating');
  const [mode,       setMode]       = useState('map');   // 'map' | 'list'
  const [restaurants,setRestaurants]= useState([]);
  const [loading,    setLoading]    = useState(false);
  const [selected,   setSelected]   = useState(null);

  const cityData    = CITIES.find(c => c.id === city) || CITIES[0];
  const cityDefault = { latitude: cityData.region.latitude, longitude: cityData.region.longitude };

  useEffect(() => {
    setLoading(true);
    setSelected(null);
    setCuisine(null);
    supabase
      .from('restaurants')
      .select('id, name, cuisine_type, address, quartier, city, photo_url, avg_rating, avg_ticket, review_count, capacity')
      .eq('city', city)
      .eq('status', 'active')
      .order('avg_rating', { ascending: false })
      .then(({ data }) => { setRestaurants(data ?? []); setLoading(false); });
  }, [city]);

  const changeCity = (c) => {
    setCity(c);
    const r = CITIES.find(x => x.id === c)?.region;
    if (r) mapRef.current?.animateToRegion(r, 400);
  };

  const handleMarker = (r) => {
    const same = selected?.id === r.id;
    setSelected(same ? null : r);
    if (!same) {
      mapRef.current?.animateToRegion(
        { ...getCoord(r, cityDefault), latitudeDelta: 0.025, longitudeDelta: 0.025 },
        350,
      );
    }
  };

  /* Cuisine types disponibles */
  const cuisineTypes = [...new Set(restaurants.map(r => r.cuisine_type).filter(Boolean))];

  /* Filtrage + tri */
  const filtered = restaurants
    .filter(r => {
      if (cuisine && r.cuisine_type !== cuisine) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return (r.name || '').toLowerCase().includes(q)
        || (r.quartier || '').toLowerCase().includes(q)
        || (r.cuisine_type || '').toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (sort === 'rating')     return (b.avg_rating || 0) - (a.avg_rating || 0);
      if (sort === 'price_asc')  return (a.avg_ticket || 0) - (b.avg_ticket || 0);
      if (sort === 'price_desc') return (b.avg_ticket || 0) - (a.avg_ticket || 0);
      return 0;
    });

  return (
    <View style={s.root}>

      {/* ── CARTE + FICHE (mode map) ── */}
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
            {filtered.map(r => (
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
              {selected.photo_url
                ? <Image source={{ uri: selected.photo_url }} style={s.selPhoto} resizeMode="cover" />
                : <View style={[s.selPhoto, { backgroundColor: C.bg3, alignItems: 'center', justifyContent: 'center' }]}><Text style={{ fontSize: 30 }}>🍽️</Text></View>
              }
              <View style={s.selBody}>
                <Text style={s.selCuisine}>{(selected.cuisine_type || '').toUpperCase().replace(/_/g,' ')}</Text>
                <Text style={s.selName} numberOfLines={1}>{selected.name}</Text>
                <Text style={s.selAddr} numberOfLines={1}>📍 {selected.quartier || selected.address || ''}</Text>
                <View style={s.selStats}>
                  {selected.avg_rating > 0 && <Text style={s.selRating}>★ {Number(selected.avg_rating).toFixed(1)}</Text>}
                  {selected.avg_ticket > 0 && <Text style={s.selPrice}>{selected.avg_ticket.toLocaleString('fr-FR')} DA</Text>}
                </View>
              </View>
              <View style={s.selActions}>
                <TouchableOpacity style={s.selBtnPrimary} onPress={() => navigation.navigate('ReservationForm', { restaurant: selected })}>
                  <Text style={s.selBtnPrimaryTxt}>Réserver</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.selBtnSecondary} onPress={() => navigation.navigate('Restaurant', { restaurant: selected })}>
                  <Text style={s.selBtnSecondaryTxt}>Voir →</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={s.selClose} onPress={() => setSelected(null)}>
                <Text style={s.selCloseTxt}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* ── HEADER OVERLAY ── */}
      <SafeAreaView style={s.overlay} pointerEvents="box-none">
        <View style={s.header}>
          <View>
            <Text style={s.headerLogo}>MIDA</Text>
            <Text style={s.headerSub}>Explorer</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <View style={s.countBadge}>
              <View style={s.countDot} />
              <Text style={s.countTxt}>{loading ? '…' : `${filtered.length} restaurants`}</Text>
            </View>
            <TouchableOpacity style={s.modeBtn} onPress={() => { setMode(m => m === 'map' ? 'list' : 'map'); setSelected(null); }}>
              <Text style={s.modeBtnTxt}>{mode === 'map' ? '☰' : '🗺️'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      {/* ── FEUILLE BASSE / LISTE PLEIN ÉCRAN ── */}
      <View style={[s.sheet, mode === 'list' && s.sheetFull]}>
        {mode === 'map' && <View style={s.sheetHandle} />}

        {/* City chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipRow}>
          {CITIES.map(c => (
            <TouchableOpacity key={c.id} style={[s.cityChip, city === c.id && s.cityChipOn]} onPress={() => changeCity(c.id)}>
              <Text style={s.cityEmoji}>{c.emoji}</Text>
              <Text style={[s.cityTxt, city === c.id && s.cityTxtOn]}>{c.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Search + sort */}
        <View style={s.searchRow}>
          <View style={s.searchBar}>
            <Text style={s.searchIcon}>🔍</Text>
            <TextInput
              style={s.searchInput}
              placeholder="Restaurant, quartier, cuisine…"
              placeholderTextColor={C.dimmer}
              value={search}
              onChangeText={setSearch}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Text style={{ color: C.dimmer, fontSize: 13 }}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            style={s.sortBtn}
            onPress={() => setSort(s => {
              const idx = SORT_OPTIONS.findIndex(o => o.id === s);
              return SORT_OPTIONS[(idx + 1) % SORT_OPTIONS.length].id;
            })}
          >
            <Text style={s.sortTxt}>{SORT_OPTIONS.find(o => o.id === sort)?.label}</Text>
          </TouchableOpacity>
        </View>

        {/* Cuisine filters */}
        {cuisineTypes.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipRow}>
            <TouchableOpacity style={[s.cuisineChip, !cuisine && s.cuisineChipOn]} onPress={() => setCuisine(null)}>
              <Text style={[s.cuisineTxt, !cuisine && s.cuisineTxtOn]}>Tous</Text>
            </TouchableOpacity>
            {cuisineTypes.map(ct => (
              <TouchableOpacity key={ct} style={[s.cuisineChip, cuisine === ct && s.cuisineChipOn]} onPress={() => setCuisine(cuisine === ct ? null : ct)}>
                <Text style={s.cuisineEmoji}>{CUISINE_EMOJI[ct] || '🍽️'}</Text>
                <Text style={[s.cuisineTxt, cuisine === ct && s.cuisineTxtOn]}>{ct.replace(/_/g,' ')}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Liste */}
        {loading ? (
          <View style={s.empty}><ActivityIndicator color={C.accent} size="large" /></View>
        ) : filtered.length === 0 ? (
          <View style={s.empty}>
            <Text style={{ fontSize: 36 }}>🔍</Text>
            <Text style={s.emptyTxt}>Aucun restaurant trouvé</Text>
            <TouchableOpacity onPress={() => { setSearch(''); setCuisine(null); }}>
              <Text style={{ color: C.accent2, fontSize: 13, marginTop: 6 }}>Effacer les filtres</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
            {filtered.map((r, idx) => (
              <TouchableOpacity
                key={String(r.id)}
                style={[s.item, selected?.id === r.id && s.itemActive, idx === 0 && s.itemFirst]}
                onPress={() => {
                  navigation.navigate('Restaurant', { restaurant: r });
                }}
                onLongPress={() => mode === 'map' && handleMarker(r)}
              >
                {/* Rank badge */}
                {sort === 'rating' && idx < 3 && (
                  <View style={[s.rankBadge, idx === 0 && { backgroundColor: '#f0c040' }, idx === 1 && { backgroundColor: '#aaa' }, idx === 2 && { backgroundColor: '#cd7f32' }]}>
                    <Text style={s.rankTxt}>{idx + 1}</Text>
                  </View>
                )}
                <RestoThumb url={r.photo_url} size={58} radius={14} />
                <View style={s.itemBody}>
                  <View style={s.itemTop}>
                    <Text style={s.itemName} numberOfLines={1}>{r.name}</Text>
                    {r.avg_rating > 0 && (
                      <View style={s.ratingPill}>
                        <Text style={s.ratingPillTxt}>★ {Number(r.avg_rating).toFixed(1)}</Text>
                      </View>
                    )}
                  </View>
                  <View style={s.itemMidRow}>
                    <View style={s.cuisineTag}>
                      <Text style={s.cuisineTagTxt}>{CUISINE_EMOJI[r.cuisine_type] || '🍽️'} {(r.cuisine_type || '').replace(/_/g,' ')}</Text>
                    </View>
                    {r.quartier && <Text style={s.itemQuartier}>· {r.quartier}</Text>}
                  </View>
                  <View style={s.itemBottom}>
                    {r.avg_ticket > 0 && <Text style={s.itemPrice}>{r.avg_ticket.toLocaleString('fr-FR')} DA</Text>}
                    {r.review_count > 0 && <Text style={s.itemReviews}>{r.review_count} avis</Text>}
                  </View>
                </View>
                <TouchableOpacity style={s.itemReserveBtn} onPress={() => navigation.navigate('ReservationForm', { restaurant: r })}>
                  <Text style={s.itemReserveTxt}>Réserver</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
            <View style={{ height: 60 }} />
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: C.bg },
  mapWrap: { flex: 46 },
  map:     { ...StyleSheet.absoluteFillObject },

  /* Header overlay */
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  header:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', margin: 14, marginTop: TOP + 10, backgroundColor: 'rgba(13,22,40,0.9)', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 11, borderWidth: 1, borderColor: C.border },
  headerLogo: { color: C.accent, fontSize: 14, fontWeight: '700', letterSpacing: 5 },
  headerSub:  { color: C.dim, fontSize: 10 },
  countBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(200,151,90,0.12)', borderRadius: 100, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: C.borderAccent },
  countDot:   { width: 6, height: 6, borderRadius: 3, backgroundColor: C.green },
  countTxt:   { color: C.accent, fontSize: 11, fontWeight: '500' },
  modeBtn:    { width: 36, height: 36, borderRadius: 18, backgroundColor: C.bg3, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  modeBtnTxt: { fontSize: 16 },

  /* Selected card */
  selCard:    { position: 'absolute', bottom: 8, left: 14, right: 14, backgroundColor: C.bg2, borderRadius: 18, borderWidth: 1, borderColor: C.borderAccent, zIndex: 5 },
  selPhoto:   { width: '100%', height: 110, borderTopLeftRadius: 17, borderTopRightRadius: 17 },
  selBody:    { padding: 12, paddingBottom: 8 },
  selCuisine: { color: C.accent, fontSize: 8, letterSpacing: 2.5, marginBottom: 3 },
  selName:    { color: C.text, fontSize: 16, fontWeight: '300', letterSpacing: 0.3, marginBottom: 2 },
  selAddr:    { color: C.dim, fontSize: 11, marginBottom: 6 },
  selStats:   { flexDirection: 'row', gap: 10 },
  selRating:  { color: C.accent, fontSize: 12, fontWeight: '500' },
  selPrice:   { color: C.dimmer, fontSize: 12 },
  selActions: { flexDirection: 'row', gap: 8, paddingHorizontal: 12, paddingBottom: 12 },
  selBtnPrimary:    { flex: 1, backgroundColor: C.accent, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  selBtnPrimaryTxt: { color: C.bg, fontSize: 13, fontWeight: '500' },
  selBtnSecondary:  { flex: 1, borderRadius: 10, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  selBtnSecondaryTxt:{ color: C.text, fontSize: 13 },
  selClose:   { position: 'absolute', top: 10, right: 10, width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(13,22,40,0.7)', alignItems: 'center', justifyContent: 'center' },
  selCloseTxt:{ color: C.text, fontSize: 12 },

  /* Sheet */
  sheet:      { flex: 54, backgroundColor: C.bg2, borderTopLeftRadius: 22, borderTopRightRadius: 22, borderWidth: 1, borderColor: C.border, paddingTop: 10 },
  sheetFull:  { flex: 1, borderRadius: 0, borderTopWidth: 1, marginTop: TOP + 62 },
  sheetHandle:{ width: 40, height: 4, backgroundColor: C.dimmer, borderRadius: 2, alignSelf: 'center', marginBottom: 10, opacity: 0.4 },

  /* Chips rows */
  chipRow:    { paddingHorizontal: 14, paddingVertical: 8, gap: 8 },

  /* City chips */
  cityChip:   { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 100, backgroundColor: C.bg3, borderWidth: 1, borderColor: C.border },
  cityChipOn: { backgroundColor: C.accent, borderColor: C.accent },
  cityEmoji:  { fontSize: 13 },
  cityTxt:    { color: C.dim, fontSize: 12 },
  cityTxtOn:  { color: C.bg, fontWeight: '600' },

  /* Search row */
  searchRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, marginBottom: 4 },
  searchBar:  { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: C.bg3, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: C.border, gap: 8 },
  searchIcon: { fontSize: 13 },
  searchInput:{ flex: 1, color: C.text, fontSize: 13 },
  sortBtn:    { backgroundColor: C.bg3, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 9, borderWidth: 1, borderColor: C.border },
  sortTxt:    { color: C.accent, fontSize: 10, fontWeight: '500' },

  /* Cuisine filter chips */
  cuisineChip:   { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100, backgroundColor: C.bg3, borderWidth: 1, borderColor: C.border },
  cuisineChipOn: { backgroundColor: 'rgba(200,151,90,0.15)', borderColor: C.accent },
  cuisineEmoji:  { fontSize: 12 },
  cuisineTxt:    { color: C.dim, fontSize: 11 },
  cuisineTxtOn:  { color: C.accent },

  /* List items */
  item:       { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  itemFirst:  {},
  itemActive: { backgroundColor: 'rgba(200,151,90,0.05)' },
  rankBadge:  { position: 'absolute', left: 14, top: 12, width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  rankTxt:    { color: C.bg, fontSize: 9, fontWeight: '700' },
  itemBody:   { flex: 1, gap: 4 },
  itemTop:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 },
  itemName:   { color: C.text, fontSize: 14, fontWeight: '300', flex: 1 },
  ratingPill: { backgroundColor: 'rgba(200,151,90,0.12)', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: 'rgba(200,151,90,0.25)' },
  ratingPillTxt: { color: C.accent, fontSize: 10, fontWeight: '500' },
  itemMidRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cuisineTag: { backgroundColor: C.bg3, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  cuisineTagTxt: { color: C.dim, fontSize: 10 },
  itemQuartier: { color: C.dimmer, fontSize: 10 },
  itemBottom: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  itemPrice:  { color: C.dim, fontSize: 11 },
  itemReviews:{ color: C.dimmer, fontSize: 10 },
  itemReserveBtn: { backgroundColor: 'rgba(200,151,90,0.12)', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7, borderWidth: 1, borderColor: C.borderAccent },
  itemReserveTxt: { color: C.accent, fontSize: 11, fontWeight: '400' },

  /* Empty */
  empty:      { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 30 },
  emptyTxt:   { color: C.dim, fontSize: 14 },
});
