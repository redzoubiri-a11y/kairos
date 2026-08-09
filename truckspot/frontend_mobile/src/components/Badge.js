import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, statusColors, typography } from '../theme';

export default function Badge({ status, label, tone, style }) {
  const preset = statusColors[status];
  const bg = tone?.bg ?? preset?.bg ?? colors.cardMuted;
  const fg = tone?.fg ?? preset?.fg ?? colors.textMuted;

  return (
    <View style={[styles.badge, { backgroundColor: bg }, style]}>
      <Text style={[styles.text, { color: fg }]}>{label ?? preset?.label ?? status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radii.pill,
    alignSelf: 'flex-start',
  },
  text: { ...typography.caption, textTransform: 'uppercase' },
});
