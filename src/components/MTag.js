import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { tagVariants, typography, radius, spacing } from '../theme';

export default function MTag({ children, variant = 'default', size = 'md' }) {
  const v = tagVariants[variant] || tagVariants.default;

  return (
    <View style={[styles.base, { backgroundColor: v.bg }, size === 'sm' && styles.sm]}>
      <Text style={[styles.text, { color: v.text }, size === 'sm' && styles.textSm]}>
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.pill,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.lg,
    alignSelf: 'flex-start',
  },
  sm: {
    paddingVertical: spacing.xxs,
    paddingHorizontal: spacing.md,
  },
  text: {
    fontSize: typography.size.caption,
    fontWeight: typography.weight.bold,
  },
  textSm: {
    fontSize: typography.size.sm,
  },
});
