import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useI18n } from '../i18n';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

/**
 * Saisie du PIN à 4 chiffres — signature digitale du pro (§2.3, §10.1).
 * Le PIN n'est jamais affiché en clair : seuls des points de progression le sont.
 */
export default function PinPad({ value, onChange, onComplete, error, label }) {
  const { colors, typography, spacing, radii } = useTheme();
  const { t } = useI18n();

  const press = (key) => {
    if (key === 'del') {
      onChange(value.slice(0, -1));
      return;
    }
    if (!key || value.length >= 4) return;

    const next = value + key;
    onChange(next);
    if (next.length === 4 && onComplete) {
      onComplete(next);
    }
  };

  return (
    <View style={{ gap: spacing.lg, alignItems: 'center' }}>
      <Text style={[typography.secondary, { color: colors.warmGray, textAlign: 'center' }]}>
        {label ?? t('pro.pinHint')}
      </Text>

      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        {[0, 1, 2, 3].map((i) => (
          <View
            key={i}
            style={{
              width: 16,
              height: 16,
              borderRadius: radii.pill,
              borderWidth: 1.5,
              borderColor: error ? colors.accent : value.length > i ? colors.primaryInk : colors.border,
              backgroundColor: value.length > i ? (error ? colors.accent : colors.primaryInk) : 'transparent',
            }}
          />
        ))}
      </View>

      {error ? (
        <Text style={[typography.caption, { color: colors.accent }]}>{error}</Text>
      ) : null}

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', width: 246, gap: spacing.sm }}>
        {KEYS.map((k, i) => (
          <Pressable
            key={`${k}-${i}`}
            onPress={() => press(k)}
            disabled={!k}
            accessibilityRole="button"
            accessibilityLabel={k === 'del' ? 'Effacer' : k}
            style={({ pressed }) => ({
              width: 74,
              height: 52,
              borderRadius: radii.lg,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: !k ? 'transparent' : pressed ? colors.primaryLight : colors.surface,
              borderWidth: k ? 1 : 0,
              borderColor: colors.border,
            })}
          >
            {k === 'del' ? (
              <Ionicons name="backspace-outline" size={20} color={colors.warmGray} />
            ) : (
              <Text style={[typography.h3, { color: colors.dark }]}>{k}</Text>
            )}
          </Pressable>
        ))}
      </View>
    </View>
  );
}
