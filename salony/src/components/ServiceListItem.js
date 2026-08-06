import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, spacing, radius, typography } from '../theme';

export default function ServiceListItem({ service, selected = false, onToggle }) {
  return (
    <Pressable
      onPress={() => onToggle?.(service)}
      style={[styles.row, selected && styles.rowSelected]}
    >
      <View style={styles.info}>
        <Text style={styles.nom}>{service.nom}</Text>
        <Text style={styles.duree}>{service.duree_min} min</Text>
      </View>
      <Text style={styles.prix}>{service.prix} DA</Text>
      <View style={[styles.checkbox, selected && styles.checkboxSelected]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  rowSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  info: { flex: 1 },
  nom: { fontSize: typography.size.md, fontWeight: typography.weight.medium, color: colors.textPrimary },
  duree: { fontSize: typography.size.sm, color: colors.textSecondary, marginTop: 2 },
  prix: { fontSize: typography.size.md, fontWeight: typography.weight.semibold, color: colors.textPrimary },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  checkboxSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
});
