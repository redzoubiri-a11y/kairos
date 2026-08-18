import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useI18n } from '../i18n';
import { Stars } from './Stars';
import { MBadge, ProgressBar } from './primitives';
import { timeAgo } from '../lib/format';

/** Avis client — §7.3 (badge vérifié, réponse du propriétaire encadrée). */
export default function ReviewCard({ review }) {
  const { colors, typography, spacing, radii } = useTheme();
  const { t, list } = useI18n();

  const initial = (review.client_name || '?').trim().charAt(0).toUpperCase();

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: radii.md,
        padding: spacing.md,
        gap: spacing.md,
      }}
    >
      <View style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' }}>
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: radii.pill,
            backgroundColor: colors.primaryLight,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: colors.primaryInk, fontWeight: '500', fontSize: 15 }}>{initial}</Text>
        </View>

        <View style={{ flex: 1, gap: 3 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' }}>
            <Text style={[typography.secondary, { color: colors.dark, fontWeight: '500' }]}>
              {review.client_name || '—'}
            </Text>
            {review.is_verified ? (
              <MBadge label={t('reviews.verified')} tone="success" size="sm" icon="checkmark-circle" />
            ) : null}
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <Stars value={review.rating_overall} size={12} />
            <Text style={[typography.caption, { color: colors.warmGray }]}>
              {timeAgo(review.created_at, t, list('monthsShort'))}
              {review.event_type ? ` · ${t(`events.${review.event_type}`)}` : ''}
            </Text>
          </View>
        </View>
      </View>

      {review.comment ? (
        <Text style={[typography.secondary, { color: colors.dark, textAlign: 'left' }]}>{review.comment}</Text>
      ) : null}

      {review.pro_reply ? (
        <View
          style={{
            backgroundColor: colors.primaryLight,
            borderRadius: radii.lg,
            padding: spacing.md,
            gap: 4,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Ionicons name="return-down-forward-outline" size={13} color={colors.primaryInk} />
            <Text style={[typography.caption, { color: colors.primaryInk, fontWeight: '500' }]}>
              {t('reviews.ownerReply')}
            </Text>
          </View>
          <Text style={[typography.caption, { color: colors.dark, textAlign: 'left' }]}>{review.pro_reply}</Text>
        </View>
      ) : null}
    </View>
  );
}

/** Répartition des notes 5→1 en barres (§7.3). */
export function RatingBreakdown({ reviews }) {
  const { colors, typography, spacing } = useTheme();
  const { t } = useI18n();

  if (!reviews?.length) return null;

  const total = reviews.length;
  const counts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => Math.round(r.rating_overall) === star).length,
  }));

  const average = reviews.reduce((acc, r) => acc + (r.rating_overall || 0), 0) / total;

  return (
    <View style={{ gap: spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.lg }}>
        <View style={{ alignItems: 'center' }}>
          <Text style={[typography.h1, { color: colors.dark }]}>{average.toFixed(1)}</Text>
          <Stars value={average} size={13} />
          <Text style={[typography.caption, { color: colors.warmGray, marginTop: 2 }]}>
            {t('salle.reviewsCount', { count: total })}
          </Text>
        </View>

        <View style={{ flex: 1, gap: 5 }}>
          {counts.map(({ star, count }) => (
            <View key={star} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <Text style={[typography.caption, { color: colors.warmGray, width: 12 }]}>{star}</Text>
              <ProgressBar percent={(count / total) * 100} height={6} />
              <Text style={[typography.caption, { color: colors.warmGray, width: 20, textAlign: 'right' }]}>
                {count}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}
