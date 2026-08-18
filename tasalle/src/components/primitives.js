import { View, Text, Pressable, ActivityIndicator, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useI18n } from '../i18n';

// ── Badge (§3.3) ──────────────────────────────────────────────────────────

const BADGE_TONES = {
  success: (c) => ({ bg: c.successBg, fg: c.primaryInk }),
  warning: (c) => ({ bg: c.warningBg, fg: c.goldText }),
  danger: (c) => ({ bg: c.dangerBg, fg: c.accent }),
  info: (c) => ({ bg: c.infoBg, fg: c.info }),
  gold: (c) => ({ bg: c.goldLight, fg: c.goldText }),
  neutral: (c) => ({ bg: c.surfaceElevated, fg: c.warmGray }),
};

// .tag { font-size:11px; letter-spacing:0.02em; padding:3px 10px;
//   border-radius: calc(var(--radius-md) * 0.75) } — pas de graisse forcée,
// le corps hérite du texte normal (Archivo_400Regular).
export function MBadge({ label, tone = 'neutral', icon, size = 'md' }) {
  const { colors, radii } = useTheme();
  const t = (BADGE_TONES[tone] || BADGE_TONES.neutral)(colors);
  const small = size === 'sm';

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: t.bg,
        borderRadius: radii.sm,
        paddingHorizontal: small ? 7 : 10,
        paddingVertical: small ? 2 : 3,
        alignSelf: 'flex-start',
      }}
    >
      {icon ? <Ionicons name={icon} size={small ? 10 : 12} color={t.fg} /> : null}
      <Text
        style={{
          color: t.fg,
          fontSize: small ? 10 : 11,
          fontFamily: 'Archivo_400Regular',
          letterSpacing: 0.2,
        }}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

// ── Chip / filtre (§3.3) ──────────────────────────────────────────────────
// Analogue le plus proche : .seg-opt { padding:7px 12px; font-size:13px }
// :has(input:checked) { background: var(--color-accent); color: var(--color-bg) }
// — pas de graisse ni de bordure d'accent distincte à l'état actif dans la
// source, juste le changement de fond.

export function MChip({ label, active, onPress, icon }) {
  const { colors, radii } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: active ? colors.primary : colors.surface,
        borderWidth: 1,
        borderColor: active ? colors.primary : colors.border,
        borderRadius: radii.sm,
        paddingVertical: 7,
        paddingHorizontal: 12,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      {icon ? <Ionicons name={icon} size={13} color={active ? colors.onPrimary : colors.warmGray} /> : null}
      <Text
        style={{ fontSize: 13, fontFamily: 'Archivo_400Regular', color: active ? colors.onPrimary : colors.dark }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

// ── Carte (§3.3) ──────────────────────────────────────────────────────────

// .card { padding: var(--space-3); border-radius: var(--radius-md);
//   background: var(--color-surface) } — pas de bordure : la surface se
// détache du fond par sa propre teinte, pas par un contour.
export function MCard({ children, onPress, style, padded = true, elevated = false }) {
  const { colors, radii, spacing, shadows } = useTheme();

  const base = {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: padded ? spacing.md : 0,
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

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.md,
      }}
    >
      <Text style={[typography.h3, { color: colors.dark, flexShrink: 1 }]}>{title}</Text>
      {action ? (
        <Pressable onPress={onAction} accessibilityRole="button">
          <Text style={[typography.secondary, { color: colors.primaryInk, fontWeight: '500' }]}>{action}</Text>
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
      <ActivityIndicator color={colors.primaryInk} />
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
        <Ionicons name={icon} size={26} color={colors.primaryInk} />
      </View>
      <Text style={[typography.title, { color: colors.dark, textAlign: 'center' }]}>{title}</Text>
      {body ? (
        <Text style={[typography.secondary, { color: colors.warmGray, textAlign: 'center' }]}>{body}</Text>
      ) : null}
      {action ? (
        <Pressable onPress={onAction} style={{ marginTop: spacing.sm }} accessibilityRole="button">
          <Text style={[typography.secondary, { color: colors.primaryInk, fontWeight: '500' }]}>{action}</Text>
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
          <Text style={[typography.secondary, { color: colors.primaryInk, fontWeight: '500' }]}>
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
  const value = Math.max(0, Math.min(100, Number(percent) || 0));
  const fill = tone === 'gold' ? colors.goldMark : tone === 'secondary' ? colors.secondary : colors.primaryInk;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 }}>
      <View
        style={{
          flex: 1,
          height,
          borderRadius: radii.sm,
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

  const isActive = (v) => (multi ? (value || []).includes(v) : value === v);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
        gap: spacing.sm,
        paddingHorizontal: spacing.lg,
        flexDirection: 'row',
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

// ── Bandeau hors ligne (§1.4) ─────────────────────────────────────────────

/**
 * Signale que l'écran affiche une copie locale. L'horodatage est explicite :
 * un planning consulté sans réseau doit dire de quand il date, sinon le pro
 * risque de confirmer une date sur une information périmée.
 */
export function OfflineBanner({ at }) {
  const { colors, typography, spacing, radii } = useTheme();
  const { t, list } = useI18n();

  if (!at) return null;

  const d = new Date(at);
  const jour = `${d.getDate()} ${list('monthsShort')[d.getMonth()]}`;
  const heure = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        backgroundColor: colors.warningBg,
        borderRadius: radii.lg,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
      }}
    >
      <Ionicons name="cloud-offline-outline" size={15} color={colors.goldText} />
      <Text style={[typography.caption, { color: colors.goldText, flex: 1 }]}>
        {t('common.offlineSince', { date: `${jour} ${heure}` })}
      </Text>
    </View>
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

  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing.lg, paddingVertical: 5 }}>
      <Text style={[typography.secondary, { color: colors.warmGray }]}>{label}</Text>
      <Text
        style={[
          strong ? typography.title : typography.secondary,
          { color: tone === 'primary' ? colors.primaryInk : colors.dark, flexShrink: 1, textAlign: 'right' },
        ]}
        numberOfLines={2}
      >
        {value}
      </Text>
    </View>
  );
}
