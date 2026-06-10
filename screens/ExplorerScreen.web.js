import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, ActivityIndicator, Dimensions, Image, FlatList,
} from 'react-native';
import { supabase } from '../supabase';
import { colors, typography, spacing, radius } from '../src/theme';

const SW = Dimensions.get('window').width;
const CARD_W = Math.min((SW - 14 * 2 - 10) / 2, 300);

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
  card:           { width: CARD_W, backgroundColor: colors.card, borderRadius: radius.xxl, borderWidth: 1, borderColor: colors.cardBorder, overflow:'hidden', marginBottom: 10 },
  imgWrap:        { position:'relative', width:'100%', height: 130 },
  img:            { width:'100%', height:'100%' },
  imgPlaceholder: { backgroundColor: colors.cardHover, alignItems:'center', justifyContent:'center' },
  ratingBadge:    { position:'absolute', top:8, right:8, backgroundColor:'rgba(15,13,11,0.82)', borderRadius:radius.md, paddingHorizontal:7, paddingVertical:3, borderWidth:1, borderColor:'rgba(232,160,69,0.3)' },
  ratingBadgeTxt: { color:colors.accent, fontSize:typography.size.sm, fontWeight:'600' },
  medalWrap:      { position:'absolute', top:8, left:8, width:22, height:22, borderRadius:0, alignItems:'center', justifyContent:'center' },
  medalTxt:       { color:colors.bg, fontSize:typography.size.sm, fontWeight:'700' },
  cuisinePill:    { position:'absolute', bottom:8, left:8, backgroundColor:'rgba(15,13,11,0.78)', borderRadius:radius.sm, paddingHorizontal:7, paddingVertical:3 },
  cuisinePillTxt: { color:colors.text, fontSize:typography.size.xs },
  body:           { padding:10, gap:4 },
  name:           { color:colors.text, fontSize:typography.size.bodyLg, fontWeight:'400', letterSpacing:0.2 },
  quartier:       { color:colors.textMuted, fontSize:typography.size.sm },
  footer:         { flexDirection:'row', justifyContent:'space-between', alignItems:'flex-end', marginTop:4 },
  price:          { color:colors.accent, fontSize:typography.size.sm, fontWeight:'500' },
  reviews:        { color:colors.textDim, fontSize:typography.size.xs, marginTop:1 },
  reserveBtn:     { backgroundColor:colors.accentSoft, borderRadius:radius.sm, paddingHorizontal:8, paddingVertical:5, borderWidth:1, borderColor:'rgba(232,160,69,0.3)' },
  reserveTxt:     { color:colors.accent, fontSize:typography.size.sm, fontWeight:'500' },
});

export default function ExplorerScreen({ navigation }) {
  const [city,        setCity]        = useState('alger');
  const [restaurants, setRestaurants] = useState([]);
  const [loading,     setLoading]     = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data } = await supabase
          .from('restaurants')
          .select('id, name, cuisine_type, address, quartier, city, photos, avg_rating, avg_ticket, review_count, capacity')
          .eq('city', city)
          .eq('status', 'active')
          .order('avg_rating', { ascending: false });
        setRestaurants(data ?? []);
      } finally {
        setLoading(false);
      }
    })();
  }, [city]);

  const renderItem = useCallback(({ item: r, index }) => (
    <RestoCard
      r={r}
      rank={index}
      onPress={() => navigation.navigate('Restaurant', { restaurant: r })}
      onReserve={() => navigation.navigate('ReservationForm', { restaurant: r })}
    />
  ), [navigation]);

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
      <View style={s.cityGrid}>
        {CITIES.map(c => (
          <TouchableOpacity key={c.id} style={[s.cityChip, city === c.id && s.cityChipOn]} onPress={() => setCity(c.id)}>
            <Text style={s.cityEmoji}>{c.emoji}</Text>
            <Text style={[s.cityTxt, city === c.id && s.cityTxtOn]}>{c.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Liste */}
      {loading ? (
        <View style={s.center}><ActivityIndicator color={colors.accent} size="large" /></View>
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
          renderItem={renderItem}
          ListFooterComponent={<View style={{ height: 60 }} />}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:    { flex:1, backgroundColor:colors.bg },
  header:  { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingHorizontal:spacing.xxl, paddingTop:spacing.xl, paddingBottom:spacing.lg, borderBottomWidth:1, borderBottomColor:colors.cardBorder },
  logo:    { color:colors.accent, fontSize:typography.size.heading2, fontWeight:'700', letterSpacing:5 },
  logoSub: { color:colors.textMuted, fontSize:typography.size.sm },
  countBadge: { flexDirection:'row', alignItems:'center', gap:5, backgroundColor:colors.accentSoft, borderRadius:radius.full, paddingHorizontal:spacing.md, paddingVertical:5, borderWidth:1, borderColor:'rgba(232,160,69,0.3)' },
  countDot:   { width:6, height:6, borderRadius:0, backgroundColor:colors.green },
  countTxt:   { color:colors.accent, fontSize:typography.size.caption, fontWeight:'500' },

  cityGrid:  { flexDirection:'row', flexWrap:'wrap', paddingHorizontal:14, paddingVertical:10, gap:8 },
  cityChip:  { flexDirection:'row', alignItems:'center', gap:6, paddingHorizontal:14, paddingVertical:9, borderRadius:radius.xl, backgroundColor:colors.card, borderWidth:1, borderColor:colors.cardBorder },
  cityChipOn:{ backgroundColor:colors.accent, borderColor:colors.accent },
  cityEmoji: { fontSize:14 },
  cityTxt:   { color:colors.text, fontSize:typography.size.bodyLg },
  cityTxtOn: { color:colors.bg, fontWeight:'600' },

  gridRow:     { paddingHorizontal:14, justifyContent:'space-between' },
  gridContent: { paddingTop:6 },

  center:     { flex:1, alignItems:'center', justifyContent:'center', gap:8 },
  emptyTitle: { color:colors.text, fontSize:typography.size.heading2, fontWeight:'300' },
});
