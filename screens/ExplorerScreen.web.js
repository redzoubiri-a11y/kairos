import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, SafeAreaView, ActivityIndicator, Dimensions, Image, FlatList,
} from 'react-native';
import { supabase } from '../supabase';

const SW = Dimensions.get('window').width;
const CARD_W = Math.min((SW - 14 * 2 - 10) / 2, 300);

const C = {
  bg:'#0d1628', bg2:'#111827', bg3:'#1a2332',
  accent:'#c8975a', accent2:'#4a7fa5',
  text:'#f0ece4', dim:'#8a9ab0', dimmer:'#4a5568',
  green:'#3d9970', red:'#e05a5a', card:'#141e2e',
  border:'rgba(255,255,255,0.07)',
  borderAccent:'rgba(200,151,90,0.3)',
};

const CITIES = [
  { id:'alger',       label:'Alger',       emoji:'🏛️' },
  { id:'oran',        label:'Oran',        emoji:'🌊' },
  { id:'constantine', label:'Constantine', emoji:'🌉' },
];

const CUISINE_EMOJI = {
  algerien:'🥘', mediterraneen:'🐟', fast_casual:'☕',
  italien:'🍕', japonais:'🍣', turc:'🍢', libanais:'🌿', francais:'🍷', autre:'🍽️',
};

const SORT_OPTIONS = [
  { id:'rating',     label:'Mieux notés',    icon:'★' },
  { id:'price_asc',  label:'Prix croissant', icon:'↑' },
  { id:'price_desc', label:'Prix décroissant',icon:'↓' },
];

const BUDGET_OPTIONS = [
  { id:'all',  label:'Tous les budgets' },
  { id:'low',  label:'< 1 000 DA',        max:1000 },
  { id:'mid',  label:'1 000 – 2 500 DA',  min:1000, max:2500 },
  { id:'high', label:'> 2 500 DA',        min:2500 },
];

function RestoCard({ r, rank, onPress, onReserve }) {
  return (
    <TouchableOpacity style={lc.card} onPress={onPress} activeOpacity={0.88}>
      <View style={lc.imgWrap}>
        {r.photo_url
          ? <Image source={{ uri: r.photo_url }} style={lc.img} resizeMode="cover" />
          : <View style={[lc.img, lc.imgPlaceholder]}><Text style={{ fontSize: 30 }}>🍽️</Text></View>
        }
        {r.avg_rating > 0 && (
          <View style={lc.ratingBadge}>
            <Text style={lc.ratingBadgeTxt}>★ {Number(r.avg_rating).toFixed(1)}</Text>
          </View>
        )}
        {rank != null && rank < 3 && (
          <View style={[lc.medalWrap, rank === 0 && { backgroundColor:'#f0c040' }, rank === 1 && { backgroundColor:'#b0b0b0' }, rank === 2 && { backgroundColor:'#cd7f32' }]}>
            <Text style={lc.medalTxt}>{rank + 1}</Text>
          </View>
        )}
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
  card:           { width: CARD_W, backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.border, overflow:'hidden', marginBottom: 10 },
  imgWrap:        { position:'relative', width:'100%', height: 130 },
  img:            { width:'100%', height:'100%' },
  imgPlaceholder: { backgroundColor: C.bg3, alignItems:'center', justifyContent:'center' },
  ratingBadge:    { position:'absolute', top:8, right:8, backgroundColor:'rgba(13,22,40,0.82)', borderRadius:10, paddingHorizontal:7, paddingVertical:3, borderWidth:1, borderColor:C.borderAccent },
  ratingBadgeTxt: { color:C.accent, fontSize:10, fontWeight:'600' },
  medalWrap:      { position:'absolute', top:8, left:8, width:22, height:22, borderRadius:11, alignItems:'center', justifyContent:'center' },
  medalTxt:       { color:C.bg, fontSize:10, fontWeight:'700' },
  cuisinePill:    { position:'absolute', bottom:8, left:8, backgroundColor:'rgba(13,22,40,0.78)', borderRadius:8, paddingHorizontal:7, paddingVertical:3 },
  cuisinePillTxt: { color:C.text, fontSize:9 },
  body:           { padding:10, gap:4 },
  name:           { color:C.text, fontSize:13, fontWeight:'400', letterSpacing:0.2 },
  quartier:       { color:C.dim, fontSize:10 },
  footer:         { flexDirection:'row', justifyContent:'space-between', alignItems:'flex-end', marginTop:4 },
  price:          { color:C.accent, fontSize:10, fontWeight:'500' },
  reviews:        { color:C.dimmer, fontSize:9, marginTop:1 },
  reserveBtn:     { backgroundColor:'rgba(200,151,90,0.15)', borderRadius:8, paddingHorizontal:8, paddingVertical:5, borderWidth:1, borderColor:C.borderAccent },
  reserveTxt:     { color:C.accent, fontSize:10, fontWeight:'500' },
});

