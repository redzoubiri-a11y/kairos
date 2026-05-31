import { View, Text, StyleSheet, TextInput } from 'react-native';
import { colors, typography, spacing, radius } from '../theme';

export default function FormField({ label, value, onChangeText, placeholder, keyboardType }) {
  return (
    <View style={s.wrap}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        style={s.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textDim}
        keyboardType={keyboardType || 'default'}
        autoCapitalize="none"
      />
    </View>
  );
}

const s = StyleSheet.create({
  wrap:  { marginHorizontal: spacing.xxl, marginBottom: spacing.lg },
  label: { color: colors.textMuted, fontSize: typography.size.caption, letterSpacing: 1, marginBottom: spacing.sm },
  input: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: radius.lg, paddingHorizontal: spacing.xl, paddingVertical: spacing.lg, color: colors.text, fontSize: typography.size.subheading, fontWeight: typography.weight.regular },
});
