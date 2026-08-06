import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../theme';

export default function RatingStars({ note = 0, nbAvis, size = 14 }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.star, { fontSize: size }]}>★</Text>
      <Text style={styles.note}>{note.toFixed(1)}</Text>
      {typeof nbAvis === 'number' && <Text style={styles.nbAvis}>({nbAvis})</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  star: { color: colors.accent },
  note: { fontSize: typography.size.sm, fontWeight: typography.weight.semibold, color: colors.textPrimary },
  nbAvis: { fontSize: typography.size.sm, color: colors.textSecondary },
});
