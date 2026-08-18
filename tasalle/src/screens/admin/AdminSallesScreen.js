import { useCallback, useState } from 'react';
import { View, Text, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Screen, Header, Body } from '../../components/Screen';
import SallePhoto from '../../components/SallePhoto';
import MButton, { ButtonRow } from '../../components/MButton';
import { MCard, KeyValue, Divider, Loader, EmptyState, ErrorState } from '../../components/primitives';
import { useTheme } from '../../context/ThemeContext';
import { useI18n } from '../../i18n';
import { formatDA, displayPhone } from '../../lib/format';
import * as api from '../../data';

/** Confirmation multiplateforme : Alert n'existe pas sur le web. */
function confirmer(titre, message, onConfirm, labels) {
  if (Platform.OS === 'web') {
    // eslint-disable-next-line no-alert
    if (window.confirm(`${titre}\n\n${message}`)) onConfirm();
    return;
  }
  Alert.alert(titre, message, [
    { text: labels.cancel, style: 'cancel' },
    { text: labels.confirm, onPress: onConfirm },
  ]);
}

export default function AdminSallesScreen() {
  const { colors, typography, spacing, radii } = useTheme();
  const { t, list } = useI18n();

  const [salles, setSalles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setSalles(await api.adminListPendingSalles());
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

  const decide = (salle, approved) => {
    confirmer(
      approved ? t('admin.approve') : t('admin.reject'),
      approved
        ? t('admin.approveConfirm', { name: salle.name })
        : t('admin.rejectConfirm', { name: salle.name }),
      async () => {
        setBusyId(salle.id);
        try {
          await api.adminReviewSalle(salle.id, approved);
          await load();
        } catch (e) {
          setError(e.message);
        } finally {
          setBusyId(null);
        }
      },
      { cancel: t('common.cancel'), confirm: t('common.confirm') }
    );
  };

  const dateDepot = (iso) => {
    const d = new Date(iso);
    return `${d.getDate()} ${list('monthsShort')[d.getMonth()]}`;
  };

  return (
    <Screen>
      <Header title={t('admin.sallesTitle')} bordered={false} />

      <Body>
        {loading ? (
          <Loader />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : salles.length === 0 ? (
          <EmptyState
            icon="checkmark-done-outline"
            title={t('admin.sallesEmpty')}
            body={t('admin.sallesEmptyHint')}
          />
        ) : (
          salles.map((salle) => (
            <MCard key={salle.id} padded={false}>
              <SallePhoto salle={salle} height={120} />

              <View style={{ padding: spacing.lg, gap: spacing.md }}>
                <View style={{ gap: 2 }}>
                  <Text style={[typography.title, { color: colors.dark, textAlign: 'left' }]}>
                    {salle.name}
                  </Text>
                  <Text style={[typography.caption, { color: colors.warmGray, textAlign: 'left' }]}>
                    {salle.city} · {t('admin.submittedOn', { date: dateDepot(salle.created_at) })}
                  </Text>
                </View>

                {salle.description ? (
                  <Text
                    style={[typography.caption, { color: colors.warmGray, textAlign: 'left' }]}
                    numberOfLines={4}
                  >
                    {salle.description}
                  </Text>
                ) : null}

                <Divider />

                <View>
                  <KeyValue label={t('admin.owner')} value={salle.owner?.full_name || '—'} />
                  <KeyValue label={t('booking.phone')} value={displayPhone(salle.owner?.phone)} />
                  <KeyValue label={t('pro.address')} value={salle.address || '—'} />
                  <KeyValue label={t('salle.capacity')} value={`${salle.capacity_max}`} />
                  {salle.price_from != null ? (
                    <KeyValue
                      label={t('common.from')}
                      value={formatDA(salle.price_from, t('common.currency'))}
                    />
                  ) : null}
                </View>

                {/* Une salle sans photo mérite un regard : la fiche restera nue */}
                {!salle.photos?.length ? (
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
                    <Ionicons name="image-outline" size={14} color={colors.goldText} />
                    <Text style={[typography.caption, { color: colors.goldText, flex: 1 }]}>
                      {t('admin.noPhotos')}
                    </Text>
                  </View>
                ) : null}

                <ButtonRow>
                  <MButton
                    label={t('admin.approve')}
                    icon="checkmark"
                    loading={busyId === salle.id}
                    onPress={() => decide(salle, true)}
                    style={{ flex: 1 }}
                  />
                  <MButton
                    label={t('admin.reject')}
                    variant="accent"
                    onPress={() => decide(salle, false)}
                    style={{ flex: 1 }}
                  />
                </ButtonRow>
              </View>
            </MCard>
          ))
        )}
      </Body>
    </Screen>
  );
}
