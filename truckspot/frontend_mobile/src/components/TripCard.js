import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from './Card';
import Badge from './Badge';
import { colors, spacing, typography } from '../theme';
import { formatDateTime, formatPrice, formatVolume, formatWeight } from '../utils/format';

export default function TripCard({ trip, onPress, showStatus = false, style }) {
  return (
    <Card onPress={onPress} style={[styles.card, style]}>
      <View style={styles.route}>
        <View style={styles.routeLine}>
          <View style={styles.dotOrigin} />
          <View style={styles.line} />
          <Ionicons name="location" size={14} color={colors.primaryDark} />
        </View>
        <View style={styles.routeText}>
          <Text style={styles.city}>{trip.originCity}</Text>
          <Text style={styles.date}>{formatDateTime(trip.departureAt)}</Text>
          <Text style={[styles.city, styles.cityDest]}>{trip.destinationCity}</Text>
        </View>
        {showStatus ? <Badge status={trip.status} /> : null}
      </View>

      <View style={styles.footer}>
        <View style={styles.metric}>
          <Text style={styles.metricValue}>{formatVolume(trip.freeVolumeM3)}</Text>
          <Text style={styles.metricLabel}>libre</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricValue}>{formatWeight(trip.freeWeightKg)}</Text>
          <Text style={styles.metricLabel}>charge</Text>
        </View>
        <View style={styles.metric}>
          <Text style={[styles.metricValue, styles.price]}>{formatPrice(trip.pricePerM3)}</Text>
          <Text style={styles.metricLabel}>par m³</Text>
        </View>
      </View>

      {trip.goodsTypes?.length ? (
        <View style={styles.tags}>
          {trip.goodsTypes.map((g) => (
            <View key={g} style={styles.tag}>
              <Text style={styles.tagText}>{g}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.md },
  route: { flexDirection: 'row', alignItems: 'flex-start' },
  routeLine: { alignItems: 'center', paddingTop: 4, marginRight: spacing.md },
  dotOrigin: { width: 10, height: 10, borderRadius: 5, borderWidth: 2.5, borderColor: colors.primary },
  line: { width: 2, height: 26, backgroundColor: colors.border, marginVertical: 2 },
  routeText: { flex: 1 },
  city: { ...typography.bodyStrong, color: colors.text },
  cityDest: { marginTop: 14 },
  date: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  footer: {
    flexDirection: 'row',
    marginTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  metric: { flex: 1 },
  metricValue: { ...typography.small, fontWeight: '700', color: colors.text },
  price: { color: colors.primaryDark },
  metricLabel: { ...typography.caption, color: colors.textMuted, fontWeight: '400' },
  tags: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.md },
  tag: {
    backgroundColor: colors.cardMuted,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginRight: 6,
    marginTop: 4,
  },
  tagText: { ...typography.caption, color: colors.textMuted },
});
