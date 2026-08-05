import { useCallback, useState } from 'react';
import { View, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Screen, Header, Body } from '../../components/Screen';
import ReservationCard from '../../components/ReservationCard';
import { MChip, Loader, EmptyState, ErrorState } from '../../components/primitives';
import { useTheme } from '../../context/ThemeContext';
import { useI18n } from '../../i18n';
import { todayISO } from '../../lib/format';
import * as api from '../../data';

export default function MyReservationsScreen({ navigation }) {
  const { colors, spacing } = useTheme();
  const { t, dir } = useI18n();

  const [tab, setTab] = useState('upcoming');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setRows(await api.listMyReservations());
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

  const today = todayISO();
  const filtered = rows.filter((r) => (tab === 'upcoming' ? r.event_date >= today : r.event_date < today));

  return (
    <Screen>
      <Header title={t('reservations.title')} bordered={false} />

      <View style={{ flexDirection: dir, gap: spacing.sm, paddingHorizontal: spacing.lg }}>
        <MChip label={t('reservations.upcoming')} active={tab === 'upcoming'} onPress={() => setTab('upcoming')} />
        <MChip label={t('reservations.past')} active={tab === 'past'} onPress={() => setTab('past')} />
      </View>

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
        {loading ? (
          <Loader />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="calendar-outline"
            title={t('reservations.empty')}
            body={t('reservations.emptyHint')}
          />
        ) : (
          filtered.map((r) => (
            <ReservationCard
              key={r.id}
              reservation={r}
              onPress={() => navigation.navigate('ReservationDetail', { id: r.id })}
            />
          ))
        )}
      </Body>
    </Screen>
  );
}
