import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { colors, typography, spacing, radius } from '../theme';
import { CUISINE_EMOJI } from '../hooks/useFavoris';

const SW = Dimensions.get('window').width;
export const CARD_W = (SW - spacing.xxl * 2 - spacing.lg) / 2;

export default function FavCard({ fav, index, onPress, onReserve, onRemove, removing }) {
  const r     = fav.restaurants || {};
  const photo = r.photos?.[0] || null;

  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.88}>
      <View style={s.photoWrap}>
        {photo
          ? <Image source={{ uri: photo }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' }]}>
              <Text style={{ fontSize: 38, opacity: 0.5 }}>{CUISINE_EMOJI[r.cuisine_type] || '🍽️'}</Text>
            </View>
          )
        }
        <View style={s.grad} />
        {r.avg_rating > 0 && (
          <View style={s.ratingBadge}>
            <Text style={s.ratingTxt}>★ {Number(r.avg_rating).toFixed(1)}</Text>
          </View>
        )}
        <TouchableOpacity style={s.heartBtn} onPress={onRemove} disabled={removing}>
          <Text style={{ fontSize: removing ? 11 : 14, color: colors.textDim }}>{removing ? '···' : '❤️'}</Text>
        </TouchableOpacity>
      </View>

      <View style={s.info}>
        <Text style={s.cuisine} numberOfLines={1}>
          {(r.cuisine_type || '').replace(/_/g, ' ')}
          {r.quartier ? ` · ${r.quartier}` : ''}
        </Text>
        <Text style={s.name} numberOfLines={1}>{r.name || '—'}</Text>
        <View style={s.bottom}>
          <Text style={s.price}>
            {r.avg_ticket > 0 ? `${r.avg_ticket.toLocaleString('fr-FR')} DA` : '—'}
          </Text>
          <TouchableOpacity style={s.reserveBtn} onPress={onReserve}>
            <Text style={s.reserveTxt}>Réserver</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  card:        { width: CARD_W, backgroundColor: colors.bg, borderRadius: radius.card, borderWidth: 1, borderColor: colors.separator, overflow: 'hidden' },
  photoWrap:   { height: 130, backgroundColor: colors.cardHover },
  grad:        { position: 'absolute', bottom: 0, left: 0, right: 0, height: 50, backgroundColor: 'rgba(0,0,0,0.4)' },
  ratingBadge: { position: 'absolute', bottom: spacing.md, left: spacing.md, backgroundColor: 'rgba(0,0,0,0.65)', borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: spacing.xxs + 1 },
  ratingTxt:   { color: colors.star, fontSize: typography.size.sm, fontWeight: typography.weight.semibold },
  heartBtn:    { position: 'absolute', top: spacing.md, right: spacing.md, width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
  info:        { padding: spacing.lg, gap: spacing.xs },
  cuisine:     { color: colors.textSecondary, fontSize: typography.size.xs, letterSpacing: 1.5, textTransform: 'uppercase' },
  name:        { color: colors.text, fontSize: typography.size.bodyLg, fontWeight: typography.weight.medium, letterSpacing: 0.2 },
  bottom:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.xs },
  price:       { color: colors.textSecondary, fontSize: typography.size.sm },
  reserveBtn:  { backgroundColor: colors.primary, borderRadius: radius.card, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  reserveTxt:  { color: colors.bg, fontSize: typography.size.xs, fontWeight: typography.weight.semibold },
});
