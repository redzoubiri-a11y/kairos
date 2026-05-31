import { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { colors, typography, spacing, radius } from '../theme';

export default function RestaurantMenuTab({ menu }) {
  const cats    = useMemo(() => menu.map(c => c.cat), [menu]);
  const [active, setActive] = useState(cats[0]);
  const catData = useMemo(() => menu.find(c => c.cat === active), [menu, active]);

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
            <View style={s.rowLeft}>
              <View style={s.nomRow}>
                <Text style={s.nom}>{item.nom}</Text>
                {item.popular && (
                  <View style={s.popularBadge}>
                    <Text style={s.popularTxt}>★ Populaire</Text>
                  </View>
                )}
              </View>
              <Text style={s.desc}>{item.desc}</Text>
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
  pillOn:      { backgroundColor: colors.accentSoft, borderColor: colors.accent },
  pillTxt:     { color: colors.textMuted, fontSize: typography.size.bodyLg, fontWeight: typography.weight.regular },
  pillTxtOn:   { color: colors.accent, fontWeight: typography.weight.regular },
  pillDot:     { position: 'absolute', bottom: -1, left: '50%', width: 4, height: 4, borderRadius: 2, backgroundColor: colors.accent, marginLeft: -2 },
  items:       { marginHorizontal: spacing.xl, backgroundColor: colors.card, borderRadius: radius.xxl, borderWidth: 1, borderColor: colors.cardBorder, overflow: 'hidden' },
  row:         { flexDirection: 'row', alignItems: 'center', gap: spacing.xl - 2, paddingHorizontal: spacing.xl + 2, paddingVertical: spacing.xl },
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
});
