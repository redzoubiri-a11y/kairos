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
  card:  { width: 92, backgroundColor: 'transparent', borderRadius: radius.xl, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: 2 },
  icon:  { fontSize: 14 },
  value: { fontSize: 20, fontWeight: '300' },
  label: { color: 'rgba(245,242,236,0.55)', fontSize: typography.size.xs, lineHeight: 13, textTransform: 'uppercase', letterSpacing: 0.5 },
  sub:   { color: 'rgba(245,242,236,0.40)', fontSize: typography.size.xs, marginTop: 1 },
  dot:   { position: 'absolute', top: spacing.sm, right: spacing.sm, width: 6, height: 6, borderRadius: 0 },
});
