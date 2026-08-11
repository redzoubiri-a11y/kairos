import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, radius } from '../theme';

export default function WeekStrip({ reservations }) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i);
    const iso = d.toISOString().split('T')[0];
    const count = reservations.filter(r => r.date === iso && r.status !== 'cancelled').length;
    const dayLabel = i === 0 ? 'Auj.' : d.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', '');
    return { iso, count, dayLabel, dayNum: d.getDate(), isToday: i === 0 };
  });

  const maxCount = Math.max(...days.map(d => d.count), 1);

  return (
    <View style={s.wrap}>
      <Text style={s.title}>7 PROCHAINS JOURS</Text>
      <View style={s.row}>
        {days.map(d => {
          const barH = d.count > 0 ? Math.round(Math.max(d.count / maxCount, 0.15) * 20) : 2;
          const barColor = d.isToday ? colors.primary : d.count > 0 ? colors.blue : colors.cardHover;
          return (
            <View key={d.iso} style={s.col}>
              <Text style={s.countLbl}>{d.count > 0 ? d.count : ''}</Text>
              <View style={s.barTrack}>
                <View style={[s.bar, { height: barH, backgroundColor: barColor }]} />
              </View>
              <Text style={[s.dayNum,   d.isToday && s.dayNumToday]}>{d.dayNum}</Text>
              <Text style={[s.dayLabel, d.isToday && s.dayLabelToday]}>{d.dayLabel}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap:          { marginHorizontal: spacing.xxl, marginBottom: spacing.md, backgroundColor: colors.card, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.cardBorder, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  title:         { color: colors.textDim, fontSize: typography.size.xs, letterSpacing: 3, marginBottom: spacing.sm },
  row:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  col:           { alignItems: 'center', gap: 2, flex: 1 },
  countLbl:      { color: colors.primary, fontSize: typography.size.xs, fontWeight: typography.weight.medium, minHeight: 10 },
  barTrack:      { height: 22, justifyContent: 'flex-end', width: '65%' },
  bar:           { borderRadius: radius.sm, minHeight: 2 },
  dayNum:        { color: colors.textMuted, fontSize: typography.size.xs },
  dayNumToday:   { color: colors.primary, fontWeight: typography.weight.medium },
  dayLabel:      { color: colors.textDim, fontSize: typography.size.xs },
  dayLabelToday: { color: colors.primary },
});
