import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, statusColors, typography } from '../theme';

// Deux traitements, selon qu'un jugement a ete rendu ou non (voir
// statusColors[...].sealed dans le theme) : une etiquette plate pour ce qui
// bouge encore, un tampon (bordure epaisse + leger pivot) pour ce qui est
// tranche. Jamais de fond colore dans les deux cas — la couleur porte le
// texte et la bordure, jamais un aplat.
export default function Badge({ status, label, tone, sealed, style }) {
  const preset = statusColors[status];
  const fg = tone?.fg ?? preset?.fg ?? colors.textMuted;
  const border = tone?.border ?? preset?.border ?? colors.border;
  const isSealed = sealed ?? preset?.sealed ?? false;

  return (
    <View
      style={[
        styles.badge,
        { borderColor: isSealed ? fg : border, borderWidth: isSealed ? 1.5 : 1 },
        isSealed && styles.sealed,
        style,
      ]}
    >
      <Text style={[styles.text, { color: fg }]}>{label ?? preset?.label ?? status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radii.xs,
    backgroundColor: 'transparent',
    alignSelf: 'flex-start',
  },
  sealed: { transform: [{ rotate: '-2deg' }] },
  text: { ...typography.caption, textTransform: 'uppercase' },
});
