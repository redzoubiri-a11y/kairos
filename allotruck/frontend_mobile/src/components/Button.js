import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, shadows, spacing, fonts } from '../theme';

const VARIANTS = {
  primary: { bg: colors.primary, fg: '#FFFFFF', border: 'transparent', shadow: shadows.accent },
  secondary: { bg: 'transparent', fg: colors.primary, border: colors.primary },
  ghost: { bg: 'transparent', fg: colors.textMuted, border: 'transparent' },
  danger: { bg: colors.danger, fg: '#FFFFFF', border: 'transparent' },
  success: { bg: colors.success, fg: '#FFFFFF', border: 'transparent' },
  dark: { bg: colors.text, fg: colors.textInverse, border: 'transparent' },
};

const SIZES = {
  sm: { paddingVertical: 8, paddingHorizontal: 14, fontSize: 13, icon: 15, radius: radii.button },
  md: { paddingVertical: 14, paddingHorizontal: 20, fontSize: 15, icon: 18, radius: radii.button },
  lg: { paddingVertical: 17, paddingHorizontal: 24, fontSize: 16, icon: 20, radius: radii.buttonLg },
};

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  fullWidth = true,
  style,
}) {
  const v = VARIANTS[variant] ?? VARIANTS.primary;
  const s = SIZES[size] ?? SIZES.md;
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      onPress={isDisabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.base,
        v.shadow,
        {
          backgroundColor: v.bg,
          borderColor: v.border,
          borderRadius: s.radius,
          paddingVertical: s.paddingVertical,
          paddingHorizontal: s.paddingHorizontal,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
          opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.fg} size="small" />
      ) : (
        <View style={styles.content}>
          {icon && iconPosition === 'left' ? (
            <Ionicons name={icon} size={s.icon} color={v.fg} style={styles.iconLeft} />
          ) : null}
          <Text style={[styles.label, { color: v.fg, fontSize: s.fontSize }]} numberOfLines={1}>
            {title}
          </Text>
          {icon && iconPosition === 'right' ? (
            <Ionicons name={icon} size={s.icon} color={v.fg} style={styles.iconRight} />
          ) : null}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  content: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  label: { fontFamily: fonts.bodyBold },
  iconLeft: { marginRight: spacing.sm },
  iconRight: { marginLeft: spacing.sm },
});
