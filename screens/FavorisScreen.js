import { useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing } from '../src/theme';
import useFavoris from '../src/hooks/useFavoris';
import FavoriteCard from '../src/components/FavoriteCard';
import EmptyState from '../src/components/EmptyState';
import GuestWall from '../src/components/GuestWall';
import { useGuestContext } from '../src/context/GuestContext';

export default function FavorisScreen({ navigation }) {
  const { isGuest } = useGuestContext();
  const { favorites, loading, refreshing, onRefresh, removeFavorite } = useFavoris();

  const goExplorer = useCallback(() => navigation.navigate('Explorer'), [navigation]);
  const goRestaurant = useCallback(
    (r) => navigation.navigate('Restaurant', { id: r.id, restaurant: r }),
    [navigation],
  );

  if (isGuest) {
    return <GuestWall title="Vos favoris" message="Connectez-vous pour sauvegarder vos restaurants préférés et y accéder depuis n'importe quel appareil." />;
  }

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <Text style={s.title}>Favoris</Text>

      {loading ? (
        <View style={s.loading}><ActivityIndicator color={colors.text} size="large" /></View>
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
          contentContainerStyle={s.grid}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.text} />}
        >
          {favorites.map((fav, i) => {
            const r = fav.restaurants || {};
            return (
              <View key={fav.id} style={[s.gridItem, i % 2 === 0 && s.gridItemLeft]}>
                <FavoriteCard r={r} onPress={() => goRestaurant(r)} onRemove={() => removeFavorite(fav.id)} />
              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },

  title: { textAlign: 'center', fontFamily: typography.display, fontSize: typography.size.heading2, color: colors.text, paddingTop: spacing.sm, paddingBottom: spacing.lg + 6 },

  grid:     { paddingHorizontal: spacing.xxl - 4, paddingBottom: 84, flexDirection: 'row', flexWrap: 'wrap' },
  gridItem: { width: '50%', paddingLeft: spacing.sm - 1, paddingBottom: spacing.lg + 2 },
  gridItemLeft: { paddingLeft: 0, paddingRight: spacing.sm - 1 },

  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyState: { marginHorizontal: 20, marginTop: spacing.section },
});
