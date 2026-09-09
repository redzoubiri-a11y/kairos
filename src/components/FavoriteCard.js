import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing, radius } from '../theme';

export default function FavoriteCard({ r, onPress, onRemove }) {
  const rating = r.avg_rating > 0 ? Number(r.avg_rating).toFixed(1).replace('.', ',') : null;
  const starCount = r.avg_rating > 0 ? Math.max(1, Math.min(5, Math.round(r.avg_rating))) : 0;

  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.9}>
      <View style={s.photoWrap}>
        {r.photos?.[0] ? (
          <Image source={{ uri: r.photos[0] }} style={s.photo} resizeMode="cover" />
        ) : (
          <LinearGradient colors={colors.photoFallbackGradient} style={s.photo} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
        )}
        <TouchableOpacity style={s.heart} onPress={onRemove} hitSlop={6}>
          <Text style={s.heartTxt}>♥</Text>
        </TouchableOpacity>
      </View>
      <View style={s.body}>
        <Text style={s.name} numberOfLines={1}>{r.name}</Text>
        {rating && (
          <View style={s.rateRow}>
            <Text style={s.stars}>{'★'.repeat(starCount)}</Text>
            <Text style={s.scoreNum}>{rating}</Text>
          </View>
        )}
        {!!r.quartier && <Text style={s.meta} numberOfLines={1}>{r.quartier}</Text>}
      </View>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  card: { flex: 1, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: radius.lg, overflow: 'hidden' },

  photoWrap: { height: 100, position: 'relative' },
  photo:     { width: '100%', height: '100%' },
  heart:     { position: 'absolute', top: spacing.sm, right: spacing.sm, width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center' },
  heartTxt:  { fontSize: typography.size.caption, color: colors.primary },

  body: { padding: spacing.md + 2 },
  name: { fontFamily: typography.display, fontSize: typography.size.caption + 1, color: colors.text },
  rateRow:  { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  stars:    { color: colors.primary, fontSize: 9.5, letterSpacing: 1 },
  scoreNum: { fontFamily: typography.display, fontSize: typography.size.xs + 1, color: colors.text },
  meta:     { fontFamily: typography.body, fontSize: typography.size.xs + 0.5, color: colors.textMuted, marginTop: 2 },
});
