import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, radius } from '../theme';
import { CUISINE_EMOJI } from '../hooks/useExplorer';

const SW = Dimensions.get('window').width;
export const CARD_W = (SW - 14 * 2 - 10) / 2;

export default function ExplorerRestoCard({ r, rank, distance, onPress, onReserve }) {
  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.88}>
      <View style={s.imgWrap}>
        {r.photos?.[0]
          ? <Image source={{ uri: r.photos[0] }} style={s.img} resizeMode="cover" />
          : <View style={[s.img, s.imgPlaceholder]}><Text style={{ fontSize: 30 }}>🍽️</Text></View>
        }
        {r.avg_rating > 0 && (
          <View style={s.ratingBadge}>
            <Text style={s.ratingBadgeTxt}>★ {Number(r.avg_rating).toFixed(1)}</Text>
          </View>
        )}
        {rank != null && rank < 3 && (
          <View style={[
            s.medalWrap,
            rank === 0 && { backgroundColor:'#f0c040' },
            rank === 1 && { backgroundColor:'#b0b0b0' },
            rank === 2 && { backgroundColor:'#cd7f32' },
          ]}>
            <Text style={s.medalTxt}>{rank + 1}</Text>
          </View>
        )}
        <View style={s.cuisinePill}>
          <Text style={s.cuisinePillTxt}>
            {CUISINE_EMOJI[r.cuisine_type] || '🍽️'} {(r.cuisine_type || '').replace(/_/g,' ')}
          </Text>
        </View>
      </View>

      <View style={s.body}>
        <Text style={s.name} numberOfLines={1}>{r.name}</Text>
        <Text style={s.quartier} numberOfLines={1}>
          {distance ? `📍 ${distance}` : r.quartier ? `📍 ${r.quartier}` : ''}
        </Text>
        <View style={s.footer}>
          <View>
            {r.avg_ticket > 0 && <Text style={s.price}>{r.avg_ticket.toLocaleString('fr-FR')} DA</Text>}
            {r.review_count > 0 && <Text style={s.reviews}>{r.review_count} avis</Text>}
          </View>
          <TouchableOpacity style={s.reserveBtn} onPress={onReserve}>
            <LinearGradient colors={['#FF6B1A','#D93A00']} start={{x:0,y:0}} end={{x:1,y:0}} style={StyleSheet.absoluteFillObject} />
            <Text style={s.reserveTxt}>Réserver</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  card:          { width: CARD_W, backgroundColor: colors.card, borderRadius: 0, borderWidth: 1, borderColor: colors.cardBorder, overflow:'hidden', marginBottom: 10 },
  imgWrap:       { position:'relative', width:'100%', height: 130 },
  img:           { width:'100%', height:'100%' },
  imgPlaceholder:{ backgroundColor: colors.cardHover, alignItems:'center', justifyContent:'center' },
  ratingBadge:   { position:'absolute', top:8, right:8, backgroundColor:'rgba(15,13,11,0.82)', borderRadius:radius.md, paddingHorizontal:7, paddingVertical:3, borderWidth:1, borderColor:'rgba(232,160,69,0.3)' },
  ratingBadgeTxt:{ color:colors.accent, fontSize:typography.size.sm, fontWeight:'600' },
  medalWrap:     { position:'absolute', top:8, left:8, width:22, height:22, borderRadius:0, alignItems:'center', justifyContent:'center' },
  medalTxt:      { color:colors.bg, fontSize:typography.size.sm, fontWeight:'700' },
  cuisinePill:   { position:'absolute', bottom:8, left:8, backgroundColor:'rgba(15,13,11,0.78)', borderRadius:radius.sm, paddingHorizontal:7, paddingVertical:3 },
  cuisinePillTxt:{ color:colors.text, fontSize:typography.size.xs },
  body:          { padding:10, gap:4 },
  name:          { color:colors.text, fontSize:typography.size.bodyLg, fontWeight:'400', letterSpacing:0.2 },
  quartier:      { color:colors.textMuted, fontSize:typography.size.sm },
  footer:        { flexDirection:'row', justifyContent:'space-between', alignItems:'flex-end', marginTop:4 },
  price:         { color:colors.accent, fontSize:typography.size.sm, fontWeight:'500' },
  reviews:       { color:colors.textDim, fontSize:typography.size.xs, marginTop:1 },
  reserveBtn:    { borderRadius:radius.sm, paddingHorizontal:8, paddingVertical:5, overflow:'hidden', alignItems:'center', justifyContent:'center' },
  reserveTxt:    { color:'#FFFFFF', fontSize:typography.size.sm, fontWeight:'500' },
});
