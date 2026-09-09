import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, radius } from '../theme';

export default function StatCard({ icon, value, label, color, alert, sub }) {
  return (
    <View style={[s.card, alert && { borderColor: color + '55' }]}>
      {alert && <View style={[s.dot, { backgroundColor: color }]} />}
      {!!icon && <Text style={s.icon}>{icon}</Text>}
      <Text style={[s.value, { color }]}>{value}</Text>
      <Text style={s.label}>{label}</Text>
      {!!sub && <Text style={s.sub}>{sub}</Text>}
    </View>
  );
}

const s = StyleSheet.create({
  card:  { width: 92, backgroundColor: colors.card, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.cardBorder, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: 2 },
  icon:  { fontSize: typography.size.bodyLg },
  value: { fontFamily: typography.display, fontSize: 20, fontWeight: typography.weight.bold },
  label: { color: colors.textMuted, fontSize: typography.size.xs, lineHeight: 13, textTransform: 'uppercase', letterSpacing: 0.5 },
  sub:   { color: colors.textDim, fontSize: typography.size.xs, marginTop: 1 },
  dot:   { position: 'absolute', top: spacing.sm, right: spacing.sm, width: 6, height: 6, borderRadius: 3 },
});
