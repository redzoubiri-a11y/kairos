import { View, Text, StyleSheet } from 'react-native';
import { typography, spacing, radius } from '../theme';
import { statusCfg } from '../hooks/useReservations';

export default function ResaBadge({ status }) {
  const sc = statusCfg(status);
  return (
    <View style={[s.wrap, { backgroundColor: sc.bg, borderColor: sc.border }]}>
      <Text style={[s.txt, { color: sc.color }]}>{sc.label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { borderWidth:1, borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  txt:  { fontFamily: typography.body, fontSize: typography.size.sm, fontWeight: typography.weight.regular, letterSpacing:0.3 },
});
