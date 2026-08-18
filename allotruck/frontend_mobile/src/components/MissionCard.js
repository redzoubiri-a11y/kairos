import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from './Card';
import Badge from './Badge';
import { colors, spacing, typography, fonts } from '../theme';
import { formatDateTime, formatPrice, formatVolume, formatWeight } from '../utils/format';

export default function MissionCard({ mission, onPress, counterpartName, style }) {
  return (
    <Card onPress={onPress} style={[styles.card, style]}>
      <View style={styles.header}>
        <Text style={styles.goods} numberOfLines={1}>
          {mission.goodsType}
        </Text>
        <Badge status={mission.status} />
      </View>

      <View style={styles.routeRow}>
        <Ionicons name="arrow-forward-circle-outline" size={16} color={colors.textMuted} />
        <Text style={styles.route} numberOfLines={1}>
          {mission.pickupCity} → {mission.dropoffCity}
        </Text>
      </View>

      <Text style={styles.date}>{formatDateTime(mission.pickupAt)}</Text>

      <View style={styles.footer}>
        <Text style={styles.detail}>
          {formatVolume(mission.volumeM3)} • {formatWeight(mission.weightKg)}
        </Text>
        <Text style={styles.budget}>{formatPrice(mission.budgetDzd)}</Text>
      </View>

      {counterpartName ? (
        <View style={styles.counterpart}>
          <Ionicons name="person-outline" size={13} color={colors.textMuted} />
          <Text style={styles.counterpartText} numberOfLines={1}>
            {counterpartName}
          </Text>
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  goods: { ...typography.h3, color: colors.text, flex: 1, marginRight: spacing.sm },
  routeRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm },
  route: { ...typography.body, color: colors.text, marginLeft: 6, flex: 1 },
  date: { fontFamily: fonts.mono, fontSize: 11, color: colors.textMuted, marginTop: 4 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  detail: { fontFamily: fonts.mono, fontSize: 11, color: colors.textMuted },
  budget: { ...typography.bodyStrong, color: colors.primaryDark, fontWeight: '800' },
  counterpart: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm },
  counterpartText: { ...typography.caption, color: colors.textMuted, marginLeft: 4, fontWeight: '400' },
});
