import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '../theme';

export default function MHeader({ title, sub, showBack, onBack, rightComponent }) {
  return (
    <View style={styles.container}>
      {showBack ? (
        <TouchableOpacity
          onPress={onBack}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.backButton}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
      ) : null}
      <View style={styles.titleContainer}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        {sub ? <Text style={styles.sub} numberOfLines={1}>{sub}</Text> : null}
      </View>
      {rightComponent ? <View style={styles.right}>{rightComponent}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    paddingTop: spacing.xxl,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
    backgroundColor: colors.bg,
    gap: spacing.lg,
  },
  backButton: {
    flexShrink: 0,
  },
  backIcon: {
    fontSize: typography.size.title,
    color: colors.textMuted,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: typography.size.heading3,
    fontWeight: typography.weight.extrabold,
    color: colors.text,
  },
  sub: {
    fontSize: typography.size.sm,
    color: colors.textMuted,
    marginTop: spacing.xxs,
  },
  right: {
    flexShrink: 0,
  },
});
