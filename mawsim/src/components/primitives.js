import { View, Text, Pressable, ActivityIndicator, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useI18n } from '../i18n';

// ── Badge (§3.3) ──────────────────────────────────────────────────────────

const BADGE_TONES = {
  success: (c) => ({ bg: c.successBg, fg: c.primary }),
  warning: (c) => ({ bg: c.warningBg, fg: c.goldText }),
  danger: (c) => ({ bg: c.dangerBg, fg: c.accent }),
  info: (c) => ({ bg: c.infoBg, fg: c.info }),
  gold: (c) => ({ bg: c.goldLight, fg: c.goldText }),
  neutral: (c) => ({ bg: c.surfaceElevated, fg: c.warmGray }),
};

export function MBadge({ label, tone = 'neutral', icon, size = 'md' }) {
  const { colors, radii } = useTheme();
  const { dir } = useI18n();
  const t = (BADGE_TONES[tone] || BADGE_TONES.neutral)(colors);
  const small = size === 'sm';

  return (
    <View
      style={{
        flexDirection: dir,
        alignItems: 'center',
        gap: 4,
        backgroundColor: t.bg,
        borderRadius: radii.sm,
        paddingHorizontal: small ? 6 : 8,
        paddingVertical: small ? 2 : 4,
        alignSelf: 'flex-start',
      }}
    >
      {icon ? <Ionicons name={icon} size={small ? 10 : 12} color={t.fg} /> : null}
      <Text style={{ color: t.fg, fontSize: small ? 10 : 12, fontWeight: '500' }} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

// ── Chip / filtre (§3.3) ──────────────────────────────────────────────────

export function MChip({ label, active, onPress, icon }) {
  const { colors, radii } = useTheme();
  const { dir } = useI18n();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      style={({ pressed }) => ({
        flexDirection: dir,
        alignItems: 'center',
        gap: 6,
        backgroundColor: active ? colors.primary : colors.surface,
        borderWidth: 1,
        borderColor: active ? colors.primary : colors.border,
        borderRadius: radii.pill,
        paddingVertical: 7,
        paddingHorizontal: 14,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      {icon ? <Ionicons name={icon} size={13} color={active ? '#FFFFFF' : colors.warmGray} /> : null}
      <Text style={{ fontSize: 13, fontWeight: '500', color: active ? '#FFFFFF' : colors.dark }}>
        {label}
      </Text>
    </Pressable>
  );
}

// ── Carte (§3.3) ──────────────────────────────────────────────────────────

export function MCard({ children, onPress, style, padded = true, elevated = false }) {
  const { colors, radii, spacing, shadows } = useTheme();

  const base = {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.xl,
    padding: padded ? spacing.lg : 0,
    overflow: 'hidden',
    ...(elevated ? shadows.card : null),
  };

  if (!onPress) return <View style={[base, style]}>{children}</View>;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [base, pressed && shadows.card, style]}>
      {children}
    </Pressable>
  );
}

// ── Titre de section ──────────────────────────────────────────────────────

export function SectionTitle({ title, action, onAction }) {
  const { colors, typography, spacing } = useTheme();
  const { dir } = useI18n();

  return (
    <View
      style={{
        flexDirection: dir,
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.md,
      }}
    >
      <Text style={[typography.h3, { color: colors.dark, flexShrink: 1 }]}>{title}</Text>
      {action ? (
        <Pressable onPress={onAction} accessibilityRole="button">
          <Text style={[typography.secondary, { color: colors.primary, fontWeight: '500' }]}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

// ── États ─────────────────────────────────────────────────────────────────

export function Loader({ label }) {
  const { colors, typography, spacing } = useTheme();
  const { t } = useI18n();
  return (
    <View style={{ padding: spacing.xxxl, alignItems: 'center', gap: spacing.md }}>
      <ActivityIndicator color={colors.primary} />
      <Text style={[typography.secondary, { color: colors.warmGray }]}>{label ?? t('common.loading')}</Text>
    </View>
  );
}

export function EmptyState({ icon = 'sparkles-outline', title, body, action, onAction }) {
  const { colors, typography, spacing, radii } = useTheme();

  return (
    <View style={{ padding: spacing.xxl, alignItems: 'center', gap: spacing.sm }}>
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: radii.xxl,
          backgroundColor: colors.primaryLight,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: spacing.xs,
        }}
      >
        <Ionicons name={icon} size={26} color={colors.primary} />
      </View>
      <Text style={[typography.title, { color: colors.dark, textAlign: 'center' }]}>{title}</Text>
      {body ? (
        <Text style={[typography.secondary, { color: colors.warmGray, textAlign: 'center' }]}>{body}</Text>
      ) : null}
      {action ? (
        <Pressable onPress={onAction} style={{ marginTop: spacing.sm }} accessibilityRole="button">
          <Text style={[typography.secondary, { color: colors.primary, fontWeight: '500' }]}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function ErrorState({ message, onRetry }) {
  const { colors, typography, spacing } = useTheme();
  const { t } = useI18n();

  return (
    <View style={{ padding: spacing.xxl, alignItems: 'center', gap: spacing.sm }}>
      <Ionicons name="alert-circle-outline" size={30} color={colors.accent} />
      <Text style={[typography.secondary, { color: colors.warmGray, textAlign: 'center' }]}>
        {message || t('common.error')}
      </Text>
      {onRetry ? (
        <Pressable onPress={onRetry} accessibilityRole="button">
          <Text style={[typography.secondary, { color: colors.primary, fontWeight: '500' }]}>
            {t('common.retry')}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

// ── Barre de progression ──────────────────────────────────────────────────

export function ProgressBar({ percent, tone = 'primary', height = 8, showLabel = false }) {
  const { colors, typography, radii, spacing } = useTheme();
  const { dir } = useI18n();
  const value = Math.max(0, Math.min(100, Number(percent) || 0));
  const fill = tone === 'gold' ? colors.gold : tone === 'secondary' ? colors.secondary : colors.primary;

  return (
    <View style={{ flexDirection: dir, alignItems: 'center', gap: spacing.sm, flex: 1 }}>
      <View
        style={{
          flex: 1,
          height,
          borderRadius: radii.pill,
          backgroundColor: colors.surfaceElevated,
          borderWidth: 1,
          borderColor: colors.border,
          overflow: 'hidden',
        }}
      >
        <View style={{ width: `${value}%`, height: '100%', backgroundColor: fill }} />
      </View>
      {showLabel ? (
        <Text style={[typography.caption, { color: colors.warmGray, minWidth: 36, textAlign: 'right' }]}>
          {value}%
        </Text>
      ) : null}
    </View>
  );
}

// ── Rangée de chips scrollable horizontalement ────────────────────────────

export function ChipRow({ items, value, onChange, multi = false }) {
  const { spacing } = useTheme();
  const { isRTL } = useI18n();

  const isActive = (v) => (multi ? (value || []).includes(v) : value === v);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
        gap: spacing.sm,
        paddingHorizontal: spacing.lg,
        flexDirection: isRTL ? 'row-reverse' : 'row',
      }}
    >
      {items.map((item) => (
        <MChip
          key={String(item.value)}
          label={item.label}
          icon={item.icon}
          active={isActive(item.value)}
          onPress={() => {
            if (!multi) return onChange(item.value);
            const list = value || [];
            return onChange(
              list.includes(item.value) ? list.filter((v) => v !== item.value) : [...list, item.value]
            );
          }}
        />
      ))}
    </ScrollView>
  );
}

// ── Séparateur ────────────────────────────────────────────────────────────

export function Divider({ spacingY = 0 }) {
  const { colors } = useTheme();
  return <View style={{ height: 1, backgroundColor: colors.border, marginVertical: spacingY }} />;
}

// ── Ligne clé / valeur ────────────────────────────────────────────────────

export function KeyValue({ label, value, strong = false, tone }) {
  const { colors, typography, spacing } = useTheme();
  const { dir } = useI18n();

  return (
    <View style={{ flexDirection: dir, justifyContent: 'space-between', gap: spacing.lg, paddingVertical: 5 }}>
      <Text style={[typography.secondary, { color: colors.warmGray }]}>{label}</Text>
      <Text
        style={[
          strong ? typography.title : typography.secondary,
          { color: tone === 'primary' ? colors.primary : colors.dark, flexShrink: 1, textAlign: 'right' },
        ]}
        numberOfLines={2}
      >
        {value}
      </Text>
    </View>
  );
}
