import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../theme';

export default function EmptyState({ titre, message, icone = '✂️' }) {
  return (
    <View style={styles.container}>
      <Text style={styles.icone}>{icone}</Text>
      <Text style={styles.titre}>{titre}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.sm },
  icone: { fontSize: 40 },
  titre: { fontSize: typography.size.lg, fontWeight: typography.weight.semibold, color: colors.textPrimary },
  message: { fontSize: typography.size.sm, color: colors.textSecondary, textAlign: 'center' },
});
