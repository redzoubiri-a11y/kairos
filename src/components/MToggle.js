import React, { useRef, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '../theme';

export default function MToggle({ label, sub, value, onValueChange }) {
  const translateX = useRef(new Animated.Value(value ? 16 : 0)).current;

  const handlePress = useCallback(() => onValueChange && onValueChange(!value), [onValueChange, value]);

  useEffect(() => {
    Animated.spring(translateX, {
      toValue: value ? 16 : 0,
      useNativeDriver: true,
    }).start();
  }, [value]);

  return (
    <View style={styles.container}>
      <View style={styles.labelContainer}>
        <Text style={styles.label}>{label}</Text>
        {sub ? <Text style={styles.sub}>{sub}</Text> : null}
      </View>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.8}
        style={[styles.track, value && styles.trackActive]}
      >
        <Animated.View
          style={[
            styles.thumb,
            value && styles.thumbActive,
            { transform: [{ translateX }] },
          ]}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  labelContainer: {
    flex: 1,
    marginRight: spacing.xl,
  },
  label: {
    fontSize: typography.size.body,
    color: colors.text,
  },
  sub: {
    fontSize: typography.size.sm,
    color: colors.textDim,
    marginTop: spacing.xxs,
  },
  track: {
    width: 38,
    height: 22,
    borderRadius: 0,
    backgroundColor: colors.cardBorder,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  trackActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accentDim,
  },
  thumb: {
    width: 16,
    height: 16,
    borderRadius: 0,
    backgroundColor: colors.textDim,
  },
  thumbActive: {
    backgroundColor: colors.text,
  },
});
