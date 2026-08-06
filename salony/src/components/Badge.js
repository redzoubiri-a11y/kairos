import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { spacing, radius, typography, bookingStatusMeta } from '../theme';
import { useT } from '../i18n';

// Badge générique
export function Badge({ label, color, backgroundColor, style }) {
  return (
    <View style={[styles.badge, { backgroundColor }, style]}>
      <Text style={[styles.label, { color }]}>{label}</Text>
    </View>
  );
}

// Badge spécialisé pour un statut de réservation
export function BookingStatusBadge({ statut, style }) {
  const t = useT();
  const cle = bookingStatusMeta[statut] ? statut : 'en_attente';
  const meta = bookingStatusMeta[cle];
  return (
    <Badge label={t(`statuts.${cle}`)} color={meta.color} backgroundColor={meta.bg} style={style} />
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs / 2,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
  },
  label: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
  },
});

export default Badge;
