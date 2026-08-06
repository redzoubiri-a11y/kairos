import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { colors, spacing, radius, typography } from '../theme';

export default function TimeSlotButton({ heure, selected, disabled, onPress }) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.slot,
        selected && styles.slotSelected,
        disabled && styles.slotDisabled,
      ]}
    >
      <Text style={[styles.text, selected && styles.textSelected, disabled && styles.textDisabled]}>
        {heure}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  slot: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  slotSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  slotDisabled: { backgroundColor: colors.surfaceAlt, borderColor: colors.surfaceAlt },
  text: { fontSize: typography.size.sm, fontWeight: typography.weight.medium, color: colors.textPrimary },
  textSelected: { color: colors.textInverse },
  textDisabled: { color: colors.textDisabled },
});
