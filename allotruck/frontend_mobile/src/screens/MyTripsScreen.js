import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import ScreenHeader from '../components/ScreenHeader';
import TripCard from '../components/TripCard';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import Loader from '../components/Loader';
import ErrorBanner from '../components/ErrorBanner';
import { tripApi } from '../api/endpoints';
import { colors, radii, spacing, typography } from '../theme';

const PAGE_SIZE = 20;

export default function MyTripsScreen({ navigation }) {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const result = await tripApi.list({ mine: 'true', page: 1, limit: PAGE_SIZE });
      setTrips(result.items);
      setPagination({ page: result.page, pages: result.pages, total: result.total });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Sans pagination, un transporteur actif ne voyait que ses premiers trajets.
  const loadMore = useCallback(async () => {
    if (loadingMore || pagination.page >= pagination.pages) return;
    setLoadingMore(true);
    try {
      const result = await tripApi.list({
        mine: 'true',
        page: pagination.page + 1,
        limit: PAGE_SIZE,
      });
      setTrips((current) => {
        const known = new Set(current.map((t) => t.id));
        return [...current, ...result.items.filter((t) => !known.has(t.id))];
      });
      setPagination({ page: result.page, pages: result.pages, total: result.total });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, pagination]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const confirmCancel = (trip) => {
    Alert.alert('Annuler le trajet', `${trip.originCity} → ${trip.destinationCity}`, [
      { text: 'Retour', style: 'cancel' },
      {
        text: 'Annuler le trajet',
        style: 'destructive',
        onPress: async () => {
          try {
            await tripApi.cancel(trip.id);
            await load();
          } catch (err) {
            setError(err.message);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScreenHeader title="Mes trajets" />
        <Loader />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title="Mes trajets" subtitle={`${pagination.total} trajet(s)`} />
      <FlatList
        data={trips}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={error ? <ErrorBanner message={error} onRetry={load} /> : null}
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        ListFooterComponent={
          loadingMore ? <ActivityIndicator style={styles.footer} color={colors.primary} /> : null
        }
        renderItem={({ item }) => (
          <>
            <TripCard trip={item} showStatus />
            {/* La recherche client ecarte les departs passes et les trajets
                epuises. Sans ce rappel, le transporteur croirait son trajet
                toujours propose. */}
            {['SCHEDULED', 'IN_PROGRESS'].includes(item.status) && item.visibleInSearch === false ? (
              <View style={styles.warning}>
                <Ionicons
                  name={item.searchBlockedReason === 'CAPACITY_EXHAUSTED' ? 'cube-outline' : 'time-outline'}
                  size={15}
                  color={colors.warning}
                />
                <Text style={styles.warningText}>
                  {item.searchBlockedReason === 'CAPACITY_EXHAUSTED'
                    ? 'Capacite epuisee : ce trajet n apparait plus dans la recherche des clients. ' +
                      'Il redeviendra visible si une mission liee est annulee, ou en declarant un nouveau trajet.'
                    : 'Heure de depart passee : ce trajet n apparait plus dans la recherche des ' +
                      'clients. Repoussez le depart ou passez le trajet en cours.'}
                </Text>
              </View>
            ) : null}
            {item.status === 'SCHEDULED' ? (
              <Button
                title="Annuler ce trajet"
                variant="ghost"
                size="sm"
                onPress={() => confirmCancel(item)}
                style={styles.cancel}
              />
            ) : null}
          </>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="map-outline"
            title="Aucun trajet declare"
            message="Publiez votre volume libre pour recevoir des missions."
            actionLabel="Declarer un trajet"
            onAction={() => navigation.navigate('DeclareRoute')}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cardMuted },
  list: { padding: spacing.lg, flexGrow: 1 },
  footer: { paddingVertical: spacing.lg },
  cancel: { marginTop: -spacing.sm, marginBottom: spacing.lg },
  warning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: -spacing.sm,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.warningSoft,
  },
  warningText: {
    ...typography.caption,
    color: colors.warning,
    flex: 1,
    marginLeft: spacing.sm,
    lineHeight: 17,
  },
});
