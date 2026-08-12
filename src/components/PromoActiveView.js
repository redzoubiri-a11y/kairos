import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { colors, typography, spacing, radius } from '../theme';

export default function PromoActiveView({ promo, onViewAll, onCreate }) {
  const recap = [
    ['Type',    promo?.title || '—'],
    ['Créneau', promo?.time_start && promo?.time_end ? `${promo.time_start} – ${promo.time_end}` : '—'],
    ['Limite',  promo?.max_uses_per_day ? `${promo.max_uses_per_day} utilisations / soir` : 'Illimité'],
    ['Statut',  '● Active'],
  ];
  return (
    <ScrollView contentContainerStyle={s.wrap}>
      <View style={s.iconWrap}>
        <Text style={{ fontSize: 36 }}>🎁</Text>
      </View>
      <Text style={s.title}>Promotion activée !</Text>
      <Text style={s.sub}>
        Ta promo est maintenant visible par tous les clients sur ta fiche Mida.
      </Text>
      <View style={s.recapCard}>
        {recap.map(([k, v], i) => (
          <View key={k} style={[s.recapRow, i < recap.length - 1 && s.recapSep]}>
            <Text style={s.recapKey}>{k}</Text>
            <Text style={[s.recapVal, k === 'Statut' && { color: colors.green }]}>{v}</Text>
          </View>
        ))}
      </View>
      <TouchableOpacity style={s.activateBtn} onPress={onViewAll}>
        <Text style={s.activateBtnTxt}>Voir toutes mes promos</Text>
      </TouchableOpacity>
      <TouchableOpacity style={s.ghostBtn} onPress={onCreate}>
        <Text style={s.ghostBtnTxt}>Créer une autre promo</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap:          { alignItems: 'center', padding: spacing.xxl, gap: spacing.xl },
  iconWrap:      { width: 70, height: 70, borderRadius: 35, backgroundColor: colors.goldSoft, borderWidth: 2, borderColor: 'rgba(200,151,90,0.4)', alignItems: 'center', justifyContent: 'center' },
  title:         { color: colors.text, fontSize: typography.size.title, fontWeight: typography.weight.black },
  sub:           { color: colors.textMuted, fontSize: typography.size.body, textAlign: 'center', lineHeight: 20, maxWidth: 220 },
  recapCard:     { backgroundColor: colors.card, borderRadius: radius.xl, padding: spacing.xl, borderWidth: 1, borderColor: 'rgba(232,160,69,0.3)', width: '100%' },
  recapRow:      { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.md },
  recapSep:      { borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  recapKey:      { color: colors.textMuted, fontSize: typography.size.body },
  recapVal:      { color: colors.text, fontSize: typography.size.body, fontWeight: typography.weight.medium },
  activateBtn:   { backgroundColor: colors.noir, borderRadius: radius.xl, padding: spacing.xl, alignItems: 'center', width: '100%', shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 14, shadowOffset: { width: 0, height: 0 }, elevation: 7 },
  activateBtnTxt:{ color: '#FFFFFF', fontSize: typography.size.subheading, fontWeight: typography.weight.extrabold },
  ghostBtn:      { backgroundColor: 'transparent', borderRadius: radius.xl, padding: spacing.xl, alignItems: 'center', borderWidth: 1.5, borderColor: colors.primary, marginTop: spacing.sm, width: '100%', shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 0 }, elevation: 3 },
  ghostBtnTxt:   { color: colors.primary, fontSize: typography.size.subheading, fontWeight: typography.weight.bold },
});
