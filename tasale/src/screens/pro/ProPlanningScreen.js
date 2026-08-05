import { useCallback, useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Header, Body } from '../../components/Screen';
import Calendar, { CalendarLegend } from '../../components/Calendar';
import MButton from '../../components/MButton';
import { StatusBadge } from '../../components/ReservationCard';
import { MCard, KeyValue, Divider, Loader } from '../../components/primitives';
import { useTheme } from '../../context/ThemeContext';
import { useI18n } from '../../i18n';
import { formatDA, formatLongDate, todayISO } from '../../lib/format';

import * as api from '../../data';

export default function ProPlanningScreen({ navigation }) {
  const { colors, typography, spacing } = useTheme();
  const { t, list, dir, align } = useI18n();

  const today = new Date();
  const [cursor, setCursor] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [planning, setPlanning] = useState(null);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setPlanning(await api.proGetPlanning(cursor.year, cursor.month));
    } finally {
      setLoading(false);
    }
  }, [cursor]);

  useEffect(() => {
    load();
  }, [load]);

  const changeMonth = (delta) => {
    setSelected(null);
    setCursor((c) => {
      const d = new Date(c.year, c.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  };

  const toggleBlock = async () => {
    setBusy(true);
    try {
      await api.proToggleBlockedDay(selected);
      await load();
    } finally {
      setBusy(false);
    }
  };

  if (loading || !planning) {
    return (
      <Screen>
        <Header title={t('pro.planningTitle')} bordered={false} />
        <Loader />
      </Screen>
    );
  }

  const state = selected ? planning.availability[selected] : null;
  const resa = selected ? planning.byDay[selected] : null;

  return (
    <Screen>
      <Header title={t('pro.planningTitle')} bordered={false} />

      <Body>
        <MCard>
          <Calendar
            year={cursor.year}
            month={cursor.month}
            availability={planning.availability}
            selected={selected}
            onSelect={(iso) => setSelected(iso === selected ? null : iso)}
            onChangeMonth={changeMonth}
            variant="pro"
            markers={planning.byDay}
          />
        </MCard>

        <CalendarLegend
          items={[
            { state: 'booked', label: t('status.confirmed') },
            { state: 'held', label: t('status.pending') },
            { state: 'blocked', label: t('pro.blocked') },
            { state: 'available', label: t('booking.legendAvailable') },
          ]}
        />

        {/* Panneau de détail du jour sélectionné (§5.3) */}
        {selected ? (
          <MCard style={{ gap: spacing.md }}>
            <View style={{ flexDirection: dir, alignItems: 'center', gap: spacing.sm }}>
              <Ionicons name="calendar-outline" size={17} color={colors.primaryInk} />
              <Text style={[typography.title, { fontSize: 15, color: colors.dark, flex: 1, textAlign: align }]}>
                {formatLongDate(selected, list('months'))}
              </Text>
              {resa ? <StatusBadge status={resa.status} size="sm" /> : null}
            </View>

            <Divider />

            {resa ? (
              <>
                <KeyValue label={t('pro.client')} value={resa.client_name} />
                <KeyValue label={t('pro.type')} value={t(`events.${resa.event_type}`)} />
                <KeyValue label={t('booking.guestCount')} value={`${resa.guest_count} ${t('common.guests')}`} />
                <KeyValue label={t('booking.formula')} value={resa.formula?.name || '—'} />
                <KeyValue
                  label={t('booking.amount')}
                  value={formatDA(resa.total_amount, t('common.currency'))}
                  strong
                  tone="primary"
                />

                <MButton
                  label={t('common.message')}
                  variant="secondary"
                  icon="chatbubble-ellipses-outline"
                  onPress={() => navigation.navigate('Chat', { reservationId: resa.id, title: resa.client_name })}
                  full
                />
              </>
            ) : (
              <>
                <Text style={[typography.secondary, { color: colors.warmGray, textAlign: align }]}>
                  {t('pro.dayFree')}
                </Text>

                {selected >= todayISO() ? (
                  <MButton
                    label={state === 'blocked' ? t('pro.unblockDay') : t('pro.blockDay')}
                    variant={state === 'blocked' ? 'primary' : 'ghost'}
                    onPress={toggleBlock}
                    loading={busy}
                    full
                  />
                ) : null}
              </>
            )}
          </MCard>
        ) : null}
      </Body>
    </Screen>
  );
}
