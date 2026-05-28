import { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, SafeAreaView, ActivityIndicator, Dimensions,
  Image, Platform, StatusBar as RNStatusBar, FlatList,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { supabase } from '../supabase';

const SW = Dimensions.get('window').width;
const SH = Dimensions.get('window').height;
const TOP = Platform.OS === 'android' ? (RNStatusBar.currentHeight || 0) : 0;
const CARD_W = (SW - 14 * 2 - 10) / 2;

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
  { id:'tizi_ouzou',  label:'Tizi Ouzou',  emoji:'⛰️', region:{ latitude:36.7117, longitude:4.0450,  latitudeDelta:0.13, longitudeDelta:0.13 } },
  { id:'bejaia',      label:'Béjaïa',      emoji:'🌅', region:{ latitude:36.7509, longitude:5.0564,  latitudeDelta:0.13, longitudeDelta:0.13 } },
  { id:'setif',       label:'Sétif',       emoji:'🌾', region:{ latitude:36.1898, longitude:5.4108,  latitudeDelta:0.13, longitudeDelta:0.13 } },
  { id:'annaba',      label:'Annaba',      emoji:'🌺', region:{ latitude:36.9000, longitude:7.7667,  latitudeDelta:0.13, longitudeDelta:0.13 } },
  { id:'tlemcen',     label:'Tlemcen',     emoji:'🕌', region:{ latitude:34.8828, longitude:-1.3167, latitudeDelta:0.13, longitudeDelta:0.13 } },
];

const CUISINE_EMOJI = {
  algerien:'🥘', mediterraneen:'🐟', fast_casual:'☕',
  italien:'🍕', japonais:'🍣', turc:'🍢', libanais:'🌿', francais:'🍷', autre:'🍽️',
};

const SORT_OPTIONS = [
  { id:'rating',     label:'Mieux notés',  icon:'★' },
  { id:'price_asc',  label:'Prix croissant', icon:'↑' },
  { id:'price_desc', label:'Prix décroissant',icon:'↓' },
];

