import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, typography } from '../theme';

const SIZE_MAP = {
  sm: 12,
  md: 16,
  lg: 22,
};

export default function MStars({ rating = 0, size = 'md', interactive = false, onRate }) {
  const fontSize = SIZE_MAP[size] || SIZE_MAP.md;

  return (
    <View style={styles.container}>
      {[1, 2, 3, 4, 5].map(i => {
        const filled = i <= Math.floor(rating);
        const half = !filled && i - 0.5 <= rating;

        return (
          <TouchableOpacity
            key={i}
            disabled={!interactive}
            onPress={() => interactive && onRate && onRate(i)}
            activeOpacity={interactive ? 0.7 : 1}
          >
            <Text style={[
              styles.star,
              { fontSize },
              filled || half ? styles.filled : styles.empty,
            ]}>
              {filled ? '★' : half ? '⭑' : '☆'}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  star: {
    fontWeight: typography.weight.bold,
  },
  filled: {
    color: colors.accent,
  },
  empty: {
    color: colors.textDim,
  },
});
