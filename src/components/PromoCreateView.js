import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
} from 'react-native';
import { colors, typography, spacing, radius } from '../theme';
import { PROMO_TYPES, PERCENTS } from '../hooks/useProPromos';

export default function PromoCreateView({ onActivate, onBack }) {
  const [type,    setType]    = useState('percent');
  const [percent, setPercent] = useState('20%');
  const [maxUses, setMaxUses] = useState('20');

  const label = type === 'percent' ? `−${percent} sur l'addition`
              : type === 'fixed'   ? '−500 DA offerts'
              : type === 'free'    ? 'Dessert offert'
              : '2 plats achetés = 1 offert';

  return (
    <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <View style={{ padding: spacing.xl, gap: spacing.xl }}>

        <View>
          <Text style={s.fieldLabel}>Type de promotion</Text>
          <View style={s.typeGrid}>
            {PROMO_TYPES.map(t => (
              <TouchableOpacity
                key={t.id}
                style={[s.typeCard, type === t.id && s.typeCardOn]}
                onPress={() => setType(t.id)}
              >
                <Text style={[s.typeIcon, type === t.id && { color: colors.accent }]}>{t.icon}</Text>
                <Text style={[s.typeLabel, type === t.id && { color: colors.accent }]}>{t.label}</Text>
                <Text style={s.typeDesc}>{t.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {type === 'percent' && (
          <View>
            <Text style={s.fieldLabel}>Pourcentage de réduction</Text>
            <View style={s.percentRow}>
              {PERCENTS.map(p => (
                <TouchableOpacity
                  key={p}
                  style={[s.percentPill, percent === p && s.percentPillOn]}
                  onPress={() => setPercent(p)}
                >
                  <Text style={[s.percentTxt, percent === p && s.percentTxtOn]}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <View>
          <Text style={s.fieldLabel}>📅 Période</Text>
          <View style={s.inputBox}>
            <Text style={s.inputVal}>Lundi – Vendredi</Text>
          </View>
        </View>

        <View>
          <Text style={s.fieldLabel}>Créneau horaire</Text>
          <View style={s.slotRow}>
            <View style={s.slotBox}><Text style={s.slotTxt}>18h00</Text></View>
            <Text style={s.slotArrow}>→</Text>
            <View style={s.slotBox}><Text style={s.slotTxt}>21h00</Text></View>
          </View>
        </View>

        <View>
          <Text style={s.fieldLabel}>🔢 Nombre max d'utilisations / soir</Text>
          <View style={[s.inputBox, { flexDirection: 'row', alignItems: 'center' }]}>
            <TextInput
              style={[s.inputVal, { flex: 1 }]}
              value={maxUses}
              onChangeText={setMaxUses}
              keyboardType="numeric"
              placeholder="Illimité si vide"
              placeholderTextColor={colors.textDim}
            />
          </View>
          <Text style={s.hint}>Laisse vide pour ne pas limiter</Text>
        </View>

        <View style={s.preview}>
          <Text style={s.previewLabel}>👁 Aperçu client</Text>
          <Text style={s.previewTitle}>{label}</Text>
          <Text style={s.previewSub}>Lun–Ven · 18h00–21h00 · Max {maxUses || '∞'}/soir</Text>
        </View>

        <TouchableOpacity style={s.activateBtn} onPress={onActivate}>
          <Text style={s.activateBtnTxt}>Activer la promotion →</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  fieldLabel:    { color: colors.textMuted, fontSize: typography.size.xs, fontWeight: typography.weight.semibold, letterSpacing: 2, textTransform: 'uppercase', marginBottom: spacing.md },
  typeGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  typeCard:      { width: '47%', backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg, alignItems: 'center', borderWidth: 1.5, borderColor: colors.cardBorder },
  typeCardOn:    { backgroundColor: 'rgba(200,151,90,0.14)', borderColor: '#c8975a', shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 0 }, elevation: 5 },
  typeIcon:      { fontSize: typography.size.heading1, fontWeight: typography.weight.black, color: colors.textMuted, marginBottom: spacing.xs },
  typeLabel:     { color: colors.text, fontSize: typography.size.caption, fontWeight: typography.weight.bold, textAlign: 'center' },
  typeDesc:      { color: colors.textDim, fontSize: typography.size.xs, marginTop: spacing.xs, textAlign: 'center' },
  percentRow:    { flexDirection: 'row', gap: spacing.sm },
  percentPill:   { flex: 1, paddingVertical: spacing.md, borderRadius: radius.md, alignItems: 'center', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder },
  percentPillOn: { backgroundColor: '#c8975a', borderColor: '#c8975a', shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 8, shadowOffset: { width: 0, height: 0 }, elevation: 4 },
  percentTxt:    { color: colors.textMuted, fontSize: typography.size.caption },
  percentTxtOn:  { color: colors.bg, fontWeight: typography.weight.extrabold },
  inputBox:      { backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.cardBorder, paddingHorizontal: spacing.xl, paddingVertical: spacing.lg },
  inputVal:      { color: colors.text, fontSize: typography.size.subheading },
  hint:          { color: colors.textDim, fontSize: typography.size.xs, marginTop: spacing.xs },
  slotRow:       { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  slotBox:       { flex: 1, backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.cardBorder, padding: spacing.lg, alignItems: 'center' },
  slotTxt:       { color: colors.text, fontSize: typography.size.subheading },
  slotArrow:     { color: colors.textDim, fontSize: typography.size.subheading },
  preview:       { backgroundColor: colors.accentSoft, borderRadius: radius.xl, padding: spacing.lg, borderWidth: 1, borderColor: 'rgba(232,160,69,0.2)' },
  previewLabel:  { color: colors.accent, fontSize: typography.size.caption, fontWeight: typography.weight.bold, marginBottom: spacing.xs },
  previewTitle:  { color: colors.text, fontSize: typography.size.subheading, fontWeight: typography.weight.extrabold },
  previewSub:    { color: colors.textMuted, fontSize: typography.size.caption, marginTop: 3 },
  activateBtn:   { backgroundColor: '#c8975a', borderRadius: radius.xl, padding: spacing.xl, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 14, shadowOffset: { width: 0, height: 0 }, elevation: 7 },
  activateBtnTxt:{ color: colors.bg, fontSize: typography.size.subheading, fontWeight: typography.weight.extrabold },
});
