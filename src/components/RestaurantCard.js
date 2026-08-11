import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, typography, spacing, radius, shadows } from '../theme';

function priceRangeFromTicket(avgTicket) {
  if (!avgTicket) return null;
  if (avgTicket < 1500) return '€';
  if (avgTicket < 3000) return '€€';
  return '€€€';
}

export default function RestaurantCard({ r, variant = 'compact', distance, slots, promo, onPress, onSlotPress }) {
  const isFeatured = variant === 'featured';
  const photo = r.photos?.[0];
  const priceRange = priceRangeFromTicket(r.avg_ticket);
  const rating = r.avg_rating > 0 ? Number(r.avg_rating).toFixed(1).replace('.', ',') : null;
  const meta = [
    (r.cuisine_type || '').replace(/_/g, ' '),
    r.quartier,
    distance,
    priceRange,
  ].filter(Boolean).join(' · ');

  if (isFeatured) {
    return (
      <TouchableOpacity style={s.featCard} onPress={onPress} activeOpacity={0.9}>
        <View style={s.featImgWrap}>
          {photo
            ? <Image source={{ uri: photo }} style={s.featImg} resizeMode="cover" />
            : <View style={[s.featImg, s.imgPlaceholder]} />
          }
          {!!promo && (
            <View style={s.promoBadge}>
              <Text style={s.promoTxt}>{promo}</Text>
            </View>
          )}
        </View>
        <View style={s.featBody}>
          <View style={s.featTop}>
            <Text style={s.featName} numberOfLines={1}>{r.name}</Text>
            {rating && (
              <View style={s.ratingPill}>
                <Text style={s.star}>★</Text>
                <Text style={s.ratingTxt}>{rating}</Text>
              </View>
            )}
          </View>
          {!!meta && <Text style={s.featMeta} numberOfLines={1}>{meta}</Text>}
          {!!slots?.length && (
            <View style={s.slotsRow}>
              {slots.slice(0, 3).map((slot, i) => (
                <TouchableOpacity
                  key={slot}
                  style={[s.slot, i === 2 && s.slotCta]}
                  onPress={() => onSlotPress?.(slot)}
                >
                  <Text style={[s.slotTxt, i === 2 && s.slotCtaTxt]}>{slot}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={s.compCard} onPress={onPress} activeOpacity={0.85}>
      <View style={s.compImgWrap}>
        {photo
          ? <Image source={{ uri: photo }} style={s.compImg} resizeMode="cover" />
          : <View style={[s.compImg, s.imgPlaceholder]} />
        }
      </View>
      <View style={s.compBody}>
        <Text style={s.compName} numberOfLines={1}>{r.name}</Text>
        {(rating || r.review_count > 0) && (
          <View style={s.compRatingRow}>
            {rating && <Text style={s.starSm}>★</Text>}
            {rating && <Text style={s.compRating}>{rating}</Text>}
            {r.review_count > 0 && <Text style={s.reviewCount}>({r.review_count})</Text>}
          </View>
        )}
        {!!meta && <Text style={s.compMeta} numberOfLines={1}>{meta}</Text>}
        {!!slots?.length && (
          <View style={s.slotsRowSm}>
            {slots.slice(0, 3).map((slot, i) => (
              <TouchableOpacity
                key={slot}
                style={[s.slotSm, i === 2 && s.slotCtaSm]}
                onPress={() => onSlotPress?.(slot)}
              >
                <Text style={[s.slotSmTxt, i === 2 && s.slotCtaSmTxt]}>{slot}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  imgPlaceholder: { backgroundColor: colors.cardHover },

  // Featured variant
  featCard:    { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: radius.card, overflow: 'hidden', ...shadows.sm },
  featImgWrap: { height: 172 },
  featImg:     { width: '100%', height: '100%' },
  promoBadge:  { position: 'absolute', top: 11, right: 11, backgroundColor: 'rgba(10,10,10,0.72)', borderRadius: radius.sm + 3, paddingHorizontal: spacing.lg - 2, paddingVertical: spacing.xs + 2 },
  promoTxt:    { color: '#FFFFFF', fontSize: typography.size.caption - 0.5, fontWeight: typography.weight.semibold },
  featBody:    { padding: spacing.xl - 1, paddingTop: spacing.lg + 3 },
  featTop:     { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: spacing.lg - 2 },
  featName:    { flex: 1, fontFamily: typography.display, fontSize: typography.size.heading1, fontWeight: typography.weight.bold, color: colors.text, letterSpacing: -0.3 },
  ratingPill:  { flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 0, backgroundColor: colors.tagGreenBg, paddingHorizontal: spacing.sm, paddingVertical: 5, borderRadius: radius.sm + 3 },
  star:        { fontSize: 11, color: colors.gold },
  ratingTxt:   { fontSize: typography.size.body, fontWeight: typography.weight.bold, color: colors.primary },
  featMeta:    { fontSize: typography.size.bodyLg - 0.5, color: colors.textMuted, marginTop: spacing.xs + 2 },
  slotsRow:    { flexDirection: 'row', gap: spacing.sm - 2, marginTop: spacing.lg + 1 },
  slot:        { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.sm + 1, borderRadius: radius.md, backgroundColor: colors.tagGreenBg },
  slotCta:     { backgroundColor: colors.resa },
  slotTxt:     { fontSize: typography.size.body, fontWeight: typography.weight.semibold, color: colors.primary },
  slotCtaTxt:  { color: '#FFFFFF' },

  // Compact variant
  compCard:    { flexDirection: 'row', gap: spacing.lg, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: radius.xl - 2, padding: spacing.lg - 1 },
  compImgWrap: { width: 88, height: 88, flexShrink: 0, borderRadius: radius.lg - 2, overflow: 'hidden' },
  compImg:     { width: '100%', height: '100%' },
  compBody:    { flex: 1, minWidth: 0 },
  compName:    { fontFamily: typography.display, fontSize: typography.size.subheading + 0.5, fontWeight: typography.weight.bold, color: colors.text, letterSpacing: -0.3 },
  compRatingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs + 2, marginTop: spacing.sm - 2 },
  starSm:      { fontSize: 10, color: colors.gold },
  compRating:  { fontSize: typography.size.caption, fontWeight: typography.weight.medium, color: colors.text },
  reviewCount: { fontSize: typography.size.caption, color: colors.textDim },
  compMeta:    { fontSize: typography.size.caption + 0.5, color: colors.textMuted, marginTop: spacing.sm - 1 },
  slotsRowSm:  { flexDirection: 'row', gap: spacing.xs + 1, marginTop: spacing.sm + 1 },
  slotSm:      { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs + 2, backgroundColor: colors.tagGreenBg, borderRadius: radius.sm + 2 },
  slotCtaSm:   { backgroundColor: colors.resa },
  slotSmTxt:   { fontSize: typography.size.sm + 0.5, fontWeight: typography.weight.semibold, color: colors.primary },
  slotCtaSmTxt: { color: '#FFFFFF' },
});
