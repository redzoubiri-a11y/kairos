import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, typography } from '../theme';

// Rendered inside a <Marker>, so it must stay a pure view with no touch handling.
export default function TruckPin({ label, selected = false, available = true, live = false }) {
  const bg = !available ? colors.textMuted : selected ? colors.primaryDark : colors.primary;

  return (
    <View style={styles.wrapper}>
      <View style={[styles.pin, { backgroundColor: bg }, selected && styles.pinSelected]}>
        <Ionicons name="cube" size={selected ? 18 : 15} color="#1A1206" />
        {label ? (
          <Text style={styles.label} numberOfLines={1}>
            {label}
          </Text>
        ) : null}
        {/* Une epingle immobile depuis des heures ne doit pas se lire comme un
            camion qui roule. */}
        {live ? <View style={styles.livePulse} /> : null}
      </View>
      <View style={[styles.tail, { borderTopColor: bg }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center' },
  pin: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: radii.pill,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  pinSelected: { transform: [{ scale: 1.12 }] },
  livePulse: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginLeft: 5,
    backgroundColor: colors.success,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  label: { ...typography.caption, color: '#1A1206', marginLeft: 4, maxWidth: 70 },
  tail: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -1,
  },
});
