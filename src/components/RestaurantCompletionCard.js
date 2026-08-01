import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, typography, spacing, radius } from '../theme';
import { fetchCompletion } from '../utils/restaurantCompletion';

const FIELD_SCREEN = {
  photos:       'ProPhotos',
  description:  'ProInfo',
  cuisine_type: 'ProInfo',
  avg_ticket:   'ProInfo',
  phone:        'ProInfo',
  menu:         'ProMenu',
  schedule:     'ProHoraires',
};

export default function RestaurantCompletionCard({ navigation, restaurantId, refreshKey }) {
  const [completion, setCompletion] = useState(null);

  useEffect(() => {
    if (!restaurantId) return;
    let cancelled = false;
    fetchCompletion(restaurantId).then(c => { if (!cancelled) setCompletion(c); });
    return () => { cancelled = true; };
  }, [restaurantId, refreshKey]);

  if (!completion || completion.score >= 100) return null;

  const goField = (key) => {
    const screen = FIELD_SCREEN[key];
    if (!screen) return;
    navigation.navigate(screen, screen === 'ProPhotos' ? { restaurantId } : undefined);
  };

  return (
    <View style={s.card}>
      <View style={s.headRow}>
        <Text style={s.title}>Votre fiche est complète à {completion.score}%</Text>
        <Text style={s.sub}>{completion.done}/{completion.total} critères remplis</Text>
      </View>
      <View style={s.track}>
        <View style={[s.fill, { width: `${completion.score}%` }]} />
      </View>
      {completion.missing.length > 0 && (
        <View style={s.chips}>
          {completion.missing.map(f => (
            <TouchableOpacity key={f.key} style={s.chip} onPress={() => goField(f.key)}>
              <Text style={s.chipTxt}>+ {f.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  card:    { marginHorizontal: spacing.xxl, marginTop: spacing.lg, padding: spacing.xl, borderRadius: radius.xxl, backgroundColor: 'rgba(200,151,90,0.10)', borderWidth: 1, borderColor: 'rgba(200,151,90,0.30)' },
  headRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: spacing.md },
  title:   { color: '#F5F2EC', fontSize: typography.size.subheading, fontWeight: typography.weight.semibold },
  sub:     { color: 'rgba(245,242,236,0.50)', fontSize: typography.size.xs },
  track:   { height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.10)', overflow: 'hidden', marginBottom: spacing.md },
  fill:    { height: '100%', backgroundColor: '#c8975a', borderRadius: 3 },
  chips:   { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip:    { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.full, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  chipTxt: { color: 'rgba(245,242,236,0.80)', fontSize: typography.size.xs },
});
