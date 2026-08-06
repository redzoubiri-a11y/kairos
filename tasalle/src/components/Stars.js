import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

/** Affichage d'une note en étoiles (or maghrébin, §3.1). */
export function Stars({ value = 0, size = 14, showValue = false, count }) {
  const { colors, typography } = useTheme();
  const rounded = Math.round((Number(value) || 0) * 2) / 2;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <View style={{ flexDirection: 'row', gap: 1 }}>
        {[1, 2, 3, 4, 5].map((i) => {
          const name = rounded >= i ? 'star' : rounded >= i - 0.5 ? 'star-half' : 'star-outline';
          return <Ionicons key={i} name={name} size={size} color={colors.goldMark} />;
        })}
      </View>
      {showValue ? (
        <Text style={[typography.caption, { color: colors.warmGray }]}>
          {Number(value).toFixed(1)}
          {count != null ? ` (${count})` : ''}
        </Text>
      ) : null}
    </View>
  );
}

/** Sélecteur de note interactif — §7.1 (5 étoiles). */
export function StarPicker({ value = 0, onChange, size = 30, label }) {
  const { colors, typography, spacing } = useTheme();

  return (
    <View style={{ gap: spacing.xs }}>
      {label ? <Text style={[typography.secondary, { color: colors.dark }]}>{label}</Text> : null}
      <View style={{ flexDirection: 'row', gap: spacing.xs }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Pressable
            key={i}
            onPress={() => onChange(i)}
            accessibilityRole="button"
            accessibilityLabel={`${i} / 5`}
            hitSlop={4}
          >
            <Ionicons
              name={value >= i ? 'star' : 'star-outline'}
              size={size}
              color={value >= i ? colors.goldMark : colors.border}
            />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export default Stars;
