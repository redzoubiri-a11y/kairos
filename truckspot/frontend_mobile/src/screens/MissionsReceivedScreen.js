import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import ScreenHeader from '../components/ScreenHeader';
import MissionCard from '../components/MissionCard';
import SegmentedControl from '../components/SegmentedControl';
import EmptyState from '../components/EmptyState';
import Loader from '../components/Loader';
import ErrorBanner from '../components/ErrorBanner';
import Button from '../components/Button';
import { useMissionStore } from '../store/missionStore';
import { colors, spacing } from '../theme';

const FILTERS = [
  { value: 'PENDING', label: 'A traiter' },
  { value: null, label: 'Toutes' },
  { value: 'ACCEPTED', label: 'Acceptees' },
  { value: 'IN_PROGRESS', label: 'En cours' },
  { value: 'COMPLETED', label: 'Terminees' },
];

export default function MissionsReceivedScreen({ navigation }) {
  const items = useMissionStore((s) => s.items);
  const loading = useMissionStore((s) => s.loading);
  const refreshing = useMissionStore((s) => s.refreshing);
  const error = useMissionStore((s) => s.error);
  const statusFilter = useMissionStore((s) => s.statusFilter);
  const setStatusFilter = useMissionStore((s) => s.setStatusFilter);
  const load = useMissionStore((s) => s.load);
  const updateStatus = useMissionStore((s) => s.updateStatus);

  const [acting, setActing] = useState(null);

  useEffect(() => {
    setStatusFilter('PENDING');
  }, [setStatusFilter]);

  useFocusEffect(
    useCallback(() => {
      load({ refreshing: true });
    }, [load])
  );

  const respond = async (missionId, status) => {
    setActing(`${missionId}:${status}`);
    try {
      await updateStatus(missionId, status);
    } finally {
      setActing(null);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title="Missions recues" subtitle={`${items.length} demande(s)`} />
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
          ListHeaderComponent={error ? <ErrorBanner message={error} onRetry={load} /> : null}
          renderItem={({ item }) => (
            <View>
              <MissionCard
                mission={item}
                counterpartName={item.client?.fullName}
                onPress={() => navigation.navigate('MissionDetail', { missionId: item.id })}
              />
              {item.status === 'PENDING' ? (
                <View style={styles.quickActions}>
                  <Button
                    title="Accepter"
                    variant="success"
                    size="sm"
                    icon="checkmark"
                    loading={acting === `${item.id}:ACCEPTED`}
                    onPress={() => respond(item.id, 'ACCEPTED')}
                    style={styles.quickAction}
                  />
                  <Button
                    title="Refuser"
                    variant="danger"
                    size="sm"
                    icon="close"
                    loading={acting === `${item.id}:REJECTED`}
                    onPress={() => respond(item.id, 'REJECTED')}
                    style={[styles.quickAction, styles.quickActionLast]}
                  />
                </View>
              ) : null}
            </View>
          )}
          ListEmptyComponent={
            <EmptyState
              icon="mail-open-outline"
              title="Aucune demande"
              message="Declarez un trajet pour apparaitre sur la carte des clients."
              actionLabel="Declarer un trajet"
              onAction={() => navigation.navigate('DeclareRoute')}
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
  quickActions: { flexDirection: 'row', marginTop: -spacing.sm, marginBottom: spacing.lg },
  quickAction: { flex: 1, marginRight: spacing.sm },
  quickActionLast: { marginRight: 0 },
});
