import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useI18n } from '../i18n';

/**
 * Tuile de KPI (§5.2) — un chiffre principal, pas de graphique.
 * La variation est signalée par une icône + un signe, jamais par la couleur seule.
 */
export default function KpiCard({ label, value, delta, deltaSuffix = '%', icon, tone = 'neutral', width }) {
  const { colors, typography, spacing, radii } = useTheme();
  const { dir, align } = useI18n();

  const hasDelta = delta != null && delta !== 0;
  const up = Number(delta) > 0;
  const deltaColor = up ? colors.primary : colors.accent;

  const iconTone =
    tone === 'gold' ? colors.gold : tone === 'secondary' ? colors.secondary : colors.primary;
  const iconBg =
    tone === 'gold' ? colors.goldLight : tone === 'secondary' ? colors.secondaryLight : colors.primaryLight;

  return (
    <View
      style={{
        width,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radii.xl,
        padding: spacing.lg,
        gap: spacing.sm,
      }}
    >
      <View style={{ flexDirection: dir, alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={[typography.caption, { color: colors.warmGray, flex: 1, textAlign: align }]} numberOfLines={2}>
          {label}
        </Text>
        {icon ? (
          <View
            style={{
              width: 26,
              height: 26,
              borderRadius: radii.md,
              backgroundColor: iconBg,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name={icon} size={14} color={iconTone} />
          </View>
        ) : null}
      </View>

      <Text style={[typography.h2, { color: colors.dark, textAlign: align }]} numberOfLines={1}>
        {value}
      </Text>

      {hasDelta ? (
        <View style={{ flexDirection: dir, alignItems: 'center', gap: 3 }}>
          <Ionicons name={up ? 'arrow-up' : 'arrow-down'} size={11} color={deltaColor} />
          <Text style={[typography.caption, { color: deltaColor }]}>
            {up ? '+' : ''}
            {delta}
            {deltaSuffix}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
