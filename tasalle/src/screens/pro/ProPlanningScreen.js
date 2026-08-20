import { useCallback, useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Header, Body } from '../../components/Screen';
import Calendar, { CalendarLegend } from '../../components/Calendar';
import MButton from '../../components/MButton';
import { StatusBadge } from '../../components/ReservationCard';
import { MCard, KeyValue, Divider, Loader, OfflineBanner } from '../../components/primitives';
import { withCache, cacheKey } from '../../data/cache';
import { buildPlanningHtml, exportToPdf, pdfLabels } from '../../services/pdf';
import { useTheme } from '../../context/ThemeContext';
import { useI18n } from '../../i18n';
import { formatDA, formatLongDate, todayISO } from '../../lib/format';

import { useProSalle } from '../../context/ProSalleContext';
import SalleSwitcher from '../../components/SalleSwitcher';
import * as api from '../../data';

export default function ProPlanningScreen({ navigation }) {
  const { colors, typography, spacing } = useTheme();
  const { t, list } = useI18n();
  const { currentId } = useProSalle();

  const today = new Date();
  const [cursor, setCursor] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [planning, setPlanning] = useState(null);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [exporting, setExporting] = useState(false);
  // Horodatage de la copie locale, nul quand les données sont fraîches.
  const [staleSince, setStaleSince] = useState(null);

  const load = useCallback(async () => {
    try {
      // §1.4 — le planning reste consultable sans connexion.
      const { data, at } = await withCache(
        // La clé porte la salle : deux salles ne partagent pas leur cache.
        cacheKey('planning', currentId, cursor.year, cursor.month),
        () => api.proGetPlanning(currentId, cursor.year, cursor.month)
      );
      setPlanning(data);
      setStaleSince(at);
    } finally {
      setLoading(false);
    }
  }, [cursor, currentId]);

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

  const exportPlanning = async () => {
    setExporting(true);
    try {
      await exportToPdf({
        html: buildPlanningHtml({
          salle: { name: planning.salleName },
          year: cursor.year,
          month: cursor.month,
          availability: planning.availability,
          byDay: planning.byDay,
          months: list('months'),
          weekdays: list('weekdays'),
          labels: pdfLabels(t),
        }),
      });
    } catch {
      // Impression annulée ou indisponible : rien à signaler à l'utilisateur.
    } finally {
      setExporting(false);
    }
  };

  const toggleBlock = async () => {
    setBusy(true);
    try {
      await api.proToggleBlockedDay(currentId, selected);
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
      <Header
        title={t('pro.planningTitle')}
        bordered={false}
        right={
          <MButton
            label={t('common.exportPdf')}
            variant="ghost"
            size="sm"
            icon="download-outline"
            loading={exporting}
            onPress={exportPlanning}
          />
        }
      />

      <SalleSwitcher />

      <Body>
        <OfflineBanner at={staleSince} />

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
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <Ionicons name="calendar-outline" size={17} color={colors.primaryInk} />
              <Text style={[typography.title, { fontSize: 15, color: colors.dark, flex: 1, textAlign: 'left' }]}>
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
                <Text style={[typography.secondary, { color: colors.warmGray, textAlign: 'left' }]}>
                  {t('pro.dayFree')}
                </Text>

                {selected >= todayISO() ? (
                  <MButton
                    label={state === 'blocked' ? t('pro.unblockDay') : t('pro.blockDay')}
                    variant={state === 'blocked' ? 'primary' : 'ghost'}
                    onPress={toggleBlock}
                    loading={busy}
                    // Hors ligne, la consultation est permise mais pas l'écriture :
                    // bloquer un jour depuis une copie périmée corromprait le planning.
                    disabled={!!staleSince}
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
