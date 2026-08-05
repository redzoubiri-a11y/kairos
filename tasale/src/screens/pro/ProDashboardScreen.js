import { useCallback, useState } from 'react';
import { View, Text, RefreshControl, useWindowDimensions, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Screen, Body } from '../../components/Screen';
import TasaleLogo from '../../components/TasaleLogo';
import KpiCard from '../../components/KpiCard';
import ReservationCard from '../../components/ReservationCard';
import { RevenueBars } from '../../components/charts';
import { MCard, MBadge, SectionTitle, Loader, ErrorState, EmptyState } from '../../components/primitives';
import { useTheme } from '../../context/ThemeContext';
import { useI18n } from '../../i18n';
import { formatDACompact } from '../../lib/format';

import * as api from '../../data';

function AlertRow({ icon, tone, label, onPress }) {
  const { colors, typography, spacing, radii } = useTheme();
  const { dir, align } = useI18n();
  const color = tone === 'danger' ? colors.accent : tone === 'gold' ? colors.goldText : colors.primary;
  const bg = tone === 'danger' ? colors.accentLight : tone === 'gold' ? colors.goldLight : colors.primaryLight;

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      style={{
        flexDirection: dir,
        alignItems: 'center',
        gap: spacing.md,
        backgroundColor: bg,
        borderRadius: radii.lg,
        padding: spacing.md,
      }}
    >
      <Ionicons name={icon} size={16} color={color} />
      <Text style={[typography.caption, { color, flex: 1, textAlign: align }]}>{label}</Text>
      {onPress ? <Ionicons name="chevron-forward" size={14} color={color} /> : null}
    </Pressable>
  );
}

export default function ProDashboardScreen({ navigation }) {
  const { colors, typography, spacing } = useTheme();
  const { t, dir } = useI18n();
  const { width } = useWindowDimensions();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setData(await api.proGetDashboard());
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
        <Loader />
      </Screen>
    );
  }
  if (error || !data) {
    return (
      <Screen>
        <ErrorState message={error} onRetry={load} />
      </Screen>
    );
  }

  const inner = Math.min(width, 900) - spacing.lg * 2;
  // 2 colonnes sur mobile, 4 sur écran large (le back-office tourne aussi sur le web)
  const perRow = width >= 720 ? 4 : 2;
  const kpiWidth = (inner - spacing.md * (perRow - 1)) / perRow;

  const { kpis } = data;

  return (
    <Screen>
      <View
        style={{
          flexDirection: dir,
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
          gap: spacing.sm,
        }}
      >
        <TasaleLogo size={32} showText={false} />
        <View style={{ flex: 1 }}>
          <Text style={[typography.title, { fontSize: 15, color: colors.dark }]} numberOfLines={1}>
            {data.salle?.name}
          </Text>
          <Text style={[typography.caption, { color: colors.warmGray }]} numberOfLines={1}>
            {data.salle?.city}
          </Text>
        </View>

        {data.subscriptionStatus === 'trial' ? (
          <MBadge label={t('pro.trialBadge', { days: data.trialDaysLeft })} tone="gold" size="sm" />
        ) : (
          <MBadge label={`⭐ ${t('pro.proBadge')}`} tone="gold" size="sm" />
        )}
      </View>

      <Body
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            tintColor={colors.primary}
          />
        }
      >
        {/* KPI (§5.2) */}
        <View style={{ flexDirection: dir, flexWrap: 'wrap', gap: spacing.md }}>
          <KpiCard
            label={t('pro.kpiReservations')}
            value={String(kpis.reservations.value)}
            delta={kpis.reservations.delta}
            deltaSuffix=""
            icon="calendar-outline"
            width={kpiWidth}
          />
          <KpiCard
            label={t('pro.kpiRevenue')}
            value={formatDACompact(kpis.revenue.value, t('common.currency'))}
            delta={kpis.revenue.delta}
            icon="trending-up-outline"
            width={kpiWidth}
          />
          <KpiCard
            label={t('pro.kpiConfirmRate')}
            value={kpis.confirmRate.value != null ? `${kpis.confirmRate.value}%` : '—'}
            delta={kpis.confirmRate.delta}
            deltaSuffix=" pts"
            icon="checkmark-done-outline"
            width={kpiWidth}
          />
          <KpiCard
            label={t('pro.kpiRating')}
            value={kpis.rating.value ? `${Number(kpis.rating.value).toFixed(1)}/5` : '—'}
            icon="star-outline"
            tone="gold"
            width={kpiWidth}
          />
        </View>

        {/* Alertes (§5.2) */}
        <View>
          <SectionTitle title={t('pro.alerts')} />
          <View style={{ gap: spacing.sm }}>
            {data.pendingCount > 0 ? (
              <AlertRow
                icon="mail-unread-outline"
                tone="danger"
                label={t('pro.alertPending', { count: data.pendingCount, s: data.pendingCount > 1 ? 's' : '' })}
                onPress={() => navigation.navigate('ProReservations', { filter: 'pending' })}
              />
            ) : null}

            {data.pendingReviews > 0 ? (
              <AlertRow
                icon="star-outline"
                tone="gold"
                label={t('pro.reviewsToModerate')}
                onPress={() => navigation.navigate('ProReviews')}
              />
            ) : null}

            {data.subscriptionStatus === 'trial' ? (
              <AlertRow
                icon="time-outline"
                tone="gold"
                label={t('pro.alertTrial', { days: data.trialDaysLeft })}
                onPress={() => navigation.navigate('ProSubscription')}
              />
            ) : null}

            {data.pendingCount === 0 && data.pendingReviews === 0 ? (
              <AlertRow icon="checkmark-circle-outline" tone="success" label={t('pro.noAlerts')} />
            ) : null}
          </View>
        </View>

        {/* Revenus 6 mois — série unique, pas de légende */}
        <MCard>
          <SectionTitle title={t('pro.revenueChart')} />
          <RevenueBars data={data.revenueSeries} />
        </MCard>

        {/* Prochaines réservations (§5.2) */}
        <View>
          <SectionTitle
            title={t('pro.nextReservations')}
            action={t('common.seeAll')}
            onAction={() => navigation.navigate('ProReservations')}
          />

          {data.upcoming.length === 0 ? (
            <EmptyState icon="calendar-outline" title={t('reservations.empty')} />
          ) : (
            <View style={{ gap: spacing.md }}>
              {data.upcoming.map((r) => (
                <ReservationCard
                  key={r.id}
                  reservation={r}
                  perspective="pro"
                  onPress={() => navigation.navigate('ProReservations', { focusId: r.id })}
                />
              ))}
            </View>
          )}
        </View>
      </Body>
    </Screen>
  );
}
