import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, typography, spacing, radius } from '../theme';

const OPTIONS = [
  { id: 'reserve', label: 'Réserver' },
  { id: 'order',   label: 'Commander' },
];

// Bascule d'intention Réserver/Commander — Lot 1.
// État actif : fond or (colors.star) + texte vert pin (colors.anchorGreen), cf. règle
// d'usage de la palette dans theme.js — le seul endroit de l'app où colors.star sert de fond.
export default function IntentToggle({ mode, onChange }) {
  return (
    <View style={s.track}>
      {OPTIONS.map(o => {
        const active = o.id === mode;
        return (
          <TouchableOpacity
            key={o.id}
            style={[s.segment, active && s.segmentActive]}
            onPress={() => onChange(o.id)}
            activeOpacity={0.85}
          >
            <Text style={[s.label, active && s.labelActive]}>{o.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  track: {
    flexDirection: 'row',
    backgroundColor: colors.bgPaper,
    borderWidth: 1,
    borderColor: colors.borderPaper,
    borderRadius: radius.pill,
    padding: spacing.xxs,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
  },
  segmentActive: {
    backgroundColor: colors.star,
  },
  label: {
    fontFamily: typography.bodyBold,
    fontSize: typography.size.subheading,
    color: colors.textSecondaryPaper,
  },
  labelActive: {
    color: colors.anchorGreen,
  },
});
