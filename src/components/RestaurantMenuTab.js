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
    <>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.pillRow}>
        {cats.map(cat => (
          <TouchableOpacity key={cat} style={[s.pill, active === cat && s.pillOn]} onPress={() => setActive(cat)}>
            <Text style={[s.pillTxt, active === cat && s.pillTxtOn]}>{cat}</Text>
            {active === cat && <View style={s.pillDot} />}
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={s.items}>
        {catData?.items.map((item, i) => (
          <View key={i} style={[s.row, i < catData.items.length - 1 && s.rowBorder]}>
            {item.photo ? (
              <Image source={{ uri: item.photo }} style={s.dishPhoto} resizeMode="cover" />
            ) : null}
            <View style={s.rowLeft}>
              <View style={s.nomRow}>
                <Text style={s.nom}>{item.nom}</Text>
                {item.popular && (
                  <View style={s.popularBadge}>
                    <Text style={s.popularTxt}>★ Populaire</Text>
                  </View>
                )}
              </View>
              {!!item.desc && <Text style={s.desc}>{item.desc}</Text>}
            </View>
            <View style={s.priceBox}>
              <Text style={s.price}>{item.prix.toLocaleString('fr-FR')}</Text>
              <Text style={s.priceUnit}>DA</Text>
            </View>
          </View>
        ))}
      </View>
      <View style={{ height: 40 }} />
    </>
  );
}

const s = StyleSheet.create({
  pillRow:     { paddingHorizontal: spacing.xl, paddingVertical: spacing.xl, gap: spacing.md },
  pill:        { paddingHorizontal: spacing.xl + 2, paddingVertical: spacing.md + 1, borderRadius: radius.full, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, position: 'relative' },
  pillOn:      { backgroundColor: 'rgba(200,151,90,0.14)', borderColor: '#c8975a', shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 8, shadowOffset: { width: 0, height: 0 }, elevation: 4 },
  pillTxt:     { color: colors.textMuted, fontSize: typography.size.bodyLg, fontWeight: typography.weight.regular },
  pillTxtOn:   { color: colors.accent, fontWeight: typography.weight.regular },
  pillDot:     { position: 'absolute', bottom: -1, left: '50%', width: 4, height: 4, borderRadius: 0, backgroundColor: colors.accent, marginLeft: -2 },
  items:       { marginHorizontal: spacing.xl, backgroundColor: colors.card, borderRadius: radius.xxl, borderWidth: 1, borderColor: colors.cardBorder, overflow: 'hidden' },
  row:         { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, paddingHorizontal: spacing.xl + 2, paddingVertical: spacing.lg },
  dishPhoto:   { width: 64, height: 64, borderRadius: radius.lg, backgroundColor: colors.card, flexShrink: 0 },
  rowBorder:   { borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  rowLeft:     { flex: 1, gap: spacing.xs + 1 },
  nomRow:      { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.sm + 1 },
  nom:         { color: colors.text, fontSize: typography.size.subheading, fontWeight: typography.weight.regular },
  popularBadge:{ backgroundColor: colors.accentSoft, borderRadius: radius.sm, paddingHorizontal: spacing.md - 2, paddingVertical: spacing.xxs, borderWidth: 1, borderColor: 'rgba(232,160,69,0.25)' },
  popularTxt:  { color: colors.accent, fontSize: typography.size.xs, fontWeight: typography.weight.medium },
  desc:        { color: colors.textMuted, fontSize: typography.size.caption, lineHeight: 16 },
  priceBox:    { alignItems: 'flex-end', minWidth: 55 },
  price:       { color: colors.accent, fontSize: typography.size.heading3, fontWeight: typography.weight.regular },
  priceUnit:   { color: colors.textDim, fontSize: typography.size.xs, marginTop: 1 },
  empty:     { alignItems: 'center', paddingVertical: 56, gap: spacing.md },
  emptyEmoji:{ fontSize: 36 },
  emptyTxt:  { color: colors.textMuted, fontSize: typography.size.subheading, fontWeight: typography.weight.regular },
  emptySub:  { color: colors.textDim, fontSize: typography.size.body, textAlign: 'center', paddingHorizontal: spacing.xl },
});
