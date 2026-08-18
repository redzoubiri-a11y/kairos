import { useCallback, useState } from 'react';
import { View, Text, Pressable, Share, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Screen, Header, Body } from '../../components/Screen';
import MButton from '../../components/MButton';
import { MCard, MBadge, SectionTitle, Divider, Loader, ErrorState, EmptyState } from '../../components/primitives';
import { useTheme } from '../../context/ThemeContext';
import { useI18n } from '../../i18n';
import { REFERRAL_DAYS, REFERRAL_STATUS } from '../../lib/constants';
import * as api from '../../data';

/**
 * Parrainage entre propriétaires (§12 Phase 4).
 *
 * La récompense n'arrive qu'une fois la salle du filleul validée : l'écran le
 * dit explicitement, faute de quoi un parrain croirait à un oubli pendant les
 * jours d'attente.
 */
export default function ProReferralScreen({ navigation }) {
  const { colors, typography, spacing, radii } = useTheme();
  const { t } = useI18n();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copie, setCopie] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      setData(await api.getReferralSummary());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  const partager = async () => {
    const message = t('referral.shareMessage', { code: data.code });
    // `Share` n'existe pas sur le web : on recopie dans le presse-papiers, et
    // on le signale plutôt que de ne rien faire.
    if (Platform.OS === 'web') {
      try {
        await navigator.clipboard.writeText(message);
        setCopie(true);
        setTimeout(() => setCopie(false), 2500);
      } catch {
        /* presse-papiers refusé : le code reste lisible à l'écran */
      }
      return;
    }
    Share.share({ message }).catch(() => {});
  };

  if (loading) {
    return (
      <Screen>
        <Header title={t('pro.referralTitle')} bordered={false} onBack={navigation.goBack} />
        <Loader />
      </Screen>
    );
  }
  if (error || !data) {
    return (
      <Screen>
        <Header title={t('pro.referralTitle')} bordered={false} onBack={navigation.goBack} />
        <ErrorState message={error} onRetry={load} />
      </Screen>
    );
  }

  const plafondAtteint = data.daysRemaining === 0;

  return (
    <Screen>
      <Header
        title={t('pro.referralTitle')}
        subtitle={t('pro.referralSubtitle')}
        bordered={false}
        onBack={navigation.goBack}
      />

      <Body>
        {/* Le code, en grand : c'est ce que le parrain vient chercher. */}
        <MCard style={{ gap: spacing.md, alignItems: 'center' }}>
          <Text style={[typography.caption, { color: colors.warmGray }]}>
            {t('pro.referralYourCode')}
          </Text>

          <Pressable
            onPress={partager}
            accessibilityRole="button"
            accessibilityLabel={t('pro.referralShare')}
            style={{
              borderWidth: 1,
              borderStyle: 'dashed',
              borderColor: colors.primaryInk,
              borderRadius: radii.lg,
              paddingHorizontal: spacing.xxl,
              paddingVertical: spacing.md,
              backgroundColor: colors.primaryLight,
            }}
          >
            <Text
              style={[
                typography.h2,
                { color: colors.primaryInk, letterSpacing: 6, textAlign: 'center' },
              ]}
            >
              {data.code}
            </Text>
          </Pressable>

          <MButton
            label={copie ? t('common.saved') : t('pro.referralShare')}
            variant="secondary"
            icon={copie ? 'checkmark' : 'share-outline'}
            onPress={partager}
            full
          />

          <Text style={[typography.caption, { color: colors.warmGray, textAlign: 'center' }]}>
            {t('pro.referralHow', { days: REFERRAL_DAYS })}
          </Text>
        </MCard>

        {/* Compteur de gains */}
        <MCard style={{ gap: spacing.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <Ionicons name="gift-outline" size={18} color={colors.primaryInk} />
            <Text style={[typography.title, { color: colors.dark, flex: 1, textAlign: 'left' }]}>
              {t('pro.referralEarned', { days: data.daysEarned })}
            </Text>
          </View>
          <Divider />
          <Text style={[typography.caption, { color: colors.warmGray, textAlign: 'left' }]}>
            {plafondAtteint
              ? t('pro.referralCapReached')
              : t('pro.referralRemaining', { days: data.daysRemaining })}
          </Text>
        </MCard>

        <View>
          <SectionTitle title={t('pro.referralGuests')} />

          {data.filleuls.length === 0 ? (
            <EmptyState icon="people-outline" title={t('pro.referralEmpty')} />
          ) : (
            <MCard padded={false}>
              {data.filleuls.map((f, i) => (
                <View key={f.id}>
                  {i > 0 ? <Divider /> : null}
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: spacing.md,
                      padding: spacing.lg,
                    }}
                  >
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={[typography.secondary, { color: colors.dark, textAlign: 'left' }]}>
                        {f.salle_name || f.name || '—'}
                      </Text>
                      <Text style={[typography.caption, { color: colors.warmGray, textAlign: 'left' }]}>
                        {f.status === REFERRAL_STATUS.PENDING ? t('pro.referralPending') : f.name}
                      </Text>
                    </View>

                    {f.status === REFERRAL_STATUS.REWARDED ? (
                      <MBadge
                        label={t('pro.referralRewarded', { days: f.days_granted })}
                        tone="success"
                        size="sm"
                      />
                    ) : f.status === REFERRAL_STATUS.REJECTED ? (
                      <MBadge label={t('pro.referralRejected')} size="sm" />
                    ) : (
                      <Ionicons name="hourglass-outline" size={16} color={colors.warmGray} />
                    )}
                  </View>
                </View>
              ))}
            </MCard>
          )}
        </View>
      </Body>
    </Screen>
  );
}
