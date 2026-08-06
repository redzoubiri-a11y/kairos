import { useMemo } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useI18n } from '../i18n';
import { monthGrid, fromISODate } from '../lib/format';

/**
 * Calendrier mensuel 7 colonnes — §4.4 étape 1 (client) et §5.3 (planning pro).
 *
 * `availability` associe une date ISO à un état :
 *   past | available | held | booked | blocked
 * `variant` = 'client' (les jours non disponibles sont inertes)
 *           | 'pro'    (tous les jours sont cliquables)
 */
export default function Calendar({
  year,
  month,
  availability = {},
  selected,
  onSelect,
  onChangeMonth,
  variant = 'client',
  markers = {},
}) {
  const { colors, typography, spacing, radii } = useTheme();
  const { t, list } = useI18n();

  const months = list('months');
  const weekdays = list('weekdays');
  const cells = useMemo(() => monthGrid(year, month), [year, month]);

  const stateStyle = (state, isSelected) => {
    if (isSelected) {
      return { bg: colors.primary, fg: colors.onPrimary, border: colors.primary };
    }
    switch (state) {
      case 'past':
        return { bg: 'transparent', fg: `${colors.warmGray}66`, border: 'transparent' };
      case 'booked':
        return { bg: colors.successBg, fg: colors.primaryInk, border: 'transparent' };
      case 'held':
        return { bg: colors.warningBg, fg: colors.goldText, border: 'transparent' };
      case 'blocked':
        return { bg: colors.surfaceElevated, fg: `${colors.warmGray}99`, border: colors.border };
      default:
        return { bg: colors.surface, fg: colors.dark, border: colors.border };
    }
  };

  const canPress = (state) => {
    if (variant === 'pro') return state !== 'past';
    return state === 'available';
  };

  const prevDisabled = (() => {
    const first = new Date(year, month, 1);
    const now = new Date();
    return first <= new Date(now.getFullYear(), now.getMonth(), 1);
  })();

  return (
    <View style={{ gap: spacing.md }}>
      {/* En-tête mois */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Pressable
          onPress={() => !prevDisabled && onChangeMonth(-1)}
          disabled={prevDisabled}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t('common.prevMonth')}
          style={{ padding: spacing.xs, opacity: prevDisabled ? 0.3 : 1 }}
        >
          <Ionicons name={'chevron-back'} size={20} color={colors.dark} />
        </Pressable>

        <Text style={[typography.title, { color: colors.dark }]}>
          {months[month]} {year}
        </Text>

        <Pressable
          onPress={() => onChangeMonth(1)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t('common.nextMonth')}
          style={{ padding: spacing.xs }}
        >
          <Ionicons name={'chevron-forward'} size={20} color={colors.dark} />
        </Pressable>
      </View>

      {/* Jours de la semaine */}
      <View style={{ flexDirection: 'row' }}>
        {weekdays.map((d) => (
          <Text
            key={d}
            style={[typography.caption, { flex: 1, textAlign: 'center', color: colors.warmGray }]}
          >
            {d}
          </Text>
        ))}
      </View>

      {/* Grille */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {cells.map((cell) => {
          const state = cell.inMonth ? availability[cell.iso] || 'available' : 'past';
          const isSelected = selected === cell.iso && cell.inMonth;
          const s = stateStyle(state, isSelected);
          const pressable = cell.inMonth && canPress(state);
          const marker = cell.inMonth ? markers[cell.iso] : null;

          return (
            <Pressable
              key={cell.iso}
              onPress={pressable ? () => onSelect(cell.iso, state) : undefined}
              disabled={!pressable}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected, disabled: !pressable }}
              style={{
                width: `${100 / 7}%`,
                aspectRatio: 1,
                padding: 2,
              }}
            >
              <View
                style={{
                  flex: 1,
                  borderRadius: radii.md,
                  backgroundColor: cell.inMonth ? s.bg : 'transparent',
                  borderWidth: cell.inMonth && s.border !== 'transparent' ? 1 : 0,
                  borderColor: s.border,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: cell.inMonth ? 1 : 0.25,
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: isSelected ? '600' : '400', color: s.fg }}>
                  {cell.day}
                </Text>
                {marker ? (
                  <View
                    style={{
                      width: 4,
                      height: 4,
                      borderRadius: 2,
                      backgroundColor: isSelected ? colors.onPrimary : colors.secondary,
                      marginTop: 2,
                    }}
                  />
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/** Légende du calendrier (§4.4 étape 1). */
export function CalendarLegend({ items }) {
  const { colors, typography, spacing, radii } = useTheme();

  const TONES = {
    available: { bg: colors.surface, border: colors.border },
    booked: { bg: colors.successBg, border: 'transparent' },
    held: { bg: colors.warningBg, border: 'transparent' },
    blocked: { bg: colors.surfaceElevated, border: colors.border },
  };

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
      {items.map((item) => {
        const tone = TONES[item.state] || TONES.available;
        return (
          <View key={item.state} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View
              style={{
                width: 12,
                height: 12,
                borderRadius: radii.xs,
                backgroundColor: tone.bg,
                borderWidth: 1,
                borderColor: tone.border === 'transparent' ? tone.bg : tone.border,
              }}
            />
            <Text style={[typography.caption, { color: colors.warmGray }]}>{item.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

export { fromISODate };
