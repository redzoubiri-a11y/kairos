import { useRef, useCallback } from 'react';
import { TouchableOpacity, Text, Animated, ActivityIndicator, StyleSheet } from 'react-native';
import { buttonVariants, typography, radius, spacing } from '../theme';

// Composant bouton unique du design system — consomme buttonVariants (theme.js).
// variant: primary(Continuer) | confirm(Confirmer) | reserve(Réserver) | pro(Ajouter un créneau)
//        | secondary(Plus tard) | link(Tout voir) | disabled(Indisponible) | ghost | danger
export default function Button({
  children,
  variant = 'primary',
  onPress,
  disabled = false,
  loading = false,
  small = false,
  fullWidth,
  style,
  containerStyle,
  textStyle,
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const v = buttonVariants[variant] || buttonVariants.primary;
  // "link" (Tout voir) n'est jamais pleine largeur par défaut ; tous les autres le sont.
  const isFull = fullWidth ?? variant !== 'link';

  const handlePressIn = useCallback(() => {
    Animated.spring(scale, { toValue: 0.96, useNativeDriver: true }).start();
  }, []);
  const handlePressOut = useCallback(() => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
  }, []);

  return (
    <Animated.View style={[{ transform: [{ scale }] }, isFull && styles.full, style]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={1}
        style={[
          v.container,
          isFull && styles.full,
          small && styles.small,
          (disabled || loading) && variant !== 'disabled' && styles.disabledOpacity,
          containerStyle,
        ]}
      >
        {loading ? (
          <ActivityIndicator size="small" color={v.text.color} />
        ) : (
          <Text style={[v.text, small && styles.textSmall, textStyle]}>{children}</Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  full: { width: '100%' },
  small: {
    minHeight: 36,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
  },
  disabledOpacity: { opacity: 0.5 },
  textSmall: { fontSize: typography.size.body },
});
