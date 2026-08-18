import { useCallback, useState } from 'react';
import { View, Text, RefreshControl, useWindowDimensions } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Screen, Body, Header } from '../../components/Screen';
import KpiCard from '../../components/KpiCard';
import { MCard, SectionTitle, Loader, ErrorState } from '../../components/primitives';
import { useTheme } from '../../context/ThemeContext';
import { useI18n } from '../../i18n';
import { formatDACompact } from '../../lib/format';
import * as api from '../../data';

/** Ligne d'alerte cliquable vers la file correspondante. */
function Todo({ icon, label, count, tone, onPress }) {
  const { colors, typography, spacing, radii } = useTheme();

  if (!count) return null;
  const color = tone === 'danger' ? colors.accentInk : colors.goldText;
  const bg = tone === 'danger' ? colors.accentLight : colors.goldLight;

  return (
    <MCard onPress={onPress} style={{ backgroundColor: bg, borderColor: 'transparent' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <View
          style={{
            width: 30,
            height: 30,
            borderRadius: radii.md,
            backgroundColor: colors.surface,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 15 }}>{icon}</Text>
        </View>
        <Text style={[typography.secondary, { color, flex: 1, textAlign: 'left' }]}>{label}</Text>
        <Text style={[typography.h3, { color }]}>{count}</Text>
      </View>
    </MCard>
  );
}

export default function AdminDashboardScreen({ navigation }) {
  const { colors, typography, spacing } = useTheme();
  const { t } = useI18n();
  const { width } = useWindowDimensions();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setData(await api.adminGetOverview());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
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
        <Header title={t('admin.title')} bordered={false} />
        <Loader />
      </Screen>
    );
  }
  if (error || !data) {
    return (
      <Screen>
        <Header title={t('admin.title')} bordered={false} />
        <ErrorState message={error} onRetry={load} />
      </Screen>
    );
  }

  const inner = Math.min(width, 900) - spacing.lg * 2;
  const perRow = width >= 720 ? 4 : 2;
  const kpiWidth = (inner - spacing.md * (perRow - 1)) / perRow;

  return (
    <Screen>
      <Header title={t('admin.title')} subtitle={t('admin.overview')} bordered={false} />

      <Body
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            tintColor={colors.primaryInk}
          />
        }
      >
        {/* Ce qui attend une décision, avant les chiffres */}
        <View style={{ gap: spacing.sm }}>
          <Todo
            icon="🏛"
            tone="gold"
            label={t('admin.sallesPending')}
            count={data.salles.pending}
            onPress={() => navigation.navigate('AdminSalles')}
          />
          <Todo
            icon="🚩"
            tone="danger"
            label={t('admin.reviewsFlagged')}
            count={data.reviews.flagged}
            onPress={() => navigation.navigate('AdminReviews')}
          />
        </View>

        <View>
          <SectionTitle title={t('admin.overview')} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
            <KpiCard
              label={t('admin.sallesActive')}
              value={String(data.salles.active)}
              icon="business-outline"
              width={kpiWidth}
            />
            <KpiCard
              label={t('admin.usersTotal')}
              value={String(data.users.total)}
              icon="people-outline"
              width={kpiWidth}
            />
            <KpiCard
              label={t('admin.reservationsTotal')}
              value={String(data.reservations.total)}
              icon="calendar-outline"
              width={kpiWidth}
            />
            <KpiCard
              label={t('admin.mrr')}
              value={formatDACompact(data.subscriptions.mrr, t('common.currency'))}
              icon="card-outline"
              tone="gold"
              width={kpiWidth}
            />
          </View>
        </View>

        <MCard style={{ gap: spacing.sm }}>
          <Text style={[typography.caption, { color: colors.warmGray }]}>
            {t('admin.usersDetail', { clients: data.users.clients, pros: data.users.pros })}
          </Text>
          <Text style={[typography.caption, { color: colors.warmGray }]}>
            {t('admin.reservationsMonth', { count: data.reservations.thisMonth })}
          </Text>
          <Text style={[typography.caption, { color: colors.warmGray }]}>
            {t('admin.mrrDetail', {
              active: data.subscriptions.active,
              trial: data.subscriptions.trial,
            })}
          </Text>
        </MCard>
      </Body>
    </Screen>
  );
}
