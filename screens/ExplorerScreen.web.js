import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, ActivityIndicator, useWindowDimensions, Image, FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../supabase';
import { colors, typography, spacing, radius } from '../src/theme';
import Logo from '../src/components/Logo';

const GRID_PADDING = 14;
const GRID_GAP = 12;
const MIN_CARD_W = 220;
const MAX_CARD_W = 300;

const CITIES = [
  { id:'alger',       label:'Alger',       emoji:'🏛️' },
  { id:'tipaza',      label:'Tipaza',      emoji:'🏖️' },
  { id:'oran',        label:'Oran',        emoji:'🌊' },
  { id:'constantine', label:'Constantine', emoji:'🌉' },
  { id:'tizi_ouzou',  label:'Tizi Ouzou',  emoji:'⛰️' },
  { id:'bejaia',      label:'Béjaïa',      emoji:'🌅' },
  { id:'setif',       label:'Sétif',       emoji:'🌾' },
  { id:'annaba',      label:'Annaba',      emoji:'🌺' },
  { id:'tlemcen',     label:'Tlemcen',     emoji:'🕌' },
];

// Carte alignée sur le même langage visuel que FavoriteCard.js (radius.lg,
// colors.card/cardBorder, typography.display pour le nom, étoiles en
// colors.primary) — remplace l'ancien style maison (badges noirs translucides,
// médailles or/argent/bronze codées en dur, emoji de cuisine en overlay)
// jamais aligné avec la refonte rouge/Work Sans du 15-16/08.
function RestoCard({ r, onPress, onReserve, cardWidth }) {
  const rating = r.avg_rating > 0 ? Number(r.avg_rating).toFixed(1).replace('.', ',') : null;
  const starCount = r.avg_rating > 0 ? Math.max(1, Math.min(5, Math.round(r.avg_rating))) : 0;

  return (
    <TouchableOpacity style={[lc.card, { width: cardWidth }]} onPress={onPress} activeOpacity={0.9}>
      <View style={lc.photoWrap}>
        {r.photos?.[0]
          ? <Image source={{ uri: r.photos[0] }} style={lc.photo} resizeMode="cover" />
          : <LinearGradient colors={colors.photoFallbackGradient} style={lc.photo} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
        }
      </View>
      <View style={lc.body}>
        <Text style={lc.name} numberOfLines={1}>{r.name}</Text>
        {rating && (
          <View style={lc.rateRow}>
            <Text style={lc.stars}>{'★'.repeat(starCount)}</Text>
            <Text style={lc.scoreNum}>{rating}</Text>
            {r.review_count > 0 && <Text style={lc.reviewCount}>({r.review_count})</Text>}
          </View>
        )}
        {!!r.quartier && <Text style={lc.quartier} numberOfLines={1}>{r.quartier}</Text>}
        <View style={lc.footer}>
          {r.avg_ticket > 0 && <Text style={lc.price}>{r.avg_ticket.toLocaleString('fr-FR')} DA</Text>}
          <TouchableOpacity style={lc.reserveBtn} onPress={onReserve}>
            <Text style={lc.reserveTxt}>Réserver</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const lc = StyleSheet.create({
  card:      { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: radius.lg, overflow: 'hidden', marginBottom: 12 },
  photoWrap: { height: 120 },
  photo:     { width: '100%', height: '100%' },

  body:       { padding: spacing.md + 2, gap: 3 },
  name:       { fontFamily: typography.display, fontSize: typography.size.bodyLg, color: colors.text },
  rateRow:    { flexDirection: 'row', alignItems: 'center', gap: 4 },
  stars:      { color: colors.primary, fontSize: 10, letterSpacing: 1 },
  scoreNum:   { fontFamily: typography.display, fontSize: typography.size.xs + 1, color: colors.text },
  reviewCount:{ fontFamily: typography.body, fontSize: typography.size.xs, color: colors.textDim },
  quartier:   { fontFamily: typography.body, fontSize: typography.size.sm, color: colors.textMuted },

  footer:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  price:      { fontFamily: typography.bodyMedium, fontSize: typography.size.sm, color: colors.primary },
  reserveBtn: { backgroundColor: colors.resaSoft, borderRadius: radius.sm, paddingHorizontal: 8, paddingVertical: 5 },
  reserveTxt: { fontFamily: typography.bodyMedium, fontSize: typography.size.sm, color: colors.resa },
});

export default function ExplorerScreen({ navigation }) {
  const [city,        setCity]        = useState('alger');
  const [restaurants, setRestaurants] = useState([]);
  const [loading,     setLoading]     = useState(false);
  const { width } = useWindowDimensions();

  const available = width - GRID_PADDING * 2;
  const numColumns = Math.max(2, Math.floor((available + GRID_GAP) / (MIN_CARD_W + GRID_GAP)));
  const cardWidth  = Math.min(MAX_CARD_W, (available - GRID_GAP * (numColumns - 1)) / numColumns);

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

  const renderItem = useCallback(({ item: r }) => (
    <RestoCard
      r={r}
      cardWidth={cardWidth}
      onPress={() => navigation.navigate('Restaurant', { restaurant: r })}
      onReserve={() => navigation.navigate('ReservationForm', { restaurant: r })}
    />
  ), [navigation, cardWidth]);

  return (
    <SafeAreaView style={s.root}>
      {/* Header */}
      <View style={s.header}>
        <View style={{ gap: 2 }}>
          <Logo size={26} />
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
        <View style={s.center}><ActivityIndicator color={colors.primary} size="large" /></View>
      ) : restaurants.length === 0 ? (
        <View style={s.center}>
          <Text style={{ fontSize:36 }}>🍽️</Text>
          <Text style={s.emptyTitle}>Aucun restaurant pour cette ville.</Text>
        </View>
      ) : (
        <FlatList
          key={numColumns}
          data={restaurants}
          keyExtractor={r => String(r.id)}
          numColumns={numColumns}
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
  logoSub: { color:colors.textMuted, fontSize:typography.size.sm },
  countBadge: { flexDirection:'row', alignItems:'center', gap:5, backgroundColor:colors.card, borderRadius:radius.full, paddingHorizontal:spacing.md, paddingVertical:5, borderWidth:1, borderColor:colors.cardBorder },
  countDot:   { width:6, height:6, borderRadius:3, backgroundColor:colors.green },
  countTxt:   { color:colors.text, fontSize:typography.size.caption, fontWeight:'500' },

  cityGrid:  { flexDirection:'row', flexWrap:'wrap', paddingHorizontal:14, paddingVertical:10, gap:8 },
  cityChip:  { flexDirection:'row', alignItems:'center', justifyContent:'center', gap:6, height:38, paddingHorizontal:14, borderRadius:radius.xl, backgroundColor:colors.card, borderWidth:1, borderColor:colors.cardBorder },
  cityChipOn:{ backgroundColor:colors.noir, borderColor:colors.noir },
  cityEmoji: { fontSize:14, lineHeight:16 },
  cityTxt:   { color:colors.text, fontSize:typography.size.bodyLg, lineHeight:16 },
  cityTxtOn: { color:colors.bg, fontWeight:'600' },

  gridRow:     { paddingHorizontal:GRID_PADDING, gap:GRID_GAP },
  gridContent: { paddingTop:6 },

  center:     { flex:1, alignItems:'center', justifyContent:'center', gap:8 },
  emptyTitle: { color:colors.text, fontSize:typography.size.heading2, fontWeight:'300' },
});
