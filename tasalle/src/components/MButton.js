import { Pressable, Text, ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

// §3.3 — Boutons : primary / secondary / accent / ghost / gold
function variantStyle(variant, colors) {
  switch (variant) {
    case 'secondary':
      return { bg: colors.secondaryLight, fg: colors.secondary, border: colors.secondary };
    case 'accent':
      return { bg: colors.accent, fg: '#FFFFFF', border: colors.accent };
    case 'ghost':
      return { bg: 'transparent', fg: colors.warmGray, border: colors.border };
    case 'gold':
      return { bg: colors.goldLight, fg: colors.goldText, border: colors.gold };
    case 'primary':
    default:
      return { bg: colors.primary, fg: colors.onPrimary, border: colors.primary };
  }
}

// §3.3 — Tailles sm / md / lg
const SIZES = {
  sm: { pv: 5, ph: 10, font: 12, icon: 14 },
  md: { pv: 8, ph: 14, font: 14, icon: 16 },
  lg: { pv: 12, ph: 20, font: 16, icon: 18 },
};

export default function MButton({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  loading = false,
  disabled = false,
  full = false,
  style,
}) {
  const { colors, radii, spacing } = useTheme();
  const v = variantStyle(variant, colors);
  const s = SIZES[size] || SIZES.md;
  const isOff = disabled || loading;
  // L'état pressé du bouton plein descend à `primaryDark` : RN n'a pas de
  // :hover, l'appui est le seul retour possible.
  const pressedBg = variant === 'primary' || variant === undefined ? colors.primaryDark : v.bg;

  return (
    <Pressable
      onPress={isOff ? undefined : onPress}
      disabled={isOff}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isOff, busy: loading }}
      style={({ pressed }) => [
        {
          backgroundColor: pressed && !isOff ? pressedBg : v.bg,
          borderWidth: 1,
          borderColor: v.border,
          borderRadius: radii.md, // .btn { border-radius: var(--radius-md) }
          paddingVertical: s.pv,
          paddingHorizontal: s.ph,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing.sm,
          opacity: isOff ? 0.5 : 1,
          alignSelf: full ? 'stretch' : 'flex-start',
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={v.fg} />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={s.icon} color={v.fg} /> : null}
          {/* Les boutons prennent la graisse des titres (500), jamais celle du
              corps de texte (400) — §3.2. */}
          <Text
            style={{ color: v.fg, fontSize: s.font, fontWeight: '500' }}
            numberOfLines={1}
          >
            {label}
          </Text>
          {iconRight ? <Ionicons name={iconRight} size={s.icon} color={v.fg} /> : null}
        </>
      )}
    </Pressable>
  );
}

/** Rangée de boutons qui se partagent la largeur. */
export function ButtonRow({ children, gap }) {
  const { spacing } = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: gap ?? spacing.sm }}>
      {children}
    </View>
  );
}