export default function ExplorerScreen({ navigation }) {
  const [city,        setCity]        = useState('alger');
  const [search,      setSearch]      = useState('');
  const [cuisine,     setCuisine]     = useState(null);
  const [sort,        setSort]        = useState('rating');
  const [budget,      setBudget]      = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [restaurants, setRestaurants] = useState([]);
  const [loading,     setLoading]     = useState(false);

  useEffect(() => {
    setLoading(true);
    setCuisine(null);
    supabase
      .from('restaurants')
      .select('id, name, cuisine_type, address, quartier, city, photo_url, avg_rating, avg_ticket, review_count, capacity')
      .eq('city', city)
      .eq('status', 'active')
      .order('avg_rating', { ascending: false })
      .then(({ data }) => { setRestaurants(data ?? []); setLoading(false); });
  }, [city]);

  const cuisineTypes = [...new Set(restaurants.map(r => r.cuisine_type).filter(Boolean))];
  const budgetData   = BUDGET_OPTIONS.find(o => o.id === budget);
  const hasFilters   = sort !== 'rating' || budget !== 'all' || !!cuisine;

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

  return (
    <SafeAreaView style={s.root}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.logo}>MIDA</Text>
          <Text style={s.logoSub}>Explorer</Text>
        </View>
        {!loading && (
          <View style={s.countBadge}>
            <View style={s.countDot} />
            <Text style={s.countTxt}>{filtered.length} restos</Text>
          </View>
        )}
      </View>

      {/* Villes */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipRow}>
        {CITIES.map(c => (
          <TouchableOpacity key={c.id} style={[s.cityChip, city === c.id && s.cityChipOn]} onPress={() => setCity(c.id)}>
            <Text style={s.cityEmoji}>{c.emoji}</Text>
            <Text style={[s.cityTxt, city === c.id && s.cityTxtOn]}>{c.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Recherche */}
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
              <Text style={{ color:C.dimmer, fontSize:12 }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[s.filterBtn, hasFilters && s.filterBtnOn]}
          onPress={() => setShowFilters(v => !v)}
        >
          <Text style={s.filterIcon}>⚙</Text>
          <Text style={[s.filterTxt, hasFilters && { color:C.accent }]}>{hasFilters ? 'Actifs' : 'Filtres'}</Text>
        </TouchableOpacity>
      </View>

      {/* Panel filtres */}
      {showFilters && (
        <View style={s.filterPanel}>
          <Text style={s.filterSection}>TRIER PAR</Text>
          <View style={s.filterRow}>
            {SORT_OPTIONS.map(o => (
              <TouchableOpacity key={o.id} style={[s.filterOpt, sort === o.id && s.filterOptOn]} onPress={() => setSort(o.id)}>
                <Text style={[s.filterOptTxt, sort === o.id && { color:C.accent }]}>{o.icon} {o.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={s.filterSection}>BUDGET</Text>
          <View style={s.filterRow}>
            {BUDGET_OPTIONS.map(o => (
              <TouchableOpacity key={o.id} style={[s.filterOpt, budget === o.id && s.filterOptOn]} onPress={() => setBudget(o.id)}>
                <Text style={[s.filterOptTxt, budget === o.id && { color:C.accent }]}>{o.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={s.filterActions}>
            <TouchableOpacity onPress={() => { setSort('rating'); setBudget('all'); setCuisine(null); }}>
              <Text style={{ color:C.accent2, fontSize:12 }}>Effacer</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.applyBtn} onPress={() => setShowFilters(false)}>
              <Text style={s.applyTxt}>Appliquer</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Cuisines */}
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

      {/* Liste */}
      {loading ? (
        <View style={s.center}><ActivityIndicator color={C.accent} size="large" /></View>
      ) : filtered.length === 0 ? (
        <View style={s.center}>
          <Text style={{ fontSize:36 }}>🔍</Text>
          <Text style={s.emptyTitle}>Aucun restaurant trouvé</Text>
          <TouchableOpacity onPress={() => { setSearch(''); setCuisine(null); setBudget('all'); setSort('rating'); }}>
            <Text style={{ color:C.accent2, fontSize:13, marginTop:8 }}>Effacer les filtres</Text>
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
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:    { flex:1, backgroundColor:C.bg },
  header:  { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingHorizontal:20, paddingTop:16, paddingBottom:12, borderBottomWidth:1, borderBottomColor:C.border },
  logo:    { color:C.accent, fontSize:16, fontWeight:'700', letterSpacing:5 },
  logoSub: { color:C.dim, fontSize:10 },
  countBadge: { flexDirection:'row', alignItems:'center', gap:5, backgroundColor:'rgba(200,151,90,0.1)', borderRadius:100, paddingHorizontal:10, paddingVertical:5, borderWidth:1, borderColor:C.borderAccent },
  countDot:   { width:6, height:6, borderRadius:3, backgroundColor:C.green },
  countTxt:   { color:C.accent, fontSize:11, fontWeight:'500' },

  chipRow:   { paddingHorizontal:14, paddingVertical:8, gap:8 },
  cityChip:  { flexDirection:'row', alignItems:'center', gap:5, paddingHorizontal:14, paddingVertical:7, borderRadius:100, backgroundColor:C.bg3, borderWidth:1, borderColor:C.border },
  cityChipOn:{ backgroundColor:C.accent, borderColor:C.accent },
  cityEmoji: { fontSize:13 },
  cityTxt:   { color:C.dim, fontSize:12 },
  cityTxtOn: { color:C.bg, fontWeight:'600' },

  searchRow:   { flexDirection:'row', alignItems:'center', gap:8, paddingHorizontal:14, marginBottom:4 },
  searchBar:   { flex:1, flexDirection:'row', alignItems:'center', backgroundColor:C.bg3, borderRadius:12, paddingHorizontal:12, paddingVertical:10, borderWidth:1, borderColor:C.border, gap:8 },
  searchIcon:  { fontSize:13 },
  searchInput: { flex:1, color:C.text, fontSize:13 },
  filterBtn:   { flexDirection:'row', alignItems:'center', gap:4, backgroundColor:C.bg3, borderRadius:10, paddingHorizontal:10, paddingVertical:9, borderWidth:1, borderColor:C.border },
  filterBtnOn: { borderColor:C.borderAccent, backgroundColor:'rgba(200,151,90,0.08)' },
  filterIcon:  { color:C.dim, fontSize:12 },
  filterTxt:   { color:C.dim, fontSize:10, fontWeight:'500' },

  filterPanel:   { marginHorizontal:14, marginBottom:8, padding:14, backgroundColor:C.bg2, borderRadius:14, borderWidth:1, borderColor:C.border, gap:8 },
  filterSection: { color:C.dimmer, fontSize:9, letterSpacing:2 },
  filterRow:     { flexDirection:'row', flexWrap:'wrap', gap:6 },
  filterOpt:     { paddingHorizontal:12, paddingVertical:7, borderRadius:10, backgroundColor:C.bg3, borderWidth:1, borderColor:C.border },
  filterOptOn:   { backgroundColor:'rgba(200,151,90,0.15)', borderColor:C.accent },
  filterOptTxt:  { color:C.dim, fontSize:11 },
  filterActions: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginTop:4 },
  applyBtn:      { backgroundColor:C.accent, borderRadius:10, paddingHorizontal:18, paddingVertical:9 },
  applyTxt:      { color:C.bg, fontSize:13, fontWeight:'500' },

  cuisineChip:   { flexDirection:'row', alignItems:'center', gap:4, paddingHorizontal:12, paddingVertical:6, borderRadius:100, backgroundColor:C.bg3, borderWidth:1, borderColor:C.border },
  cuisineChipOn: { backgroundColor:'rgba(200,151,90,0.15)', borderColor:C.accent },
  cuisineEmoji:  { fontSize:12 },
  cuisineTxt:    { color:C.dim, fontSize:11 },
  cuisineTxtOn:  { color:C.accent },

  gridRow:     { paddingHorizontal:14, justifyContent:'space-between' },
  gridContent: { paddingTop:6 },

  center:     { flex:1, alignItems:'center', justifyContent:'center', gap:8 },
  emptyTitle: { color:C.text, fontSize:16, fontWeight:'300' },
});
