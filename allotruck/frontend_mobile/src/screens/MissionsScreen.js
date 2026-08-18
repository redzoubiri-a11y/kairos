import React, { useCallback, useEffect } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import ScreenHeader from '../components/ScreenHeader';
import MissionCard from '../components/MissionCard';
import SegmentedControl from '../components/SegmentedControl';
import EmptyState from '../components/EmptyState';
import Loader from '../components/Loader';
import ErrorBanner from '../components/ErrorBanner';
import { useMissionStore } from '../store/missionStore';
import { useAuthStore } from '../store/authStore';
import { colors, spacing } from '../theme';

const FILTERS = [
  { value: null, label: 'Toutes' },
  { value: 'PENDING', label: 'En attente' },
  { value: 'ACCEPTED', label: 'Acceptees' },
  { value: 'IN_PROGRESS', label: 'En cours' },
  { value: 'COMPLETED', label: 'Terminees' },
];

export default function MissionsScreen({ navigation }) {
  const items = useMissionStore((s) => s.items);
  const loading = useMissionStore((s) => s.loading);
  const refreshing = useMissionStore((s) => s.refreshing);
  const error = useMissionStore((s) => s.error);
  const statusFilter = useMissionStore((s) => s.statusFilter);
  const setStatusFilter = useMissionStore((s) => s.setStatusFilter);
  const load = useMissionStore((s) => s.load);
  const loadMore = useMissionStore((s) => s.loadMore);
  const loadingMore = useMissionStore((s) => s.loadingMore);
  const total = useMissionStore((s) => s.total);
  const isTransporter = useAuthStore((s) => s.user?.role === 'TRANSPORTER');

  useEffect(() => {
    load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      load({ refreshing: true });
    }, [load])
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title="Mes missions" subtitle={`${total} mission(s)`} />
      <SegmentedControl options={FILTERS} value={statusFilter} onChange={setStatusFilter} />

      {loading && items.length === 0 ? (
        <Loader />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => load({ refreshing: true })} />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          ListFooterComponent={loadingMore ? <ActivityIndicator style={styles.footer} color={colors.primary} /> : null}
          ListHeaderComponent={
            error ? (
              <View style={styles.errorWrap}>
                <ErrorBanner message={error} onRetry={load} />
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <MissionCard
              mission={item}
              counterpartName={
                isTransporter ? item.client?.fullName : item.transporter?.companyName
              }
              onPress={() => navigation.navigate('MissionDetail', { missionId: item.id })}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              icon="clipboard-outline"
              title="Aucune mission"
              message={
                isTransporter
                  ? 'Les demandes envoyees par les clients apparaitront ici.'
                  : "Trouvez un camion sur la carte et envoyez votre premiere demande."
              }
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cardMuted },
  list: { padding: spacing.lg, flexGrow: 1 },
  footer: { paddingVertical: spacing.lg },
  errorWrap: { marginBottom: spacing.sm },
});
