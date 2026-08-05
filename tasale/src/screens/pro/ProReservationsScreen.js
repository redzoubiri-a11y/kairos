import { useCallback, useMemo, useState } from 'react';
import { View, Text, ScrollView, Linking } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Screen, Header, Body } from '../../components/Screen';
import ReservationCard from '../../components/ReservationCard';
import MButton, { ButtonRow } from '../../components/MButton';
import MInput from '../../components/MInput';
import MSheet from '../../components/MSheet';
import PinPad from '../../components/PinPad';
import { MChip, Loader, EmptyState, ErrorState, KeyValue, Divider } from '../../components/primitives';
import { useTheme } from '../../context/ThemeContext';
import { useI18n } from '../../i18n';
import { formatDA, displayPhone, formatLongDate } from '../../lib/format';
import { RESERVATION_STATUS, DEPOSIT_MIN_RATE, DEPOSIT_MAX_RATE } from '../../lib/constants';
import * as api from '../../data';

const FILTERS = ['all', 'pending', 'confirmed', 'cancelled', 'past'];

export default function ProReservationsScreen({ route, navigation }) {
  const { colors, typography, spacing } = useTheme();
  const { t, list, dir, isRTL, align } = useI18n();

  const [filter, setFilter] = useState(route.params?.filter || 'all');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Confirmation en deux temps : acompte puis signature PIN (§10.1)
  const [confirming, setConfirming] = useState(null);
  const [deposit, setDeposit] = useState('');
  const [ccp, setCcp] = useState('');
  const [pinStage, setPinStage] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(null);

  const [refusing, setRefusing] = useState(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      setRows(await api.proListReservations(filter));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const openConfirm = (resa) => {
    setConfirming(resa);
    setPinStage(false);
    setPin('');
    setPinError(null);
    // Acompte suggéré : 30 % du montant (borne basse §10.1)
    setDeposit(String(Math.round((resa.total_amount || 0) * DEPOSIT_MIN_RATE)));
  };

  const depositBounds = useMemo(() => {
    if (!confirming) return null;
    return {
      min: Math.round((confirming.total_amount || 0) * DEPOSIT_MIN_RATE),
      max: Math.round((confirming.total_amount || 0) * DEPOSIT_MAX_RATE),
    };
  }, [confirming]);

  const signAndConfirm = async (finalPin) => {
    setBusy(true);
    setPinError(null);
    try {
      await api.proConfirmReservation(confirming.id, {
        depositAmount: Number(deposit) || null,
        ccp: ccp || null,
        pin: finalPin,
      });
      setConfirming(null);
      setPinStage(false);
      setPin('');
      await load();
    } catch (e) {
      if (e.code === 'WRONG_PIN') setPinError(t('pro.pinWrong'));
      else if (e.code === 'DAY_TAKEN') setPinError(t('booking.dayTaken'));
      else setPinError(e.message || t('common.error'));
      setPin('');
    } finally {
      setBusy(false);
    }
  };

  const refuse = async () => {
    setBusy(true);
    try {
      await api.proCancelReservation(refusing.id, reason.trim() || null);
      setRefusing(null);
      setReason('');
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const verifyDeposit = async (resa) => {
    setBusy(true);
    try {
      await api.proVerifyDeposit(resa.id);
      await load();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <Header title={t('pro.reservationsTitle')} bordered={false} />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          gap: spacing.sm,
          paddingHorizontal: spacing.lg,
          flexDirection: isRTL ? 'row-reverse' : 'row',
        }}
        style={{ flexGrow: 0 }}
      >
        {FILTERS.map((f) => (
          <MChip
            key={f}
            label={t(`pro.filter${f.charAt(0).toUpperCase()}${f.slice(1)}`)}
            active={filter === f}
            onPress={() => setFilter(f)}
          />
        ))}
      </ScrollView>

      <Body>
        {loading ? (
          <Loader />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : rows.length === 0 ? (
          <EmptyState icon="calendar-outline" title={t('reservations.empty')} />
        ) : (
          rows.map((resa) => (
            <ReservationCard key={resa.id} reservation={resa} perspective="pro">
              <View style={{ gap: spacing.sm }}>
                <Divider />

                {resa.deposit_amount ? (
                  <Text style={[typography.caption, { color: colors.warmGray, textAlign: align }]}>
                    {t('reservations.depositAmount', {
                      amount: formatDA(resa.deposit_amount, t('common.currency')),
                    })}
                    {resa.deposit_paid ? ` · ${t('reservations.depositPaid')}` : ''}
                  </Text>
                ) : null}

                <View style={{ flexDirection: dir, gap: spacing.sm, flexWrap: 'wrap' }}>
                  {resa.status === RESERVATION_STATUS.PENDING ? (
                    <>
                      <MButton label={t('common.confirm')} size="sm" onPress={() => openConfirm(resa)} />
                      <MButton
                        label={t('common.refuse')}
                        size="sm"
                        variant="accent"
                        onPress={() => setRefusing(resa)}
                      />
                    </>
                  ) : null}

                  {resa.status === RESERVATION_STATUS.CONFIRMED &&
                  resa.deposit_amount &&
                  !resa.deposit_paid ? (
                    <MButton
                      label={t('pro.markDepositPaid')}
                      size="sm"
                      variant="gold"
                      loading={busy}
                      onPress={() => verifyDeposit(resa)}
                    />
                  ) : null}

                  <MButton
                    label={t('common.call')}
                    size="sm"
                    variant="ghost"
                    icon="call-outline"
                    onPress={() => Linking.openURL(`tel:${resa.client_phone}`).catch(() => {})}
                  />
                  <MButton
                    label={t('common.message')}
                    size="sm"
                    variant="ghost"
                    icon="chatbubble-ellipses-outline"
                    onPress={() =>
                      navigation.navigate('Chat', { reservationId: resa.id, title: resa.client_name })
                    }
                  />
                </View>
              </View>
            </ReservationCard>
          ))
        )}
      </Body>

      {/* Confirmation — acompte puis PIN */}
      <MSheet
        visible={!!confirming}
        onClose={() => {
          setConfirming(null);
          setPinStage(false);
        }}
        title={pinStage ? t('pro.pinTitle') : t('pro.confirmTitle')}
      >
        {confirming && !pinStage ? (
          <>
            <View>
              <KeyValue label={t('pro.client')} value={confirming.client_name} />
              <KeyValue label={t('booking.date')} value={formatLongDate(confirming.event_date, list('months'))} />
              <KeyValue label={t('booking.phone')} value={displayPhone(confirming.client_phone)} />
              <KeyValue
                label={t('booking.amount')}
                value={formatDA(confirming.total_amount, t('common.currency'))}
                strong
                tone="primary"
              />
            </View>

            <MInput
              label={t('pro.confirmDeposit')}
              value={deposit}
              onChangeText={(v) => setDeposit(v.replace(/\D/g, ''))}
              keyboardType="number-pad"
              direction="ltr"
              suffix={t('common.currency')}
              hint={
                depositBounds
                  ? `${formatDA(depositBounds.min, t('common.currency'))} – ${formatDA(
                      depositBounds.max,
                      t('common.currency')
                    )}`
                  : undefined
              }
            />

            <MInput
              label={t('pro.ccpNumber')}
              value={ccp}
              onChangeText={setCcp}
              direction="ltr"
              hint={t('pro.confirmDepositHint')}
            />

            <MButton label={t('common.next')} size="lg" full onPress={() => setPinStage(true)} />
          </>
        ) : null}

        {confirming && pinStage ? (
          <View style={{ paddingVertical: spacing.md }}>
            <PinPad value={pin} onChange={setPin} onComplete={signAndConfirm} error={pinError} />
            {busy ? (
              <Text style={[typography.caption, { color: colors.warmGray, textAlign: 'center', marginTop: spacing.md }]}>
                {t('common.loading')}
              </Text>
            ) : null}
          </View>
        ) : null}
      </MSheet>

      {/* Refus */}
      <MSheet visible={!!refusing} onClose={() => setRefusing(null)} title={t('pro.refuseTitle')}>
        <Text style={[typography.secondary, { color: colors.warmGray, textAlign: align }]}>
          {t('pro.refuseHint')}
        </Text>
        <MInput label={t('pro.refuseReason')} value={reason} onChangeText={setReason} multiline />
        <ButtonRow>
          <MButton
            label={t('common.cancel')}
            variant="ghost"
            onPress={() => setRefusing(null)}
            style={{ flex: 1 }}
          />
          <MButton label={t('common.refuse')} variant="accent" onPress={refuse} loading={busy} style={{ flex: 1 }} />
        </ButtonRow>
      </MSheet>
    </Screen>
  );
}
