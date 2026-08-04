import { useState } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useI18n } from '../i18n';

/**
 * Champ de saisie — §3.3 (border 1px, radius 10, focus ring primary-light).
 * `direction="ltr"` force le sens latin pour les numéros de téléphone en arabe.
 */
export default function MInput({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  hint,
  icon,
  multiline = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  maxLength,
  direction,
  editable = true,
  suffix,
  onSubmitEditing,
  returnKeyType,
  style,
}) {
  const { colors, typography, spacing, radii } = useTheme();
  const { align, isRTL } = useI18n();
  const [focused, setFocused] = useState(false);

  const forcedLtr = direction === 'ltr';
  const borderColor = error ? colors.accent : focused ? colors.primary : colors.border;

  return (
    <View style={[{ gap: spacing.xs }, style]}>
      {label ? (
        <Text style={[typography.caption, { color: colors.warmGray, textAlign: align }]}>{label}</Text>
      ) : null}

      <View
        style={{
          flexDirection: forcedLtr ? 'row' : isRTL ? 'row-reverse' : 'row',
          alignItems: multiline ? 'flex-start' : 'center',
          gap: spacing.sm,
          borderWidth: 1,
          borderColor,
          borderRadius: radii.lg,
          paddingHorizontal: 14,
          paddingVertical: multiline ? 12 : 0,
          minHeight: multiline ? 96 : 46,
          backgroundColor: colors.surface,
          // Focus ring §3.3
          ...(focused && !error
            ? {
                shadowColor: colors.primary,
                shadowOpacity: 0.18,
                shadowRadius: 6,
                shadowOffset: { width: 0, height: 0 },
                elevation: 2,
              }
            : null),
        }}
      >
        {icon ? <Ionicons name={icon} size={18} color={focused ? colors.primary : colors.warmGray} /> : null}

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={`${colors.warmGray}80`}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          multiline={multiline}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          maxLength={maxLength}
          editable={editable}
          onSubmitEditing={onSubmitEditing}
          returnKeyType={returnKeyType}
          style={[
            typography.body,
            {
              flex: 1,
              color: colors.dark,
              paddingVertical: multiline ? 0 : 12,
              textAlign: forcedLtr ? 'left' : align,
              textAlignVertical: multiline ? 'top' : 'center',
              minHeight: multiline ? 72 : undefined,
              // Retire le contour bleu par défaut sur le web
              outlineStyle: 'none',
            },
          ]}
        />

        {suffix ? <Text style={[typography.secondary, { color: colors.warmGray }]}>{suffix}</Text> : null}
      </View>

      {error ? (
        <Text style={[typography.caption, { color: colors.accent, textAlign: align }]}>{error}</Text>
      ) : hint ? (
        <Text style={[typography.caption, { color: colors.warmGray, textAlign: align }]}>{hint}</Text>
      ) : null}
    </View>
  );
}

/** Sélecteur simple sous forme de liste déroulante compacte. */
export function MSelect({ label, value, options, onChange, placeholder }) {
  const { colors, typography, spacing, radii } = useTheme();
  const { align, dir } = useI18n();
  const [open, setOpen] = useState(false);

  const selected = options.find((o) => o.value === value);

  return (
    <View style={{ gap: spacing.xs }}>
      {label ? (
        <Text style={[typography.caption, { color: colors.warmGray, textAlign: align }]}>{label}</Text>
      ) : null}

      <Pressable
        onPress={() => setOpen((v) => !v)}
        accessibilityRole="button"
        style={{
          flexDirection: dir,
          alignItems: 'center',
          justifyContent: 'space-between',
          borderWidth: 1,
          borderColor: open ? colors.primary : colors.border,
          borderRadius: radii.lg,
          paddingHorizontal: 14,
          minHeight: 46,
          backgroundColor: colors.surface,
        }}
      >
        <Text style={[typography.body, { color: selected ? colors.dark : `${colors.warmGray}CC` }]}>
          {selected ? selected.label : placeholder}
        </Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color={colors.warmGray} />
      </Pressable>

      {open ? (
        <View
          style={{
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: radii.lg,
            backgroundColor: colors.surface,
            overflow: 'hidden',
          }}
        >
          {options.map((o) => {
            const active = o.value === value;
            return (
              <Pressable
                key={String(o.value)}
                onPress={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                style={{
                  paddingVertical: 11,
                  paddingHorizontal: 14,
                  backgroundColor: active ? colors.primaryLight : 'transparent',
                }}
              >
                <Text
                  style={[
                    typography.body,
                    { color: active ? colors.primary : colors.dark, textAlign: align },
                  ]}
                >
                  {o.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}
