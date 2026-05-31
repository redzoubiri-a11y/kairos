import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, radius } from '../theme';

export default function StatCard({ icon, value, label, color, alert, sub }) {
  return (
    <View style={[s.card, alert && { borderColor: color + '55' }]}>
      {alert && <View style={[s.dot, { backgroundColor: color }]} />}
      <Text style={s.icon}>{icon}</Text>
      <Text style={[s.value, { color }]}>{value}</Text>
      <Text style={s.label}>{label}</Text>
      {!!sub && <Text style={s.sub}>{sub}</Text>}
    </View>
  );
}

const s = StyleSheet.create({
  card:  { width: 116, backgroundColor: colors.card, borderRadius: radius.xxl, borderWidth: 1, borderColor: colors.cardBorder, padding: spacing.lg, gap: spacing.xs },
  icon:  { fontSize: 20 },
  value: { fontSize: 26, fontWeight: '200' },
  label: { color: colors.textDim, fontSize: typography.size.xs, lineHeight: 14 },
  sub:   { color: colors.textMuted, fontSize: typography.size.sm, marginTop: 2 },
  dot:   { position: 'absolute', top: spacing.lg, right: spacing.lg, width: 8, height: 8, borderRadius: 4 },
});
