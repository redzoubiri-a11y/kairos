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
  onBlur,
  // Les champs de code — promo, parrainage — ne doivent pas être « corrigés »
  // par le clavier : il en ferait un mot.
  autoCorrect,
  // iOS uniquement : désactive la barre de suggestion QuickType (contacts,
  // adresses...) sur les champs où elle fait perdre le focus à chaque
  // caractère (bug constaté sur le téléphone, voir PhoneScreen.js) —
  // aucune valeur par défaut, elle ne doit pas s'appliquer partout (le code
  // OTP a besoin de son propre comportement d'auto-remplissage SMS).
  textContentType,
  style,
}) {
  const { colors, typography, spacing, radii } = useTheme();
  const [focused, setFocused] = useState(false);

  const forcedLtr = direction === 'ltr';
  // .input:focus-visible { border-color: var(--color-accent) } — l'accent
  // brut, pas l'encre foncée : c'est la vraie règle, portée telle quelle.
  const borderColor = error ? colors.accentInk : focused ? colors.gold : colors.border;

  return (
    <View style={[{ gap: spacing.xs }, style]}>
      {label ? (
        <Text style={[typography.caption, { color: colors.warmGray, textAlign: 'left' }]}>{label}</Text>
      ) : null}

      {/* .input { min-height:36px; padding:6px 10px; font-size:14px;
          background: var(--color-surface); border: 1px solid var(--color-divider) } */}
      <View
        style={{
          flexDirection: forcedLtr ? 'row' : 'row',
          alignItems: multiline ? 'flex-start' : 'center',
          gap: spacing.sm,
          borderWidth: 1,
          borderColor,
          borderRadius: radii.md,
          paddingHorizontal: 10,
          paddingVertical: multiline ? 6 : 0,
          minHeight: multiline ? 90 : 36,
          backgroundColor: colors.surface,
          // Focus ring §3.3 — les clés shadow*/elevation restent toujours
          // présentes (seule leur intensité varie) : les ajouter/retirer
          // dynamiquement selon `focused` forçait un recalcul de la
          // composition native à chaque passage à `focused`, ce qui coupait
          // le focus du TextInput enfant sur iOS (bug constaté sur l'écran
          // téléphone le 18/08/2026).
          shadowColor: colors.primary,
          shadowOpacity: focused && !error ? 0.18 : 0,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 0 },
          elevation: focused && !error ? 2 : 0,
        }}
      >
        {icon ? <Ionicons name={icon} size={18} color={focused ? colors.gold : colors.warmGray} /> : null}

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={`${colors.warmGray}80`}
          onFocus={() => setFocused(true)}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          textContentType={textContentType}
          autoCorrect={autoCorrect}
          multiline={multiline}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          maxLength={maxLength}
          editable={editable}
          onSubmitEditing={onSubmitEditing}
          returnKeyType={returnKeyType}
          style={[
            typography.secondary,
            {
              flex: 1,
              color: colors.dark,
              paddingVertical: multiline ? 0 : 6,
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
        <Text style={[typography.caption, { color: colors.accentInk, textAlign: 'left' }]}>{error}</Text>
      ) : hint ? (
        <Text style={[typography.caption, { color: colors.warmGray, textAlign: 'left' }]}>{hint}</Text>
      ) : null}
    </View>
  );
}

/** Sélecteur simple sous forme de liste déroulante compacte. */
export function MSelect({ label, value, options, onChange, placeholder }) {
  const { colors, typography, spacing, radii } = useTheme();
  const [open, setOpen] = useState(false);

  const selected = options.find((o) => o.value === value);

  return (
    <View style={{ gap: spacing.xs }}>
      {label ? (
        <Text style={[typography.caption, { color: colors.warmGray, textAlign: 'left' }]}>{label}</Text>
      ) : null}

      <Pressable
        onPress={() => setOpen((v) => !v)}
        accessibilityRole="button"
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderWidth: 1,
          borderColor: open ? colors.gold : colors.border,
          borderRadius: radii.md,
          paddingHorizontal: 10,
          minHeight: 36,
          backgroundColor: colors.surface,
        }}
      >
        <Text style={[typography.secondary, { color: selected ? colors.dark : `${colors.warmGray}CC` }]}>
          {selected ? selected.label : placeholder}
        </Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color={colors.warmGray} />
      </Pressable>

      {open ? (
        <View
          style={{
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: radii.md,
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
                  paddingVertical: 8,
                  paddingHorizontal: 10,
                  backgroundColor: active ? colors.primaryLight : 'transparent',
                }}
              >
                <Text
                  style={[
                    typography.secondary,
                    { color: active ? colors.primaryInk : colors.dark, textAlign: 'left' },
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
