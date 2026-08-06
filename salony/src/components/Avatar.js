import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { colors, radius, typography } from '../theme';

export default function Avatar({ uri, nom = '', size = 44 }) {
  const initiales = nom
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const dimStyle = { width: size, height: size, borderRadius: radius.pill };

  if (uri) {
    return <Image source={{ uri }} style={[styles.image, dimStyle]} />;
  }

  return (
    <View style={[styles.fallback, dimStyle]}>
      <Text style={[styles.initiales, { fontSize: size * 0.4 }]}>{initiales || '?'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: { backgroundColor: colors.surfaceAlt },
  fallback: {
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initiales: {
    color: colors.primaryDark,
    fontWeight: typography.weight.bold,
  },
});
