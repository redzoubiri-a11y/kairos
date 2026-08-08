import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing, typography } from '../theme';

export default function Input({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  icon,
  secureTextEntry = false,
  multiline = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  editable = true,
  suffix,
  onPress,
  style,
}) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(secureTextEntry);

  const borderColor = error ? colors.danger : focused ? colors.primary : colors.border;

  const field = (
    <View
      style={[
        styles.field,
        { borderColor, backgroundColor: editable ? colors.card : colors.cardMuted },
        multiline && styles.multiline,
      ]}
    >
      {icon ? <Ionicons name={icon} size={18} color={colors.textMuted} style={styles.icon} /> : null}
      <TextInput
        style={[styles.input, multiline && styles.inputMultiline]}
        value={value === undefined || value === null ? '' : String(value)}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        secureTextEntry={hidden}
        multiline={multiline}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        editable={editable && !onPress}
        pointerEvents={onPress ? 'none' : 'auto'}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      {secureTextEntry ? (
        <Pressable onPress={() => setHidden((h) => !h)} hitSlop={10}>
          <Ionicons name={hidden ? 'eye-outline' : 'eye-off-outline'} size={19} color={colors.textMuted} />
        </Pressable>
      ) : null}
      {suffix ? <Text style={styles.suffix}>{suffix}</Text> : null}
    </View>
  );

  return (
    <View style={[styles.wrapper, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      {onPress ? (
        <Pressable onPress={onPress} accessibilityRole="button">
          {field}
        </Pressable>
      ) : (
        field
      )}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: spacing.lg },
  label: { ...typography.small, fontWeight: '600', color: colors.text, marginBottom: spacing.xs },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    minHeight: 50,
  },
  multiline: { alignItems: 'flex-start', paddingVertical: spacing.md },
  icon: { marginRight: spacing.sm },
  input: { flex: 1, ...typography.body, color: colors.text, paddingVertical: spacing.md },
  inputMultiline: { minHeight: 90, textAlignVertical: 'top', paddingVertical: 0 },
  suffix: { ...typography.small, color: colors.textMuted, marginLeft: spacing.sm },
  error: { ...typography.small, color: colors.danger, marginTop: spacing.xs },
});
