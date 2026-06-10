import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '../theme';

export default function FormStepper({ value, min, max, onChange }) {
  return (
    <View style={s.row}>
      <TouchableOpacity style={[s.btn, value <= min && s.btnDim]} onPress={() => onChange(v => Math.max(min, v - 1))} disabled={value <= min}>
        <Text style={s.sym}>−</Text>
      </TouchableOpacity>
      <Text style={s.val}>{value}</Text>
      <TouchableOpacity style={[s.btn, value >= max && s.btnDim]} onPress={() => onChange(v => Math.min(max, v + 1))} disabled={value >= max}>
        <Text style={s.sym}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  row:    { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  btn:    { width: 38, height: 38, borderRadius: 0, backgroundColor: colors.cardHover, borderWidth: 1, borderColor: colors.cardBorder, alignItems: 'center', justifyContent: 'center' },
  btnDim: { opacity: 0.25 },
  sym:    { color: colors.text, fontSize: 22, fontWeight: typography.weight.regular, lineHeight: 30 },
  val:    { color: colors.text, fontSize: 22, fontWeight: typography.weight.regular, minWidth: 32, textAlign: 'center' },
});
