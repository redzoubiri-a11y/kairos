import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, spacing, radius, shadow } from '../theme';

export default function Card({ children, style, padded = true }) {
  return <View style={[styles.card, padded && styles.padded, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.sm,
  },
  padded: { padding: spacing.md },
});
