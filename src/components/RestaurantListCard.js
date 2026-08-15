import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, typography, spacing, radius, shadows } from '../theme';
import PhotoCarouselHero from './PhotoCarouselHero';
import { mvpSlots } from '../utils/openingHours';

const AMENITY_LABELS = {
  espace_famille: 'Espace famille',
  terrasse:       'Terrasse',
  parking:        'Parking',
  salle_fete:     'Salle fête',
};

// Carte de résultat Home — Lot 1. `mode` pilote le bas de carte : créneaux (MVP, non réels,
// cf. useHomeSearch/useMostViewed) en Réserver, temps d'attente (placeholder) en Commander.
export default function RestaurantListCard({ r, mode = 'reserve', onPress }) {
  const rating = r.avg_rating > 0 ? Number(r.avg_rating).toFixed(1).replace('.', ',') : null;
  const meta = [r.quartier, r.avg_ticket > 0 ? `${r.avg_ticket.toLocaleString('fr-FR')} DA` : null]
    .filter(Boolean).join(' · ');
  const amenities = Object.keys(AMENITY_LABELS).filter(k => r[k]);
  const slots = mode === 'reserve' ? mvpSlots(r.opening_hours) : [];

  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.9}>
      <PhotoCarouselHero restaurant={r} height={150} />
      <View style={s.body}>
        <View style={s.top}>
          <Text style={s.name} numberOfLines={1}>{r.name}</Text>
          {rating && (
            <View style={s.ratingPill}>
              <Text style={s.ratingTxt}>{rating}</Text>
            </View>
          )}
        </View>
        {!!meta && <Text style={s.meta} numberOfLines={1}>{meta}</Text>}

        {amenities.length > 0 && (
          <View style={s.amenitiesRow}>
            {amenities.map(k => (
              <View key={k} style={s.amenityChip}>
                <Text style={s.amenityTxt}>{AMENITY_LABELS[k]}</Text>
              </View>
            ))}
          </View>
        )}

        {mode === 'reserve' ? (
          slots.length > 0 && (
            <View style={s.slotsRow}>
              {slots.map(slot => (
                <View key={slot} style={s.slot}>
                  <Text style={s.slotTxt}>{slot}</Text>
                </View>
              ))}
            </View>
          )
        ) : (
          <View style={s.waitRow}>
            <Text style={s.waitTxt}>⏱ ~15–20 min d'attente</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: radius.card, overflow: 'hidden', ...shadows.sm },
  body: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg - 1, paddingBottom: spacing.lg },

  top:  { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: spacing.lg - 2 },
  name: { flex: 1, fontFamily: typography.display, fontSize: typography.size.subheading + 0.5, color: colors.textPrimary, letterSpacing: -0.3 },

  ratingPill: { flexShrink: 0, backgroundColor: colors.tagGreenBg, paddingHorizontal: spacing.sm, paddingVertical: 5, borderRadius: radius.sm + 3 },
  ratingTxt:  { fontFamily: typography.bodyBold, fontSize: typography.size.body, color: colors.primary },

  meta: { fontFamily: typography.body, fontSize: typography.size.caption + 0.5, color: colors.textSecondaryPaper, marginTop: spacing.sm - 1 },

  amenitiesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.sm + 1 },
  amenityChip:  { backgroundColor: colors.tagNeutralBg, borderRadius: radius.sm + 3, paddingHorizontal: spacing.sm, paddingVertical: 4 },
  amenityTxt:   { fontFamily: typography.bodyMedium, fontSize: typography.size.caption - 0.5, color: colors.textTertiaryPaper },

  slotsRow: { flexDirection: 'row', gap: spacing.sm - 2, marginTop: spacing.lg - 2 },
  slot:     { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.sm + 1, borderRadius: radius.md, backgroundColor: colors.tagGreenBg },
  slotTxt:  { fontFamily: typography.bodySemibold, fontSize: typography.size.body, color: colors.primary },

  waitRow: { marginTop: spacing.lg - 2 },
  waitTxt: { fontFamily: typography.bodyMedium, fontSize: typography.size.body, color: colors.textSecondaryPaper },
});
