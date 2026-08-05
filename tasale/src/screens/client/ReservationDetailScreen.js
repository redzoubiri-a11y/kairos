import { useCallback, useEffect, useState } from 'react';
import { View, Text, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Header, Body } from '../../components/Screen';
import MButton from '../../components/MButton';
import { StatusBadge } from '../../components/ReservationCard';
import { MCard, KeyValue, Loader, ErrorState, Divider, MBadge } from '../../components/primitives';
import { useTheme } from '../../context/ThemeContext';
import { useI18n } from '../../i18n';
import { formatDA, formatLongDate, daysBetween, todayISO } from '../../lib/format';
import { RESERVATION_STATUS, REVIEW_DELAY_HOURS } from '../../lib/constants';
import { buildContractHtml, exportToPdf, pdfLabels } from '../../services/pdf';
import * as api from '../../data';

/** Confirmation multiplateforme : Alert n'existe pas sur le web. */
function confirmAction(title, message, onConfirm, labels) {
  if (Platform.OS === 'web') {
    // eslint-disable-next-line no-alert
    if (window.confirm(`${title}\n\n${message}`)) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: labels.cancel, style: 'cancel' },
    { text: labels.confirm, style: 'destructive', onPress: onConfirm },
  ]);
}

export default function ReservationDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const { colors, typography, spacing, radii } = useTheme();
  const { t, list, dir, align } = useI18n();

  const [resa, setResa] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      setResa(await api.getReservation(id));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const cancel = () => {
    confirmAction(
      t('reservations.cancel'),
      t('reservations.cancelConfirm'),
      async () => {
        setBusy(true);
        try {
          await api.cancelReservation(id);
          await load();
        } catch (e) {
          setError(e.code === 'NOT_CANCELLABLE' ? t('reservations.cancelOnlyPending') : e.message);
        } finally {
          setBusy(false);
        }
      },
      { cancel: t('common.back'), confirm: t('common.confirm') }
    );
  };

  const downloadContract = async () => {
    setExporting(true);
    try {
      await exportToPdf({
        html: buildContractHtml({
          reservation: resa,
          salle: resa.salle,
          // Le propriétaire n'est pas exposé au client : le contrat porte le
          // nom de la salle, sans les coordonnées personnelles du gérant.
          pro: { full_name: resa.salle?.name },
          months: list('months'),
          labels: pdfLabels(t),
        }),
      });
    } catch {
      // Impression annulée : rien à signaler.
    } finally {
      setExporting(false);
    }
  };

  const declare = async () => {
    setBusy(true);
    try {
      await api.declareDeposit(id);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <Screen>
        <Header title={t('common.details')} onBack={navigation.goBack} />
        <Loader />
      </Screen>
    );
  }
  if (!resa) {
    return (
      <Screen>
        <Header title={t('common.details')} onBack={navigation.goBack} />
        <ErrorState message={error} onRetry={load} />
      </Screen>
    );
  }

  // §10.2 — l'avis n'est ouvert que 48 h après l'événement
  const hoursSinceEvent = daysBetween(resa.event_date, todayISO()) * 24;
  const canReview =
    !resa.has_review &&
    hoursSinceEvent >= REVIEW_DELAY_HOURS / 24 &&
    (resa.status === RESERVATION_STATUS.COMPLETED || resa.status === RESERVATION_STATUS.CONFIRMED) &&
    resa.event_date < todayISO();

  return (
    <Screen>
      <Header title={resa.reference} subtitle={resa.salle?.name} onBack={navigation.goBack} />

      <Body>
        <View style={{ flexDirection: dir, alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={[typography.h3, { color: colors.dark }]}>{t(`events.${resa.event_type}`)}</Text>
          <StatusBadge status={resa.status} />
        </View>

        <MCard>
          <KeyValue label={t('booking.hall')} value={resa.salle?.name || '—'} />
          <Divider />
          <KeyValue label={t('booking.date')} value={formatLongDate(resa.event_date, list('months'))} />
          <Divider />
          <KeyValue label={t('booking.formula')} value={resa.formula?.name || '—'} />
          <Divider />
          <KeyValue label={t('booking.guestCount')} value={`${resa.guest_count} ${t('common.guests')}`} />
          <Divider />
          <KeyValue
            label={t('booking.amount')}
            value={formatDA(resa.total_amount, t('common.currency'))}
            strong
            tone="primary"
          />
        </MCard>

        {resa.client_message ? (
          <MCard>
            <Text style={[typography.caption, { color: colors.warmGray, marginBottom: 4, textAlign: align }]}>
              {t('booking.messageToOwner')}
            </Text>
            <Text style={[typography.secondary, { color: colors.dark, textAlign: align }]}>
              {resa.client_message}
            </Text>
          </MCard>
        ) : null}

        {/* §11.1 — parcours d'acompte */}
        {resa.deposit_amount ? (
          <MCard style={{ gap: spacing.md }}>
            <View style={{ flexDirection: dir, alignItems: 'center', gap: spacing.sm }}>
              <Ionicons name="cash-outline" size={18} color={colors.gold} />
              <Text style={[typography.title, { fontSize: 15, color: colors.dark, flex: 1 }]}>
                {t('reservations.depositRequested')}
              </Text>
              {resa.deposit_paid ? (
                <MBadge label={t('reservations.depositPaid')} tone="success" size="sm" />
              ) : resa.deposit_declared ? (
                <MBadge label={t('reservations.depositDeclared')} tone="warning" size="sm" />
              ) : null}
            </View>

            <Text style={[typography.h3, { color: colors.primaryInk, textAlign: align }]}>
              {formatDA(resa.deposit_amount, t('common.currency'))}
            </Text>

            {!resa.deposit_paid && !resa.deposit_declared ? (
              <MButton
                label={t('reservations.declareDeposit')}
                variant="gold"
                onPress={declare}
                loading={busy}
                full
              />
            ) : null}
          </MCard>
        ) : null}

        <View style={{ gap: spacing.md }}>
          {/* Annexe C — le contrat n'existe qu'une fois la réservation signée */}
          {resa.status === RESERVATION_STATUS.CONFIRMED ||
          resa.status === RESERVATION_STATUS.COMPLETED ? (
            <MButton
              label={t('reservations.downloadContract')}
              variant="secondary"
              icon="document-text-outline"
              loading={exporting}
              onPress={downloadContract}
              full
            />
          ) : null}

          <MButton
            label={t('reservations.contactOwner')}
            variant="secondary"
            icon="chatbubble-ellipses-outline"
            onPress={() => navigation.navigate('Chat', { reservationId: resa.id, title: resa.salle?.name })}
            full
          />

          {canReview ? (
            <MButton
              label={t('reservations.leaveReview')}
              variant="gold"
              icon="star-outline"
              onPress={() =>
                navigation.navigate('ReviewForm', { reservationId: resa.id, salleName: resa.salle?.name })
              }
              full
            />
          ) : null}

          {resa.has_review ? (
            <View
              style={{
                flexDirection: dir,
                alignItems: 'center',
                gap: spacing.sm,
                padding: spacing.md,
                borderRadius: radii.lg,
                backgroundColor: colors.successBg,
              }}
            >
              <Ionicons name="checkmark-circle" size={16} color={colors.primaryInk} />
              <Text style={[typography.caption, { color: colors.primaryInk }]}>{t('reservations.reviewDone')}</Text>
            </View>
          ) : null}

          {resa.status === RESERVATION_STATUS.PENDING ? (
            <MButton label={t('reservations.cancel')} variant="ghost" onPress={cancel} loading={busy} full />
          ) : null}
        </View>

        {error ? <Text style={[typography.caption, { color: colors.accent }]}>{error}</Text> : null}
      </Body>
    </Screen>
  );
}
