import { useState } from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import { colors, typography, spacing, radius } from '../theme';

export default function FormField({ label, value, onChangeText, placeholder, keyboardType, autoCapitalize }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={s.wrap}>
      <Text style={s.label}>{label}</Text>
      <View style={focused ? s.ringActive : s.ringInactive}>
        <TextInput
          style={[s.input, focused && s.inputFocused]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textPlaceholder}
          keyboardType={keyboardType || 'default'}
          autoCapitalize={autoCapitalize ?? 'none'}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap:  { marginHorizontal: 20, marginBottom: 18 },
  label: { fontFamily: typography.bodySemibold, color: colors.textLabel, fontSize: typography.size.caption - 0.5, letterSpacing: 0.63, textTransform: 'uppercase', marginBottom: spacing.sm },
  // Halo de focus (box-shadow 0 0 0 3px de la maquette) simulé par un anneau de padding,
  // compensé par une marge négative pour ne pas déplacer le champ.
  ringInactive: {},
  ringActive:   { padding: 3, margin: -3, backgroundColor: colors.primarySoft, borderRadius: radius.lg + 3 },
  input: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: radius.lg, paddingHorizontal: 15, paddingVertical: spacing.lg + 1, color: colors.text, fontFamily: typography.body, fontSize: typography.size.subheading },
  inputFocused: { borderWidth: 1.5, borderColor: colors.primary },
});
