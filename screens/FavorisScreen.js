import { useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing } from '../src/theme';
import useFavoris from '../src/hooks/useFavoris';
import RestaurantCard from '../src/components/RestaurantCard';
import EmptyState from '../src/components/EmptyState';
import GuestWall from '../src/components/GuestWall';
import { useGuestContext } from '../src/context/GuestContext';

export default function FavorisScreen({ navigation }) {
  const { isGuest } = useGuestContext();
  const { favorites, loading, refreshing, onRefresh } = useFavoris();

  const goExplorer = useCallback(() => navigation.navigate('Explorer'), [navigation]);
  const goRestaurant = useCallback(
    (r) => navigation.navigate('Restaurant', { restaurant: r }),
    [navigation],
  );

  if (isGuest) {
    return <GuestWall title="Vos favoris" message="Connectez-vous pour sauvegarder vos restaurants préférés et y accéder depuis n'importe quel appareil." />;
  }

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <View style={s.header}>
        <Text style={s.title}>Favoris</Text>
        {!loading && favorites.length > 0 && (
          <Text style={s.subtitle}>Mes préférés</Text>
        )}
      </View>

      {loading ? (
        <View style={s.loading}><ActivityIndicator color={colors.primary} size="large" /></View>
      ) : favorites.length === 0 ? (
        <EmptyState
          icon={<Text style={{ fontSize: 20 }}>🤍</Text>}
          title="Aucun favori"
          subtitle={"Appuyez sur ❤️ sur la page d'un restaurant\npour l'ajouter ici."}
          actionLabel="Explorer les restaurants"
          onAction={goExplorer}
          style={s.emptyState}
        />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        >
          {favorites.map((fav) => {
            const r = fav.restaurants || {};
            return (
              <RestaurantCard key={fav.id} r={r} variant="compact" onPress={() => goRestaurant(r)} />
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },

  header: { paddingTop: spacing.xl, paddingHorizontal: 20 },
  title: { fontFamily: typography.display, fontSize: typography.size.heading2 + 6, color: colors.text, letterSpacing: -0.44 },
  subtitle: { fontFamily: typography.body, fontSize: typography.size.body, color: colors.textMuted, marginTop: spacing.xs },

  list: { paddingHorizontal: 20, paddingTop: spacing.xl, paddingBottom: 84, gap: 10 },

  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyState: { marginHorizontal: 20, marginTop: spacing.section },
});