const BUDGET_OPTIONS = [
  { id:'all',   label:'Tous les budgets' },
  { id:'low',   label:'< 1 000 DA',   max:1000 },
  { id:'mid',   label:'1 000 – 2 500 DA', min:1000, max:2500 },
  { id:'high',  label:'> 2 500 DA',   min:2500 },
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

/* ─── Pin carte ─── */
function RestaurantPin({ restaurant, isSelected }) {
  return (
    <View style={[pin.wrap, isSelected && pin.wrapOn]}>
      <Text style={[pin.emoji, isSelected && pin.emojiOn]}>
        {CUISINE_EMOJI[restaurant.cuisine_type] || '🍽️'}
      </Text>
      {restaurant.avg_rating > 0 && (
        <View style={[pin.badge, isSelected && pin.badgeOn]}>
          <Text style={[pin.badgeTxt, isSelected && { color: C.bg }]}>
            {Number(restaurant.avg_rating).toFixed(1)}
          </Text>
        </View>
      )}
    </View>
  );
}

const pin = StyleSheet.create({
  wrap:    { alignItems:'center', gap:2 },
  emoji:   { fontSize:22, lineHeight:28 },
  emojiOn: { fontSize:28, lineHeight:34 },
  badge:   { backgroundColor:'rgba(13,22,40,0.88)', borderRadius:8, paddingHorizontal:5, paddingVertical:2, borderWidth:1, borderColor:C.borderAccent },
  badgeOn: { backgroundColor:C.accent, borderColor:C.accent },
  badgeTxt:{ color:C.accent, fontSize:9, fontWeight:'600' },
});

/* ─── Carte restaurant (mode liste) ─── */
function RestoCard({ r, rank, onPress, onReserve }) {
  return (
    <TouchableOpacity style={lc.card} onPress={onPress} activeOpacity={0.88}>
      <View style={lc.imgWrap}>
        {r.photos?.[0]
          ? <Image source={{ uri: r.photos[0] }} style={lc.img} resizeMode="cover" />
          : <View style={[lc.img, lc.imgPlaceholder]}><Text style={{ fontSize: 30 }}>🍽️</Text></View>
        }
        {/* Rating badge */}
        {r.avg_rating > 0 && (
          <View style={lc.ratingBadge}>
            <Text style={lc.ratingBadgeTxt}>★ {Number(r.avg_rating).toFixed(1)}</Text>
          </View>
        )}
        {/* Rank medal */}
        {rank != null && rank < 3 && (
          <View style={[lc.medalWrap, rank === 0 && { backgroundColor:'#f0c040' }, rank === 1 && { backgroundColor:'#b0b0b0' }, rank === 2 && { backgroundColor:'#cd7f32' }]}>
            <Text style={lc.medalTxt}>{rank + 1}</Text>
          </View>
        )}
        {/* Cuisine pill */}
        <View style={lc.cuisinePill}>
          <Text style={lc.cuisinePillTxt}>
            {CUISINE_EMOJI[r.cuisine_type] || '🍽️'} {(r.cuisine_type || '').replace(/_/g,' ')}
          </Text>
        </View>
      </View>

      <View style={lc.body}>
        <Text style={lc.name} numberOfLines={1}>{r.name}</Text>
        {r.quartier && <Text style={lc.quartier} numberOfLines={1}>📍 {r.quartier}</Text>}
        <View style={lc.footer}>
          <View>
            {r.avg_ticket > 0 && <Text style={lc.price}>{r.avg_ticket.toLocaleString('fr-FR')} DA</Text>}
            {r.review_count > 0 && <Text style={lc.reviews}>{r.review_count} avis</Text>}
          </View>
          <TouchableOpacity style={lc.reserveBtn} onPress={onReserve}>
            <Text style={lc.reserveTxt}>Réserver</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const lc = StyleSheet.create({
  card:        { width: CARD_W, backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.border, overflow:'hidden', marginBottom: 10 },
  imgWrap:     { position:'relative', width:'100%', height: 130 },
  img:         { width:'100%', height:'100%' },
  imgPlaceholder:{ backgroundColor: C.bg3, alignItems:'center', justifyContent:'center' },
  ratingBadge: { position:'absolute', top:8, right:8, backgroundColor:'rgba(13,22,40,0.82)', borderRadius:10, paddingHorizontal:7, paddingVertical:3, borderWidth:1, borderColor:C.borderAccent },
  ratingBadgeTxt:{ color:C.accent, fontSize:10, fontWeight:'600' },
  medalWrap:   { position:'absolute', top:8, left:8, width:22, height:22, borderRadius:11, alignItems:'center', justifyContent:'center' },
  medalTxt:    { color:C.bg, fontSize:10, fontWeight:'700' },
  cuisinePill: { position:'absolute', bottom:8, left:8, backgroundColor:'rgba(13,22,40,0.78)', borderRadius:8, paddingHorizontal:7, paddingVertical:3 },
  cuisinePillTxt:{ color:C.text, fontSize:9 },
  body:        { padding:10, gap:4 },
  name:        { color:C.text, fontSize:13, fontWeight:'400', letterSpacing:0.2 },
  quartier:    { color:C.dim, fontSize:10 },
  footer:      { flexDirection:'row', justifyContent:'space-between', alignItems:'flex-end', marginTop:4 },
  price:       { color:C.accent, fontSize:10, fontWeight:'500' },
  reviews:     { color:C.dimmer, fontSize:9, marginTop:1 },
  reserveBtn:  { backgroundColor:'rgba(200,151,90,0.15)', borderRadius:8, paddingHorizontal:8, paddingVertical:5, borderWidth:1, borderColor:C.borderAccent },
  reserveTxt:  { color:C.accent, fontSize:10, fontWeight:'500' },
});

/* ─── Panel filtres ─── */
function FilterPanel({ sort, setSort, budget, setBudget, onClose, onClear }) {
  return (
    <View style={fp.panel}>
      <View style={fp.topRow}>
        <Text style={fp.title}>Filtres & Tri</Text>
        <TouchableOpacity onPress={onClear}>
          <Text style={fp.clearTxt}>Tout effacer</Text>
        </TouchableOpacity>
      </View>

      <Text style={fp.sectionLabel}>TRIER PAR</Text>
      <View style={fp.optRow}>
        {SORT_OPTIONS.map(o => (
          <TouchableOpacity
            key={o.id}
            style={[fp.opt, sort === o.id && fp.optOn]}
            onPress={() => setSort(o.id)}
          >
            <Text style={fp.optIcon}>{o.icon}</Text>
            <Text style={[fp.optTxt, sort === o.id && fp.optTxtOn]}>{o.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={fp.sectionLabel}>BUDGET MOYEN</Text>
      <View style={fp.optRow}>
        {BUDGET_OPTIONS.map(o => (
          <TouchableOpacity
            key={o.id}
            style={[fp.opt, budget === o.id && fp.optOn]}
            onPress={() => setBudget(o.id)}
          >
            <Text style={[fp.optTxt, budget === o.id && fp.optTxtOn]}>{o.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={fp.applyBtn} onPress={onClose}>
        <Text style={fp.applyTxt}>Appliquer</Text>
      </TouchableOpacity>
    </View>
  );
}

const fp = StyleSheet.create({
  panel:       { backgroundColor: C.bg2, borderTopLeftRadius:22, borderTopRightRadius:22, borderTopWidth:1, borderColor:C.border, padding:20, paddingBottom:32, gap:12 },
  topRow:      { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:4 },
  title:       { color:C.text, fontSize:16, fontWeight:'300', letterSpacing:0.4 },
  clearTxt:    { color:C.accent2, fontSize:12 },
  sectionLabel:{ color:C.dimmer, fontSize:10, letterSpacing:2, marginTop:4 },
  optRow:      { flexDirection:'row', flexWrap:'wrap', gap:8 },
  opt:         { paddingHorizontal:12, paddingVertical:8, borderRadius:10, backgroundColor:C.bg3, borderWidth:1, borderColor:C.border, flexDirection:'row', alignItems:'center', gap:5 },
  optOn:       { backgroundColor:'rgba(200,151,90,0.15)', borderColor:C.accent },
  optIcon:     { color:C.dim, fontSize:11 },
  optTxt:      { color:C.dim, fontSize:11 },
  optTxtOn:    { color:C.accent },
  applyBtn:    { backgroundColor:C.accent, borderRadius:12, paddingVertical:13, alignItems:'center', marginTop:8 },
  applyTxt:    { color:C.bg, fontSize:14, fontWeight:'500', letterSpacing:0.3 },
});

/* ─── Chips filtres actifs ─── */
function ActiveFilters({ sort, budget, cuisine, setSort, setBudget, setCuisine }) {
  const chips = [];
  if (sort !== 'rating') {
    const o = SORT_OPTIONS.find(x => x.id === sort);
    if (o) chips.push({ key:'sort', label: o.icon + ' ' + o.label, clear: () => setSort('rating') });
  }
  if (budget !== 'all') {
    const o = BUDGET_OPTIONS.find(x => x.id === budget);
    if (o) chips.push({ key:'budget', label: o.label, clear: () => setBudget('all') });
  }
  if (cuisine) {
    chips.push({ key:'cuisine', label: (CUISINE_EMOJI[cuisine] || '') + ' ' + cuisine.replace(/_/g,' '), clear: () => setCuisine(null) });
  }
  if (chips.length === 0) return null;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal:14, paddingBottom:6, gap:6 }}>
      {chips.map(c => (
        <TouchableOpacity key={c.key} style={af.chip} onPress={c.clear}>
          <Text style={af.chipTxt}>{c.label}</Text>
          <Text style={af.chipX}>✕</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const af = StyleSheet.create({
  chip:    { flexDirection:'row', alignItems:'center', gap:5, paddingHorizontal:10, paddingVertical:5, borderRadius:100, backgroundColor:'rgba(200,151,90,0.15)', borderWidth:1, borderColor:C.accent },
  chipTxt: { color:C.accent, fontSize:11 },
  chipX:   { color:C.accent, fontSize:9, opacity:0.7 },
});

/* ─── Écran principal ─── */
export default function ExplorerScreen({ navigation }) {
  const mapRef = useRef(null);

  const [city,        setCity]        = useState('alger');
  const [search,      setSearch]      = useState('');
  const [cuisine,     setCuisine]     = useState(null);
  const [sort,        setSort]        = useState('rating');
  const [budget,      setBudget]      = useState('all');
  const [mode,        setMode]        = useState('map');
  const [showFilters, setShowFilters] = useState(false);
  const [restaurants, setRestaurants] = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [selected,    setSelected]    = useState(null);

  const cityData    = CITIES.find(c => c.id === city) || CITIES[0];
  const cityDefault = { latitude: cityData.region.latitude, longitude: cityData.region.longitude };

  useEffect(() => {
    setLoading(true);
    setSelected(null);
    setCuisine(null);
    supabase
      .from('restaurants')
      .select('id, name, cuisine_type, address, quartier, city, photos, avg_rating, avg_ticket, review_count, capacity')
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

  const cuisineTypes = [...new Set(restaurants.map(r => r.cuisine_type).filter(Boolean))];

  const budgetData = BUDGET_OPTIONS.find(o => o.id === budget);

  const filtered = restaurants
    .filter(r => {
      if (cuisine && r.cuisine_type !== cuisine) return false;
      if (budget !== 'all') {
        const t = r.avg_ticket || 0;
        if (budgetData.min != null && t < budgetData.min) return false;
        if (budgetData.max != null && t > budgetData.max) return false;
      }
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

  const hasActiveFilters = sort !== 'rating' || budget !== 'all' || !!cuisine;

  return (
    <View style={s.root}>

      {/* ── CARTE (mode map) ── */}
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

          {/* Fiche restaurant sélectionné */}
          {selected && (
            <View style={s.selCard}>
              {selected.photos?.[0]
                ? <Image source={{ uri: selected.photos[0] }} style={s.selPhoto} resizeMode="cover" />
                : <View style={[s.selPhoto, { backgroundColor:C.bg3, alignItems:'center', justifyContent:'center' }]}><Text style={{ fontSize:28 }}>🍽️</Text></View>
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
                <TouchableOpacity style={s.selBtnPrimary} onPress={() => navigation.navigate('ReservationForm', { restaurant: selected })}>
                  <Text style={s.selBtnPrimaryTxt}>Réserver</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.selBtnSecondary} onPress={() => navigation.navigate('Restaurant', { restaurant: selected })}>
                  <Text style={s.selBtnSecondaryTxt}>Voir le resto →</Text>
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
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <Text style={s.backBtnTxt}>←</Text>
          </TouchableOpacity>
          <View>
            <Text style={s.headerLogo}>MIDA</Text>
            <Text style={s.headerSub}>Explorer</Text>
          </View>
          <View style={{ flexDirection:'row', gap:8, alignItems:'center' }}>
            {!loading && (
              <View style={s.countBadge}>
                <View style={s.countDot} />
                <Text style={s.countTxt}>{filtered.length} restos</Text>
              </View>
            )}
            <TouchableOpacity
              style={[s.modeBtn, mode === 'list' && s.modeBtnOn]}
              onPress={() => { setMode(m => m === 'map' ? 'list' : 'map'); setSelected(null); }}
            >
              <Text style={s.modeBtnTxt}>{mode === 'map' ? '☰' : '🗺️'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      {/* ── FEUILLE BASSE ── */}
      <View style={[s.sheet, mode === 'list' && s.sheetFull]}>
        {mode === 'map' && <View style={s.sheetHandle} />}

        {/* Sélecteur de ville */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipRow}>
          {CITIES.map(c => (
            <TouchableOpacity key={c.id} style={[s.cityChip, city === c.id && s.cityChipOn]} onPress={() => changeCity(c.id)}>
              <Text style={s.cityEmoji}>{c.emoji}</Text>
              <Text style={[s.cityTxt, city === c.id && s.cityTxtOn]}>{c.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Barre de recherche */}
        <View style={s.searchRow}>
          <View style={s.searchBar}>
            <Text style={s.searchIcon}>🔍</Text>
            <TextInput
              style={s.searchInput}
              placeholder="Restaurant, quartier, cuisine…"
              placeholderTextColor={C.dimmer}
              value={search}
              onChangeText={setSearch}
              returnKeyType="search"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top:8, bottom:8, left:8, right:8 }}>
                <Text style={{ color:C.dimmer, fontSize:12 }}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            style={[s.filterBtn, hasActiveFilters && s.filterBtnOn]}
            onPress={() => setShowFilters(v => !v)}
          >
            <Text style={s.filterIcon}>⚙</Text>
            <Text style={[s.filterTxt, hasActiveFilters && { color:C.accent }]}>
              {hasActiveFilters ? 'Actifs' : 'Filtres'}
            </Text>
            {hasActiveFilters && <View style={s.filterDot} />}
          </TouchableOpacity>
        </View>

        {/* Filtres actifs */}
        <ActiveFilters sort={sort} budget={budget} cuisine={cuisine} setSort={setSort} setBudget={setBudget} setCuisine={setCuisine} />

        {/* Panel filtres dépliable */}
        {showFilters && (
          <FilterPanel
            sort={sort} setSort={setSort}
            budget={budget} setBudget={setBudget}
            onClose={() => setShowFilters(false)}
            onClear={() => { setSort('rating'); setBudget('all'); setCuisine(null); setShowFilters(false); }}
          />
        )}

        {/* Chips cuisine (masqués si panel filtres ouvert) */}
        {!showFilters && cuisineTypes.length > 0 && (
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

        {/* Contenu liste */}
        {!showFilters && (
          loading ? (
            <View style={s.empty}><ActivityIndicator color={C.accent} size="large" /></View>
          ) : filtered.length === 0 ? (
            <View style={s.empty}>
              <Text style={{ fontSize: 36 }}>🔍</Text>
              <Text style={s.emptyTitle}>Aucun restaurant trouvé</Text>
              <Text style={s.emptyDesc}>Essayez d'autres filtres ou une autre ville.</Text>
              <TouchableOpacity style={s.emptyBtn} onPress={() => { setSearch(''); setCuisine(null); setBudget('all'); setSort('rating'); }}>
                <Text style={s.emptyBtnTxt}>Effacer tous les filtres</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={r => String(r.id)}
              numColumns={2}
              columnWrapperStyle={s.gridRow}
              contentContainerStyle={s.gridContent}
              showsVerticalScrollIndicator={false}
              renderItem={({ item: r, index }) => (
                <RestoCard
                  r={r}
                  rank={sort === 'rating' ? index : null}
                  onPress={() => navigation.navigate('Restaurant', { restaurant: r })}
                  onReserve={() => navigation.navigate('ReservationForm', { restaurant: r })}
                />
              )}
              ListFooterComponent={<View style={{ height: 60 }} />}
            />
          )
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root:    { flex:1, backgroundColor:C.bg },
  mapWrap: { flex:46 },

  /* Header overlay */
  overlay:     { position:'absolute', top:0, left:0, right:0, zIndex:10 },
  header:      { flexDirection:'row', justifyContent:'space-between', alignItems:'center', margin:14, marginTop:TOP+10, backgroundColor:'rgba(13,22,40,0.92)', borderRadius:16, paddingHorizontal:16, paddingVertical:11, borderWidth:1, borderColor:C.border },
  headerLogo:  { color:C.accent, fontSize:14, fontWeight:'700', letterSpacing:5 },
  headerSub:   { color:C.dim, fontSize:10 },
  countBadge:  { flexDirection:'row', alignItems:'center', gap:5, backgroundColor:'rgba(200,151,90,0.1)', borderRadius:100, paddingHorizontal:10, paddingVertical:5, borderWidth:1, borderColor:C.borderAccent },
  countDot:    { width:6, height:6, borderRadius:3, backgroundColor:C.green },
  countTxt:    { color:C.accent, fontSize:11, fontWeight:'500' },
  modeBtn:     { width:36, height:36, borderRadius:18, backgroundColor:C.bg3, borderWidth:1, borderColor:C.border, alignItems:'center', justifyContent:'center' },
  modeBtnOn:   { backgroundColor:'rgba(200,151,90,0.15)', borderColor:C.borderAccent },
  modeBtnTxt:  { fontSize:16 },

  /* Selected card (map) */
  selCard:    { position:'absolute', bottom:8, left:14, right:14, backgroundColor:C.bg2, borderRadius:18, borderWidth:1, borderColor:C.borderAccent, overflow:'hidden', zIndex:5 },
  selPhoto:   { width:'100%', height:120 },
  selOverlay: { paddingHorizontal:14, paddingTop:10, paddingBottom:4 },
  selCuisine: { color:C.accent, fontSize:8, letterSpacing:2.5, marginBottom:3 },
  selName:    { color:C.text, fontSize:17, fontWeight:'300', letterSpacing:0.3, marginBottom:4 },
  selMeta:    { flexDirection:'row', flexWrap:'wrap', gap:6 },
  selRating:  { color:'#f0c040', fontSize:12, fontWeight:'500' },
  selAddr:    { color:C.dim, fontSize:12 },
  selPrice:   { color:C.dimmer, fontSize:12 },
  selActions: { flexDirection:'row', gap:8, paddingHorizontal:14, paddingVertical:12 },
  selBtnPrimary:    { flex:1, backgroundColor:C.accent, borderRadius:10, paddingVertical:11, alignItems:'center' },
  selBtnPrimaryTxt: { color:C.bg, fontSize:13, fontWeight:'500' },
  selBtnSecondary:  { flex:1, borderRadius:10, paddingVertical:11, alignItems:'center', borderWidth:1, borderColor:C.border },
  selBtnSecondaryTxt:{ color:C.text, fontSize:13 },
  selClose:   { position:'absolute', top:10, right:10, width:28, height:28, borderRadius:14, backgroundColor:'rgba(13,22,40,0.72)', alignItems:'center', justifyContent:'center' },
  selCloseTxt:{ color:C.text, fontSize:12 },

  /* Sheet */
  sheet:       { flex:54, backgroundColor:C.bg2, borderTopLeftRadius:22, borderTopRightRadius:22, borderWidth:1, borderColor:C.border, paddingTop:10 },
  sheetFull:   { flex:1, borderRadius:0, borderTopWidth:1, marginTop:TOP+62 },
  sheetHandle: { width:40, height:4, backgroundColor:C.dimmer, borderRadius:2, alignSelf:'center', marginBottom:10, opacity:0.4 },

  chipRow:     { paddingHorizontal:14, paddingVertical:8, gap:8 },

  cityChip:    { flexDirection:'row', alignItems:'center', gap:5, paddingHorizontal:14, paddingVertical:7, borderRadius:100, backgroundColor:C.bg3, borderWidth:1, borderColor:'rgba(255,255,255,0.18)' },
  cityChipOn:  { backgroundColor:C.accent, borderColor:C.accent },
  cityEmoji:   { fontSize:13 },
  cityTxt:     { color:C.text, fontSize:12 },
  cityTxtOn:   { color:C.bg, fontWeight:'600' },

  /* Search row */
  searchRow:   { flexDirection:'row', alignItems:'center', gap:8, paddingHorizontal:14, marginBottom:4 },
  searchBar:   { flex:1, flexDirection:'row', alignItems:'center', backgroundColor:C.bg3, borderRadius:12, paddingHorizontal:12, paddingVertical:10, borderWidth:1, borderColor:C.border, gap:8 },
  searchIcon:  { fontSize:13 },
  searchInput: { flex:1, color:C.text, fontSize:13 },
  filterBtn:   { flexDirection:'row', alignItems:'center', gap:4, backgroundColor:C.bg3, borderRadius:10, paddingHorizontal:10, paddingVertical:9, borderWidth:1, borderColor:'rgba(255,255,255,0.18)' },
  filterBtnOn: { borderColor:C.borderAccent, backgroundColor:'rgba(200,151,90,0.08)' },
  filterIcon:  { color:C.text, fontSize:12 },
  filterTxt:   { color:C.text, fontSize:10, fontWeight:'500' },
  filterDot:   { width:5, height:5, borderRadius:3, backgroundColor:C.accent, marginLeft:1 },

  /* Cuisine chips */
  cuisineChip:    { flexDirection:'row', alignItems:'center', gap:4, paddingHorizontal:12, paddingVertical:6, borderRadius:100, backgroundColor:C.bg3, borderWidth:1, borderColor:'rgba(255,255,255,0.18)' },
  cuisineChipOn:  { backgroundColor:'rgba(200,151,90,0.15)', borderColor:C.accent },
  cuisineEmoji:   { fontSize:12 },
  cuisineTxt:     { color:C.text, fontSize:11 },
  cuisineTxtOn:   { color:C.accent, fontWeight:'600' },

  backBtn:     { width:36, height:36, borderRadius:18, backgroundColor:C.bg3, borderWidth:1, borderColor:'rgba(255,255,255,0.18)', alignItems:'center', justifyContent:'center' },
  backBtnTxt:  { color:C.text, fontSize:18, lineHeight:22 },

  /* Grid */
  gridRow:     { paddingHorizontal:14, justifyContent:'space-between' },
  gridContent: { paddingTop:6 },

  /* Empty state */
  empty:       { flex:1, alignItems:'center', justifyContent:'center', gap:8, padding:30 },
  emptyTitle:  { color:C.text, fontSize:16, fontWeight:'300' },
  emptyDesc:   { color:C.dim, fontSize:12, textAlign:'center' },
  emptyBtn:    { marginTop:8, backgroundColor:'rgba(200,151,90,0.12)', borderRadius:10, paddingHorizontal:18, paddingVertical:10, borderWidth:1, borderColor:C.borderAccent },
  emptyBtnTxt: { color:C.accent, fontSize:13 },
});
