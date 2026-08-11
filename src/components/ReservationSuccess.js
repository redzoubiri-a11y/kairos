import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { colors, typography, spacing, radius } from '../theme';

export default function ReservationSuccess({ restaurant, date, heure, adults, onGoHome, onReset }) {
  return (
    <ScrollView contentContainerStyle={s.wrap} showsVerticalScrollIndicator={false}>
      <View style={s.ring}>
        <Text style={s.check}>✓</Text>
      </View>

      <Text style={s.title}>Demande envoyée !</Text>
      <Text style={s.sub}>
        {restaurant?.name}{'\n'}{date} · {heure}{'\n'}{adults} pers.
      </Text>

      <View style={s.statusRow}>
        <View style={s.dot} />
        <Text style={s.statusTxt}>En attente de confirmation</Text>
      </View>

      <TouchableOpacity style={s.btnPrimary} onPress={onGoHome}>
        <Text style={s.btnPrimaryTxt}>RETOUR À L'ACCUEIL</Text>
      </TouchableOpacity>
      <TouchableOpacity style={s.btnOutline} onPress={onReset}>
        <Text style={s.btnOutlineTxt}>Faire une autre réservation</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap:         { alignItems: 'center', padding: spacing.xxl, paddingTop: 60, gap: spacing.xl },
  ring:         { width: 90, height: 90, borderRadius: 45, backgroundColor: colors.greenSoft, borderWidth: 2, borderColor: colors.green, alignItems: 'center', justifyContent: 'center' },
  check:        { color: colors.green, fontSize: 36 },
  title:        { color: colors.text, fontFamily: typography.display, fontSize: 26, fontWeight: typography.weight.bold, textAlign: 'center' },
  sub:          { color: colors.textMuted, fontSize: typography.size.bodyLg, textAlign: 'center', lineHeight: 22 },
  statusRow:    { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.cardBorder, width: '100%' },
  dot:          { width: 7, height: 7, borderRadius: 3.5, backgroundColor: colors.gold },
  statusTxt:    { color: colors.textMuted, fontSize: typography.size.body, flex: 1 },
  btnPrimary:   { width: '100%', borderRadius: radius.xxl, paddingVertical: 15, alignItems: 'center', overflow: 'hidden', justifyContent: 'center', backgroundColor: colors.primary },
  btnPrimaryTxt:{ color: '#FFFFFF', fontSize: typography.size.bodyLg, fontWeight: typography.weight.bold, letterSpacing: 0.5 },
  btnOutline:   { width: '100%', borderRadius: radius.xxl, paddingVertical: 15, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(200,151,90,0.3)', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 0 }, elevation: 3 },
  btnOutlineTxt:{ color: colors.textMuted, fontSize: typography.size.bodyLg },
});
