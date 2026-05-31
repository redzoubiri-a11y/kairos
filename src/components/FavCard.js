import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { colors, typography, spacing, radius } from '../theme';
import { CUISINE_EMOJI } from '../hooks/useFavoris';

const SW = Dimensions.get('window').width;
export const CARD_W = (SW - spacing.xxl * 2 - spacing.lg) / 2;

const BG_COLORS = ['#1a2e1a', '#1a1e2e', '#2e2a1a', '#2a1a2e', '#1a2a2e'];

export default function FavCard({ fav, index, onPress, onReserve, onRemove, removing }) {
  const r     = fav.restaurants || {};
  const photo = r.photo_url || (r.photos?.[0]) || null;

  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.88}>
      <View style={s.photoWrap}>
        {photo
          ? <Image source={{ uri: photo }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: BG_COLORS[index % 5], alignItems: 'center', justifyContent: 'center' }]}>
              <Text style={{ fontSize: 38, opacity: 0.7 }}>{CUISINE_EMOJI[r.cuisine_type] || '🍽️'}</Text>
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
  card:        { width: CARD_W, backgroundColor: colors.card, borderRadius: radius.xxl, borderWidth: 1, borderColor: colors.cardBorder, overflow: 'hidden' },
  photoWrap:   { height: 130, backgroundColor: colors.cardHover },
  grad:        { position: 'absolute', bottom: 0, left: 0, right: 0, height: 50, backgroundColor: 'rgba(15,13,11,0.5)' },
  ratingBadge: { position: 'absolute', bottom: spacing.md, left: spacing.md, backgroundColor: 'rgba(15,13,11,0.82)', borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: spacing.xxs+1, borderWidth: 1, borderColor: 'rgba(232,160,69,0.3)' },
  ratingTxt:   { color: colors.accent, fontSize: typography.size.sm, fontWeight: typography.weight.semibold },
  heartBtn:    { position: 'absolute', top: spacing.md, right: spacing.md, width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(15,13,11,0.75)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.cardBorder },
  info:        { padding: spacing.lg },
  cuisine:     { color: colors.accent, fontSize: typography.size.xs, letterSpacing: 1.5, marginBottom: 2, textTransform: 'uppercase' },
  name:        { color: colors.text, fontSize: typography.size.bodyLg, fontWeight: typography.weight.regular, letterSpacing: 0.2, marginBottom: spacing.md },
  bottom:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  price:       { color: colors.textMuted, fontSize: typography.size.sm },
  reserveBtn:  { backgroundColor: colors.accentSoft, borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderWidth: 1, borderColor: 'rgba(232,160,69,0.3)' },
  reserveTxt:  { color: colors.accent, fontSize: typography.size.xs, fontWeight: typography.weight.medium },
});
