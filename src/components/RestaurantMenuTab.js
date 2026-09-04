import { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { colors, typography, spacing, radius } from '../theme';

export default function RestaurantMenuTab({ menu }) {
  const cats    = useMemo(() => menu.map(c => c.cat), [menu]);
  const [active, setActive] = useState(cats[0]);
  const catData = useMemo(() => menu.find(c => c.cat === active), [menu, active]);

  if (menu.length === 0) {
    return (
      <View style={s.empty}>
        <Text style={s.emptyEmoji}>🍽️</Text>
        <Text style={s.emptyTxt}>Menu non disponible</Text>
        <Text style={s.emptySub}>Le restaurant n'a pas encore renseigné son menu</Text>
      </View>
    );
  }

  return (
    <View style={s.wrap}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.catTabs}>
        {cats.map(cat => (
          <TouchableOpacity key={cat} style={[s.catTab, active === cat && s.catTabOn]} onPress={() => setActive(cat)}>
            <Text style={[s.catTabTxt, active === cat && s.catTabTxtOn]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {catData?.items.map((item, i) => (
        <View key={i} style={[s.dishRow, i < catData.items.length - 1 && s.dishRowBorder]}>
          {item.photo ? (
            <Image source={{ uri: item.photo }} style={s.dPhoto} resizeMode="cover" />
          ) : (
            <View style={[s.dPhoto, s.dPhotoPlaceholder]} />
          )}
          <View style={{ flex: 1 }}>
            <View style={s.dNameRow}>
              <Text style={s.dName} numberOfLines={1}>{item.nom}</Text>
              {item.popular && <Text style={s.popularTag}>★ Populaire</Text>}
            </View>
            {!!item.desc && <Text style={s.dDesc} numberOfLines={2}>{item.desc}</Text>}
            {item.prix > 0 && <Text style={s.dPrice}>{item.prix.toLocaleString('fr-FR')} DA</Text>}
          </View>
        </View>
      ))}

      <View style={{ height: 20 }} />
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { paddingHorizontal: spacing.xl },

  catTabs:   { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg + 2 },
  catTab:    { paddingHorizontal: spacing.lg + 2, paddingVertical: spacing.sm + 1, borderRadius: radius.pill, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.cardBorder },
  catTabOn:  { backgroundColor: colors.noir, borderColor: colors.noir },
  catTabTxt: { fontFamily: typography.bodyBold, fontSize: typography.size.caption + 0.5, color: colors.textMuted },
  catTabTxtOn: { color: colors.card },

  dishRow:      { flexDirection: 'row', gap: spacing.lg, paddingVertical: spacing.lg + 2 },
  dishRowBorder:{ borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  dPhoto:       { width: 58, height: 58, borderRadius: radius.md + 1, flexShrink: 0 },
  dPhotoPlaceholder: { backgroundColor: colors.photoFallbackGradient[0] },
  dNameRow:     { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  dName:        { fontFamily: typography.display, fontSize: typography.size.body + 1, color: colors.text },
  popularTag:   { fontFamily: typography.bodySemibold, fontSize: typography.size.xs, color: colors.gold },
  dDesc:        { fontFamily: typography.body, fontSize: typography.size.caption - 0.5, color: colors.textDim, marginTop: 3 },
  dPrice:       { fontFamily: typography.display, fontSize: typography.size.caption + 1, color: colors.text, marginTop: spacing.sm - 1 },

  empty:     { alignItems: 'center', paddingVertical: 56, gap: spacing.md },
  emptyEmoji:{ fontSize: 36 },
  emptyTxt:  { fontFamily: typography.body, color: colors.textMuted, fontSize: typography.size.subheading },
  emptySub:  { fontFamily: typography.body, color: colors.textDim, fontSize: typography.size.body, textAlign: 'center', paddingHorizontal: spacing.xl },
});
