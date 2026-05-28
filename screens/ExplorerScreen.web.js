import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, ActivityIndicator, Dimensions, Image, FlatList,
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
  { id:'tizi_ouzou',  label:'Tizi Ouzou',  emoji:'⛰️' },
  { id:'bejaia',      label:'Béjaïa',      emoji:'🌅' },
  { id:'setif',       label:'Sétif',       emoji:'🌾' },
  { id:'annaba',      label:'Annaba',      emoji:'🌺' },
  { id:'tlemcen',     label:'Tlemcen',     emoji:'🕌' },
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
        {r.photos?.[0]
          ? <Image source={{ uri: r.photos[0] }} style={lc.img} resizeMode="cover" />
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
  const [restaurants, setRestaurants] = useState([]);
  const [loading,     setLoading]     = useState(false);

  useEffect(() => {
    setLoading(true);
    supabase
      .from('restaurants')
      .select('id, name, cuisine_type, address, quartier, city, photos, avg_rating, avg_ticket, review_count, capacity')
      .eq('city', city)
      .eq('status', 'active')
      .order('avg_rating', { ascending: false })
      .then(({ data }) => { setRestaurants(data ?? []); setLoading(false); });
  }, [city]);

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
            <Text style={s.countTxt}>{restaurants.length} restos</Text>
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

      {/* Liste */}
      {loading ? (
        <View style={s.center}><ActivityIndicator color={C.accent} size="large" /></View>
      ) : restaurants.length === 0 ? (
        <View style={s.center}>
          <Text style={{ fontSize:36 }}>🍽️</Text>
          <Text style={s.emptyTitle}>Aucun restaurant pour cette ville.</Text>
        </View>
      ) : (
        <FlatList
          data={restaurants}
          keyExtractor={r => String(r.id)}
          numColumns={2}
          columnWrapperStyle={s.gridRow}
          contentContainerStyle={s.gridContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item: r, index }) => (
            <RestoCard
              r={r}
              rank={index}
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
  cityChip:  { flexDirection:'row', alignItems:'center', gap:5, paddingHorizontal:14, paddingVertical:7, borderRadius:100, backgroundColor:C.bg3, borderWidth:1, borderColor:'rgba(255,255,255,0.18)' },
  cityChipOn:{ backgroundColor:C.accent, borderColor:C.accent },
  cityEmoji: { fontSize:13 },
  cityTxt:   { color:C.text, fontSize:12 },
  cityTxtOn: { color:C.bg, fontWeight:'600' },


  gridRow:     { paddingHorizontal:14, justifyContent:'space-between' },
  gridContent: { paddingTop:6 },

  center:     { flex:1, alignItems:'center', justifyContent:'center', gap:8 },
  emptyTitle: { color:C.text, fontSize:16, fontWeight:'300' },
});
