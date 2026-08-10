import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '../src/theme';

export default function MapScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>🗺️ La carte est disponible uniquement sur mobile.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  text: { color: colors.text, fontSize: typography.size.heading1, textAlign: 'center', padding: spacing.xxl },
});
