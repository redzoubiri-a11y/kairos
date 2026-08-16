import { View, Text, StyleSheet, Image } from 'react-native';
import { colors, typography, spacing, radius } from '../theme';

// Écart déclaré vs. Fiche restaurant - Photos.dc.html : la maquette prévoit des
// onglets de catégorie (Toutes/Plats/Salle/Terrasse), mais aucune donnée de
// catégorie par photo n'existe en base (restaurants.photos est un simple
// tableau d'URLs) — grille unique "Toutes" affichée, sans filtre.
export default function RestaurantPhotosTab({ photos }) {
  const list = photos || [];

  if (list.length === 0) {
    return (
      <View style={s.empty}>
        <Text style={s.emptyEmoji}>📷</Text>
        <Text style={s.emptyTxt}>Aucune photo</Text>
        <Text style={s.emptySub}>Le restaurant n'a pas encore ajouté de photos</Text>
      </View>
    );
  }

  return (
    <View style={s.wrap}>
      <Text style={s.count}>Toutes ({list.length})</Text>
      <View style={s.grid}>
        {list.map((uri, i) => (
          <Image key={i} source={{ uri }} style={s.tile} resizeMode="cover" />
        ))}
      </View>
      <View style={{ height: 20 }} />
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { paddingHorizontal: spacing.xl },
  count: { fontFamily: typography.bodyBold, fontSize: typography.size.caption + 0.5, color: colors.textMuted, marginTop: spacing.lg + 2, marginBottom: spacing.sm },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  tile: { width: '32.6%', aspectRatio: 1, borderRadius: radius.sm },

  empty:     { alignItems: 'center', paddingVertical: 56, gap: spacing.md },
  emptyEmoji:{ fontSize: 36 },
  emptyTxt:  { fontFamily: typography.body, color: colors.textMuted, fontSize: typography.size.subheading },
  emptySub:  { fontFamily: typography.body, color: colors.textDim, fontSize: typography.size.body, textAlign: 'center', paddingHorizontal: spacing.xl },
});
