import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useI18n } from '../i18n';
import { formatDA, formatLongDate } from '../lib/format';
import { EVENT_EMOJI, RESERVATION_STATUS } from '../lib/constants';
import { MBadge } from './primitives';

const STATUS_TONE = {
  [RESERVATION_STATUS.PENDING]: 'warning',
  [RESERVATION_STATUS.CONFIRMED]: 'success',
  [RESERVATION_STATUS.CANCELLED]: 'danger',
  [RESERVATION_STATUS.COMPLETED]: 'info',
};

export function StatusBadge({ status, size }) {
  const { t } = useI18n();
  return <MBadge label={t(`status.${status}`)} tone={STATUS_TONE[status] || 'neutral'} size={size} />;
}

/**
 * Carte de réservation — utilisée côté client (« Mes réservations ») et
 * côté pro (liste et tableau de bord). `perspective` change le titre affiché.
 */
export default function ReservationCard({ reservation, onPress, perspective = 'client', children }) {
  const { colors, typography, spacing, radii } = useTheme();
  const { t, list } = useI18n();

  const title =
    perspective === 'pro' ? reservation.client_name || '—' : reservation.salle?.name || '—';
  const subtitle =
    perspective === 'pro'
      ? `${reservation.guest_count} ${t('common.guests')}`
      : reservation.salle?.city || '';

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      style={({ pressed }) => ({
        backgroundColor: colors.surface,
        borderRadius: radii.md,
        padding: spacing.md,
        gap: spacing.md,
        opacity: pressed && onPress ? 0.92 : 1,
      })}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: radii.lg,
            backgroundColor: colors.secondaryLight,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 18 }}>{EVENT_EMOJI[reservation.event_type] || '🎉'}</Text>
        </View>

        <View style={{ flex: 1, gap: 2 }}>
          <Text style={[typography.title, { fontSize: 15, color: colors.dark, textAlign: 'left' }]} numberOfLines={1}>
            {title}
          </Text>
          <Text style={[typography.caption, { color: colors.warmGray, textAlign: 'left' }]} numberOfLines={1}>
            {t(`events.${reservation.event_type}`)}
            {subtitle ? ` · ${subtitle}` : ''}
          </Text>
        </View>

        <StatusBadge status={reservation.status} size="sm" />
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.lg, flexWrap: 'wrap' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <Ionicons name="calendar-outline" size={13} color={colors.warmGray} />
          <Text style={[typography.caption, { color: colors.dark }]}>
            {formatLongDate(reservation.event_date, list('months'))}
          </Text>
        </View>

        {reservation.total_amount ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Ionicons name="pricetag-outline" size={13} color={colors.warmGray} />
            <Text style={[typography.caption, { color: colors.dark }]}>
              {formatDA(reservation.total_amount, t('common.currency'))}
            </Text>
          </View>
        ) : null}

        <Text style={[typography.caption, { color: colors.warmGray }]}>{reservation.reference}</Text>
      </View>

      {children}
    </Pressable>
  );
}
