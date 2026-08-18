import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../theme';

export default function SplashScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.logo}>
        <Ionicons name="bus" size={44} color="#FFFFFF" />
      </View>
      <Text style={styles.brand}>AlloTruck</Text>
      <Text style={styles.tagline}>Le fret en temps reel</Text>
      <ActivityIndicator color={colors.primary} style={styles.loader} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  logo: {
    width: 88,
    height: 88,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: { ...typography.h1, color: colors.text, marginTop: spacing.lg },
  tagline: { ...typography.small, color: colors.textMuted, marginTop: spacing.xs },
  loader: { marginTop: spacing.xxl },
});
