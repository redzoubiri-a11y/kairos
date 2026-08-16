import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, typography, spacing, radius, shadows } from '../theme';
import PhotoCarouselHero from './PhotoCarouselHero';

export default function RestaurantCard({ r, variant = 'compact', distance, slots, promo, onPress, onSlotPress }) {
  const isFeatured = variant === 'featured';
  const rating = r.avg_rating > 0 ? Number(r.avg_rating).toFixed(1).replace('.', ',') : null;
  const meta = [r.quartier, distance].filter(Boolean).join(' · ');
  const imgHeight = isFeatured ? 300 : 170;

  return (
    <TouchableOpacity style={isFeatured ? s.featCard : s.compCard} onPress={onPress} activeOpacity={0.9}>
      <View>
        <PhotoCarouselHero restaurant={r} height={imgHeight} showPrevArrow />
        {!!promo && (
          <View style={s.promoBadge}>
            <Text style={s.promoTxt}>{promo}</Text>
          </View>
        )}
      </View>
      <View style={isFeatured ? s.featBody : s.compBody}>
        <View style={s.top}>
          <Text style={isFeatured ? s.featName : s.compName} numberOfLines={1}>{r.name}</Text>
          {rating && (
            <View style={s.ratingPill}>
              <Text style={s.ratingTxt}>{rating}</Text>
              {r.review_count > 0 && <Text style={s.reviewCount}>({r.review_count})</Text>}
            </View>
          )}
        </View>
        {!!meta && <Text style={isFeatured ? s.featMeta : s.compMeta} numberOfLines={1}>{meta}</Text>}
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

const s = StyleSheet.create({
  featCard: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: radius.card, overflow: 'hidden', ...shadows.md },
  compCard: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: radius.card, overflow: 'hidden' },

  promoBadge: { position: 'absolute', top: 11, right: 11, backgroundColor: 'rgba(10,10,10,0.72)', borderRadius: radius.sm + 3, paddingHorizontal: spacing.lg - 2, paddingVertical: spacing.xs + 2 },
  promoTxt:   { fontFamily: typography.bodySemibold, color: '#FFFFFF', fontSize: typography.size.caption - 0.5 },

  featBody: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg + 3, paddingBottom: spacing.xl },
  compBody: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg - 1, paddingBottom: spacing.lg },

  top:      { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: spacing.lg - 2 },
  featName: { flex: 1, fontFamily: typography.display, fontSize: 18, color: colors.text, letterSpacing: -0.3 },
  compName: { flex: 1, fontFamily: typography.display, fontSize: typography.size.subheading + 0.5, color: colors.text, letterSpacing: -0.3 },

  ratingPill:  { flexDirection: 'row', alignItems: 'center', gap: 3, flexShrink: 0, backgroundColor: colors.tagGreenBg, paddingHorizontal: spacing.sm, paddingVertical: 5, borderRadius: radius.sm + 3 },
  ratingTxt:   { fontFamily: typography.bodyBold, fontSize: typography.size.body, color: colors.statusConfirmedText },
  reviewCount: { fontFamily: typography.body, fontSize: typography.size.caption, color: colors.statusConfirmedText, opacity: 0.7 },

  featMeta: { fontFamily: typography.body, fontSize: typography.size.bodyLg - 0.5, color: colors.textMuted, marginTop: spacing.xs + 2 },
  compMeta: { fontFamily: typography.body, fontSize: typography.size.caption + 0.5, color: colors.textMuted, marginTop: spacing.sm - 1 },

  slotsRow:   { flexDirection: 'row', gap: spacing.sm - 2, marginTop: spacing.lg + 1 },
  slot:       { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.sm + 1, borderRadius: radius.md, backgroundColor: colors.tagGreenBg },
  slotCta:    { backgroundColor: colors.resa },
  slotTxt:    { fontFamily: typography.bodySemibold, fontSize: typography.size.body, color: colors.statusConfirmedText },
  slotCtaTxt: { color: '#FFFFFF' },
});
