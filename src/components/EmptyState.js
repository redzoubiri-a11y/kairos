import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, radius } from '../theme';
import Button from './Button';

// État vide unique du design system — section 09 de MIDA Design System.dc.html :
// cercle 48px bordé avec icône trait fin, titre Space Grotesk 700 15px,
// sous-titre DM Sans 12.5px, bouton outline optionnel.
export default function EmptyState({ icon, title, subtitle, actionLabel, onAction, style }) {
  return (
    <View style={[styles.wrap, style]}>
      {!!icon && <View style={styles.iconRing}>{icon}</View>}
      <Text style={styles.title}>{title}</Text>
      {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      {!!actionLabel && (
        <Button variant="secondary" small fullWidth={false} onPress={onAction} style={styles.btn}>
          {actionLabel}
        </Button>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    padding: spacing.xxl + 4,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radius.card,
  },
  iconRing: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontFamily: typography.display,
    fontSize: typography.size.heading3,
    color: colors.text,
    marginBottom: spacing.sm - 2,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: typography.body,
    fontSize: typography.size.bodyLg - 0.5,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  btn: { marginTop: spacing.xs },
});
