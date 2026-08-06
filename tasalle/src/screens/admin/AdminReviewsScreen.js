import { useCallback, useState } from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Screen, Header, Body } from '../../components/Screen';
import ReviewCard from '../../components/ReviewCard';
import MButton, { ButtonRow } from '../../components/MButton';
import { MCard, Loader, EmptyState, ErrorState } from '../../components/primitives';
import { useTheme } from '../../context/ThemeContext';
import { useI18n } from '../../i18n';
import * as api from '../../data';

export default function AdminReviewsScreen() {
  const { colors, typography, spacing } = useTheme();
  const { t, list } = useI18n();

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setReviews(await api.adminListFlaggedReviews());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const resolve = async (review, action) => {
    setBusyId(review.id);
    try {
      await api.adminResolveReview(review.id, action);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  };

  const dateDepot = (iso) => {
    const d = new Date(iso);
    return `${d.getDate()} ${list('monthsShort')[d.getMonth()]}`;
  };

  return (
    <Screen>
      <Header title={t('admin.reviewsTitle')} bordered={false} />

      <Body>
        {loading ? (
          <Loader />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : reviews.length === 0 ? (
          <EmptyState
            icon="shield-checkmark-outline"
            title={t('admin.reviewsEmpty')}
            body={t('admin.reviewsEmptyHint')}
          />
        ) : (
          reviews.map((review) => (
            <View key={review.id} style={{ gap: spacing.sm }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <Ionicons name="flag" size={14} color={colors.accent} />
                <Text style={[typography.caption, { color: colors.accent, flex: 1, textAlign: 'left' }]}>
                  {review.salle?.name} · {t('admin.flaggedOn', { date: dateDepot(review.created_at) })}
                </Text>
              </View>

              <ReviewCard review={review} />

              <MCard style={{ gap: spacing.md }}>
                <ButtonRow>
                  <MButton
                    label={t('admin.restore')}
                    icon="eye-outline"
                    loading={busyId === review.id}
                    onPress={() => resolve(review, 'restore')}
                    style={{ flex: 1 }}
                  />
                  <MButton
                    label={t('admin.remove')}
                    variant="accent"
                    icon="eye-off-outline"
                    onPress={() => resolve(review, 'remove')}
                    style={{ flex: 1 }}
                  />
                </ButtonRow>

                <Text style={[typography.caption, { color: colors.warmGray, textAlign: 'left' }]}>
                  {t('admin.removeHint')}
                </Text>
              </MCard>
            </View>
          ))
        )}
      </Body>
    </Screen>
  );
}
