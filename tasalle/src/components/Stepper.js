import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useI18n } from '../i18n';

/** Timeline du parcours de réservation — §4.4 (Date → Formule → Infos → Envoi). */
export default function Stepper({ steps, current }) {
  const { colors, typography, spacing, radii } = useTheme();

  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: spacing.xs }}>
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        const bg = done || active ? colors.primary : colors.surface;
        const fg = done || active ? colors.onPrimary : colors.warmGray;

        return (
          <View key={label} style={{ flex: 1, alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%' }}>
              {/* trait gauche */}
              <View
                style={{
                  flex: 1,
                  height: 2,
                  backgroundColor: i === 0 ? 'transparent' : done || active ? colors.primary : colors.border,
                }}
              />
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: radii.pill,
                  backgroundColor: bg,
                  borderWidth: 1,
                  borderColor: done || active ? colors.primary : colors.border,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {done ? (
                  <Ionicons name="checkmark" size={13} color={fg} />
                ) : (
                  <Text style={{ fontSize: 11, fontWeight: '600', fontFamily: 'Archivo_600SemiBold', color: fg }}>{i + 1}</Text>
                )}
              </View>
              {/* trait droit */}
              <View
                style={{
                  flex: 1,
                  height: 2,
                  backgroundColor:
                    i === steps.length - 1 ? 'transparent' : i < current ? colors.primary : colors.border,
                }}
              />
            </View>

            <Text
              style={[
                typography.caption,
                {
                  marginTop: 5,
                  color: active ? colors.primaryInk : colors.warmGray,
                  fontWeight: active ? '600' : '500',
                  textAlign: 'center',
                },
              ]}
              numberOfLines={1}
            >
              {label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
