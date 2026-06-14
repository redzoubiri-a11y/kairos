import React, { useRef, useEffect, useMemo } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { colors, radius } from '../theme';

export default function MLoader({ width = '100%', height = 100, borderRadius = radius.xl, style }) {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 800, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  const opacity = useMemo(() => shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  }), []);

  return (
    <Animated.View
      style={[
        styles.base,
        { width, height, borderRadius, opacity },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.cardBorder,
  },
});
