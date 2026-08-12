import { useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius } from '../src/theme';
import useFavoris from '../src/hooks/useFavoris';
import RestaurantCard from '../src/components/RestaurantCard';
import Tag from '../src/components/Tag';
import EmptyState from '../src/components/EmptyState';
import GuestWall from '../src/components/GuestWall';
import { useGuestContext } from '../src/context/GuestContext';

// Chips visibles mais non filtrantes : pas de catégorisation réelle des
// favoris en base (aucune colonne équivalente) — même convention que
// Home/Explorer.
const FAKE_CHIPS = ['Envie de sortir', 'Business'];

export default function FavorisScreen({ navigation }) {
  const { isGuest } = useGuestContext();
  const { favorites, loading, refreshing, removing, removeFavorite, onRefresh } = useFavoris();

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
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipsRow}>
            <Tag variant="filterActive" size="filter">Tous ({favorites.length})</Tag>
            {FAKE_CHIPS.map((label) => (
              <Tag key={label} variant="filterInactive" size="filter">{label}</Tag>
            ))}
          </ScrollView>
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
            const isRemoving = removing.has(fav.id);
            return (
              <View key={fav.id} style={s.cardWrap}>
                <RestaurantCard r={r} variant="compact" onPress={() => goRestaurant(r)} />
                <TouchableOpacity
                  style={s.removeBtn}
                  onPress={() => removeFavorite(fav)}
                  disabled={isRemoving}
                >
                  {isRemoving
                    ? <Text style={s.removingTxt}>···</Text>
                    : <Ionicons name="heart" size={14} color={colors.resa} />
                  }
                </TouchableOpacity>
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

  header: { paddingTop: spacing.xl, paddingHorizontal: 20 },
  title: { fontFamily: typography.display, fontSize: typography.size.heading2 + 6, color: colors.text, letterSpacing: -0.44 },
  chipsRow: { flexDirection: 'row', gap: 6, marginTop: spacing.lg, paddingRight: 20 },

  list: { paddingHorizontal: 20, paddingTop: spacing.xl, paddingBottom: 84, gap: 10 },
  cardWrap: { position: 'relative' },
  removeBtn: {
    position: 'absolute', top: 8, right: 8, width: 26, height: 26, borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.92)', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.cardBorder,
  },
  removingTxt: { color: colors.textDim, fontSize: typography.size.sm },

  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyState: { marginHorizontal: 20, marginTop: spacing.section },
});
