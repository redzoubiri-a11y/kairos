import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from './Card';
import Badge from './Badge';
import { colors, spacing, typography } from '../theme';
import { TRUCK_TYPE_LABELS } from '../utils/constants';
import { formatDistance, formatVolume, formatWeight } from '../utils/format';

export default function TruckCard({ truck, onPress, style }) {
  return (
    <Card onPress={onPress} style={[styles.card, style]}>
      <View style={styles.header}>
        <View style={styles.iconBox}>
          <Ionicons name="bus" size={22} color={colors.primaryDark} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.company} numberOfLines={1}>
            {truck.transporter?.companyName ?? 'Transporteur'}
          </Text>
          <Text style={styles.plate}>
            {TRUCK_TYPE_LABELS[truck.type] ?? truck.type} • {truck.plateNumber}
          </Text>
        </View>
        {truck.distanceKm !== undefined ? (
          <View style={styles.distance}>
            <Ionicons name="navigate" size={12} color={colors.textMuted} />
            <Text style={styles.distanceText}>{formatDistance(truck.distanceKm)}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.specs}>
        <Spec icon="cube-outline" label="Volume" value={formatVolume(truck.volumeM3)} />
        <Spec icon="barbell-outline" label="Charge" value={formatWeight(truck.capacityKg)} />
        <Spec icon="location-outline" label="Base" value={truck.transporter?.city ?? '—'} />
      </View>

      {truck.transporter?.verificationStatus === 'VERIFIED' ? (
        <Badge status="VERIFIED" label="Transporteur verifie" style={styles.badge} />
      ) : null}
    </Card>
  );
}

function Spec({ icon, label, value }) {
  return (
    <View style={styles.spec}>
      <Ionicons name={icon} size={15} color={colors.textMuted} />
      <Text style={styles.specLabel}>{label}</Text>
      <Text style={styles.specValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center' },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1, marginLeft: spacing.md },
  company: { ...typography.bodyStrong, color: colors.text },
  plate: { ...typography.small, color: colors.textMuted, marginTop: 2 },
  distance: { flexDirection: 'row', alignItems: 'center' },
  distanceText: { ...typography.caption, color: colors.textMuted, marginLeft: 3 },
  specs: {
    flexDirection: 'row',
    marginTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  spec: { flex: 1, alignItems: 'center' },
  specLabel: { ...typography.caption, color: colors.textMuted, marginTop: 4 },
  specValue: { ...typography.small, fontWeight: '700', color: colors.text, marginTop: 2 },
  badge: { marginTop: spacing.md },
});
