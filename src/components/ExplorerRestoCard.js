import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { colors, typography, radius, spacing } from '../theme';
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
            rank === 0 && { backgroundColor: '#f0c040' },
            rank === 1 && { backgroundColor: '#b0b0b0' },
            rank === 2 && { backgroundColor: '#cd7f32' },
          ]}>
            <Text style={s.medalTxt}>{rank + 1}</Text>
          </View>
        )}
        <View style={s.cuisinePill}>
          <Text style={s.cuisinePillTxt}>
            {CUISINE_EMOJI[r.cuisine_type] || '🍽️'} {(r.cuisine_type || '').replace(/_/g, ' ')}
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
            <Text style={s.reserveTxt}>Réserver</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  card:          { width: CARD_W, backgroundColor: colors.bg, borderRadius: radius.card, borderWidth: 1, borderColor: colors.separator, overflow: 'hidden', marginBottom: 10 },
  imgWrap:       { position: 'relative', width: '100%', height: 130 },
  img:           { width: '100%', height: '100%' },
  imgPlaceholder:{ backgroundColor: colors.cardHover, alignItems: 'center', justifyContent: 'center' },
  ratingBadge:   { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.65)', borderRadius: radius.sm, paddingHorizontal: 7, paddingVertical: 3 },
  ratingBadgeTxt:{ color: colors.star, fontSize: typography.size.sm, fontWeight: '600' },
  medalWrap:     { position: 'absolute', top: 8, left: 8, width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  medalTxt:      { color: colors.bg, fontSize: typography.size.sm, fontWeight: '700' },
  cuisinePill:   { position: 'absolute', bottom: 8, left: 8, backgroundColor: 'rgba(0,0,0,0.60)', borderRadius: radius.sm, paddingHorizontal: 7, paddingVertical: 3 },
  cuisinePillTxt:{ color: '#FFFFFF', fontSize: typography.size.xs },
  body:          { padding: 10, gap: 4 },
  name:          { color: colors.text, fontSize: typography.size.bodyLg, fontWeight: '500', letterSpacing: 0.2 },
  quartier:      { color: colors.textSecondary, fontSize: typography.size.sm },
  footer:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 4 },
  price:         { color: colors.primary, fontSize: typography.size.sm, fontWeight: '500' },
  reviews:       { color: colors.textTertiary, fontSize: typography.size.xs, marginTop: 1 },
  reserveBtn:    { borderRadius: radius.card, paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary },
  reserveTxt:    { color: colors.bg, fontSize: typography.size.sm, fontWeight: '500' },
});
