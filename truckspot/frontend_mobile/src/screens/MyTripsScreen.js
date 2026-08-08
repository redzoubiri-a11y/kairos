import React, { useCallback, useState } from 'react';
import { Alert, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import ScreenHeader from '../components/ScreenHeader';
import TripCard from '../components/TripCard';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import Loader from '../components/Loader';
import ErrorBanner from '../components/ErrorBanner';
import { tripApi } from '../api/endpoints';
import { colors, spacing } from '../theme';

export default function MyTripsScreen({ navigation }) {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const { items } = await tripApi.list({ mine: 'true', limit: 50 });
      setTrips(items);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

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
      <ScreenHeader title="Mes trajets" subtitle={`${trips.length} trajet(s)`} />
      <FlatList
        data={trips}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={error ? <ErrorBanner message={error} onRetry={load} /> : null}
        renderItem={({ item }) => (
          <>
            <TripCard trip={item} showStatus />
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
  cancel: { marginTop: -spacing.sm, marginBottom: spacing.lg },
});
