import { TouchableOpacity, View, Text, Image, StyleSheet } from 'react-native';
import { colors, typography, spacing, radius } from '../theme';

const CUISINE_EMOJI = {
  algerien:'🥘', mediterraneen:'🐟', fast_casual:'☕',
  italien:'🍕', japonais:'🍣', turc:'🍢', libanais:'🌿', francais:'🍷', autre:'🍽️',
};

export default function SearchResultCard({ r, onPress }) {
  const photo = r.photos?.[0];
  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.85}>
      <View style={s.thumb}>
        {photo
          ? <Image source={{ uri: photo }} style={s.photo} resizeMode="cover" />
          : <Text style={s.emoji}>{CUISINE_EMOJI[r.cuisine_type] || '🍽️'}</Text>
        }
      </View>
      <View style={s.info}>
        <Text style={s.cuisine}>
          {r.cuisine_type?.toUpperCase()}
          {r.quartier ? '  ·  ' + r.quartier : ''}
          {r.city ? '  ·  ' + r.city.charAt(0).toUpperCase() + r.city.slice(1) : ''}
        </Text>
        <Text style={s.name} numberOfLines={1}>{r.name}</Text>
        <View style={s.meta}>
          <Text style={s.rating}>★ {r.avg_rating > 0 ? Number(r.avg_rating).toFixed(1) : '—'}</Text>
          <Text style={s.sep}>·</Text>
          <Text style={s.price}>{r.avg_ticket > 0 ? r.avg_ticket.toLocaleString('fr-FR') + ' DA' : '—'}</Text>
        </View>
      </View>
      <Text style={s.arrow}>›</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  card:    { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, paddingHorizontal: spacing.xl, paddingVertical: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.separator },
  thumb:   { width: 68, height: 68, borderRadius: radius.card, backgroundColor: colors.cardHover, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 },
  photo:   { width: 68, height: 68 },
  emoji:   { fontSize: 28 },
  info:    { flex: 1, gap: spacing.xs },
  cuisine: { color: colors.textSecondary, fontSize: typography.size.xs, letterSpacing: 2 },
  name:    { color: colors.text, fontSize: typography.size.body, fontWeight: typography.weight.medium },
  meta:    { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  rating:  { color: colors.star, fontSize: typography.size.sm, fontWeight: typography.weight.semibold },
  sep:     { color: colors.textTertiary, fontSize: typography.size.sm },
  price:   { color: colors.textSecondary, fontSize: typography.size.sm },
  arrow:   { color: colors.textTertiary, fontSize: 22, fontWeight: '300' },
});
