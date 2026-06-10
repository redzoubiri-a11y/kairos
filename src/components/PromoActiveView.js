import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { colors, typography, spacing, radius } from '../theme';

const RECAP = [
  ['Type',    "−20% sur l'addition"],
  ['Créneau', '18h00 – 21h00'],
  ['Jours',   'Lun–Ven'],
  ['Limite',  '20 utilisations / soir'],
  ['Statut',  '● Active'],
];

export default function PromoActiveView({ onViewAll, onCreate }) {
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
        {RECAP.map(([k, v], i) => (
          <View key={k} style={[s.recapRow, i < RECAP.length - 1 && s.recapSep]}>
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
  iconWrap:      { width: 70, height: 70, borderRadius: 0, backgroundColor: colors.accentSoft, borderWidth: 2, borderColor: 'rgba(232,160,69,0.4)', alignItems: 'center', justifyContent: 'center' },
  title:         { color: colors.text, fontSize: typography.size.title, fontWeight: typography.weight.black },
  sub:           { color: colors.textMuted, fontSize: typography.size.body, textAlign: 'center', lineHeight: 20, maxWidth: 220 },
  recapCard:     { backgroundColor: colors.card, borderRadius: radius.xl, padding: spacing.xl, borderWidth: 1, borderColor: 'rgba(232,160,69,0.3)', width: '100%' },
  recapRow:      { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.md },
  recapSep:      { borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  recapKey:      { color: colors.textMuted, fontSize: typography.size.body },
  recapVal:      { color: colors.text, fontSize: typography.size.body, fontWeight: typography.weight.medium },
  activateBtn:   { backgroundColor: '#c8975a', borderRadius: radius.xl, padding: spacing.xl, alignItems: 'center', width: '100%', shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 14, shadowOffset: { width: 0, height: 0 }, elevation: 7 },
  activateBtnTxt:{ color: colors.bg, fontSize: typography.size.subheading, fontWeight: typography.weight.extrabold },
  ghostBtn:      { backgroundColor: 'transparent', borderRadius: radius.xl, padding: spacing.xl, alignItems: 'center', borderWidth: 1.5, borderColor: '#c8975a', marginTop: spacing.sm, width: '100%', shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 0 }, elevation: 3 },
  ghostBtnTxt:   { color: colors.accent, fontSize: typography.size.subheading, fontWeight: typography.weight.bold },
});
