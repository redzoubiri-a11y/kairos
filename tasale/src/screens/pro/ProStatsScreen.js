import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Screen, Header, Body } from '../../components/Screen';
import { RevenueLine, BreakdownBars } from '../../components/charts';
import { MCard, SectionTitle, Loader, ErrorState } from '../../components/primitives';
import { useTheme } from '../../context/ThemeContext';
import { useI18n } from '../../i18n';
import * as api from '../../data';

const SOURCE_LABEL = {
  app: 'pro.sourceApp',
  wom: 'pro.sourceWom',
  social: 'pro.sourceSocial',
  other: 'pro.sourceOther',
};

export default function ProStatsScreen({ navigation }) {
  const { spacing } = useTheme();
  const { t, list } = useI18n();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setStats(await api.proGetStats());
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

  if (loading) {
    return (
      <Screen>
        <Header title={t('pro.statsTitle')} bordered={false} onBack={navigation.goBack} />
        <Loader />
      </Screen>
    );
  }
  if (error || !stats) {
    return (
      <Screen>
        <Header title={t('pro.statsTitle')} bordered={false} onBack={navigation.goBack} />
        <ErrorState message={error} onRetry={load} />
      </Screen>
    );
  }

  const monthsShort = list('monthsShort');

  return (
    <Screen>
      <Header title={t('pro.statsTitle')} bordered={false} onBack={navigation.goBack} />

      <Body>
        {/* Types d'événements — lignes libellées, teinte unique */}
        <MCard>
          <SectionTitle title={t('pro.statsEventTypes')} />
          <BreakdownBars
            rows={stats.eventTypes.map((e) => ({
              key: e.type,
              label: t(`events.${e.type}`),
              value: e.percent,
            }))}
          />
        </MCard>

        {/* Taux d'occupation mensuel */}
        <MCard>
          <SectionTitle title={t('pro.statsOccupancy')} />
          <BreakdownBars
            rows={stats.occupancy.map((o) => ({
              key: o.key,
              label: monthsShort[o.month],
              value: o.percent,
            }))}
          />
        </MCard>

        {/* Sources de réservation */}
        <MCard>
          <SectionTitle title={t('pro.statsSources')} />
          <BreakdownBars
            rows={stats.sources.map((s) => ({
              key: s.source,
              label: t(SOURCE_LABEL[s.source] || 'pro.sourceOther'),
              value: s.percent,
            }))}
            tone="secondary"
          />
        </MCard>

        {/* Courbe de revenus — série unique */}
        <MCard>
          <SectionTitle title={t('pro.statsRevenue')} />
          <RevenueLine data={stats.revenueSeries} />
        </MCard>

        <View style={{ height: spacing.lg }} />
      </Body>
    </Screen>
  );
}
