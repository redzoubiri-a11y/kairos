import { useCallback, useState } from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Screen, Header, Body } from '../../components/Screen';
import ReviewCard from '../../components/ReviewCard';
import MButton from '../../components/MButton';
import MInput from '../../components/MInput';
import MSheet from '../../components/MSheet';
import { Loader, EmptyState, MCard } from '../../components/primitives';
import { useTheme } from '../../context/ThemeContext';
import { useI18n } from '../../i18n';
import { REVIEW_MODERATION_HOURS } from '../../lib/constants';
import * as api from '../../data';

export default function ProReviewsScreen({ navigation }) {
  const { colors, typography, spacing, radii } = useTheme();
  const { t, dir, align } = useI18n();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [replying, setReplying] = useState(null);
  const [reply, setReply] = useState('');

  const load = useCallback(async () => {
    try {
      setRows(await api.proListPendingReviews());
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const moderate = async (id, action, text) => {
    setBusy(true);
    try {
      await api.proModerateReview(id, action, text);
      setReplying(null);
      setReply('');
      await load();
    } finally {
      setBusy(false);
    }
  };

  const hoursLeft = (review) => {
    const elapsed = (Date.now() - new Date(review.created_at).getTime()) / 3_600_000;
    return Math.max(0, Math.ceil(REVIEW_MODERATION_HOURS - elapsed));
  };

  return (
    <Screen>
      <Header title={t('pro.reviewsToModerate')} bordered={false} onBack={navigation.goBack} />

      <Body>
        {loading ? (
          <Loader />
        ) : rows.length === 0 ? (
          <EmptyState icon="star-outline" title={t('pro.noReviewsPending')} />
        ) : (
          rows.map((review) => (
            <View key={review.id} style={{ gap: spacing.sm }}>
              <ReviewCard review={review} />

              <MCard style={{ gap: spacing.md }}>
                <View style={{ flexDirection: dir, alignItems: 'center', gap: spacing.sm }}>
                  <Ionicons name="time-outline" size={14} color={colors.goldText} />
                  <Text style={[typography.caption, { color: colors.goldText, flex: 1, textAlign: align }]}>
                    {t('pro.autoPublish', { h: hoursLeft(review) })}
                  </Text>
                </View>

                <View style={{ flexDirection: dir, gap: spacing.sm, flexWrap: 'wrap' }}>
                  <MButton
                    label={t('pro.approve')}
                    size="sm"
                    icon="checkmark"
                    loading={busy}
                    onPress={() => moderate(review.id, 'approve')}
                  />
                  <MButton
                    label={t('pro.reply')}
                    size="sm"
                    variant="secondary"
                    icon="return-down-forward-outline"
                    onPress={() => setReplying(review)}
                  />
                  <MButton
                    label={t('pro.flag')}
                    size="sm"
                    variant="ghost"
                    icon="flag-outline"
                    onPress={() => moderate(review.id, 'flag')}
                  />
                </View>
              </MCard>
            </View>
          ))
        )}
      </Body>

      <MSheet visible={!!replying} onClose={() => setReplying(null)} title={t('pro.reply')}>
        {replying ? (
          <View
            style={{
              backgroundColor: colors.surfaceElevated,
              borderRadius: radii.lg,
              padding: spacing.md,
            }}
          >
            <Text style={[typography.caption, { color: colors.warmGray, textAlign: align }]}>
              {replying.comment}
            </Text>
          </View>
        ) : null}

        <MInput
          label={t('pro.reply')}
          value={reply}
          onChangeText={setReply}
          placeholder={t('pro.replyPlaceholder')}
          multiline
        />

        <MButton
          label={t('common.send')}
          size="lg"
          full
          loading={busy}
          onPress={() => moderate(replying.id, 'reply', reply.trim())}
        />
      </MSheet>
    </Screen>
  );
}
