import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
} from 'react-native';
import { colors, typography, spacing, radius } from '../theme';
import { PROMO_TYPES, PERCENTS } from '../hooks/useProPromos';

function parseDateFR(str) {
  const m = (str || '').trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const [, d, mo, y] = m;
  return `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

function fmtDateFR(iso) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export default function PromoCreateView({ onActivate, onBack, saving }) {
  const [type,      setType]      = useState('percent');
  const [percent,   setPercent]   = useState('20%');
  const [maxUses,   setMaxUses]   = useState('20');
  const [startStr,  setStartStr]  = useState('');
  const [endStr,    setEndStr]    = useState('');
  const [dateError, setDateError] = useState('');

  const label = type === 'percent' ? `−${percent} sur l'addition`
              : type === 'fixed'   ? '−500 DA offerts'
              : type === 'free'    ? 'Dessert offert'
              : '2 plats achetés = 1 offert';

  const handleActivate = () => {
    const startDate = startStr ? parseDateFR(startStr) : null;
    const endDate   = endStr   ? parseDateFR(endStr)   : null;
    if ((startStr && !startDate) || (endStr && !endDate)) {
      setDateError('Format de date invalide (JJ/MM/AAAA)');
      return;
    }
    setDateError('');

    const periodTxt = [
      startDate ? `À partir du ${fmtDateFR(startDate)}` : null,
      endDate   ? `Jusqu'au ${fmtDateFR(endDate)}`       : null,
    ].filter(Boolean).join(' · ') || null;
    const description = ['Lun–Ven, 18h00–21h00', periodTxt].filter(Boolean).join(' · ');

    onActivate({
      type,
      title: label,
      description,
      percent_value: type === 'percent' ? Number(percent.replace('%', '')) : null,
      time_start: '18:00',
      time_end: '21:00',
      max_uses_per_day: maxUses ? Number(maxUses) : null,
      start_date: startDate,
      end_date: endDate,
    });
  };

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
                <Text style={[s.typeIcon, type === t.id && { color: colors.primary }]}>{t.icon}</Text>
                <Text style={[s.typeLabel, type === t.id && { color: colors.primary }]}>{t.label}</Text>
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

        <View style={s.dateRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.fieldLabel}>Date de début</Text>
            <View style={s.inputBox}>
              <TextInput
                style={s.inputVal}
                value={startStr}
                onChangeText={setStartStr}
                placeholder="JJ/MM/AAAA"
                placeholderTextColor={colors.textDim}
                keyboardType="numeric"
              />
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.fieldLabel}>Date de fin</Text>
            <View style={s.inputBox}>
              <TextInput
                style={s.inputVal}
                value={endStr}
                onChangeText={setEndStr}
                placeholder="JJ/MM/AAAA"
                placeholderTextColor={colors.textDim}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>
        <Text style={s.hint}>Vides = démarre immédiatement, sans date de fin</Text>
        {!!dateError && <Text style={s.errorTxt}>{dateError}</Text>}

        <View style={s.preview}>
          <Text style={s.previewLabel}>👁 Aperçu client</Text>
          <Text style={s.previewTitle}>{label}</Text>
          <Text style={s.previewSub}>Lun–Ven · 18h00–21h00 · Max {maxUses || '∞'}/soir</Text>
        </View>

        <TouchableOpacity style={[s.activateBtn, saving && { opacity: 0.6 }]} onPress={handleActivate} disabled={saving}>
          <Text style={s.activateBtnTxt}>{saving ? '···' : 'Activer la promotion →'}</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  fieldLabel:    { color: colors.textMuted, fontFamily: typography.bodySemibold, fontSize: typography.size.xs, fontWeight: typography.weight.semibold, letterSpacing: 2, textTransform: 'uppercase', marginBottom: spacing.md },
  typeGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  typeCard:      { width: '47%', backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg, alignItems: 'center', borderWidth: 1.5, borderColor: colors.cardBorder },
  typeCardOn:    { backgroundColor: colors.primaryDim, borderColor: colors.primary, shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 0 }, elevation: 5 },
  typeIcon:      { fontFamily: typography.display, fontSize: typography.size.heading1, fontWeight: typography.weight.black, color: colors.textMuted, marginBottom: spacing.xs },
  typeLabel:     { color: colors.text, fontFamily: typography.bodyBold, fontSize: typography.size.caption, fontWeight: typography.weight.bold, textAlign: 'center' },
  typeDesc:      { color: colors.textDim, fontFamily: typography.body, fontSize: typography.size.xs, marginTop: spacing.xs, textAlign: 'center' },
  percentRow:    { flexDirection: 'row', gap: spacing.sm },
  percentPill:   { flex: 1, paddingVertical: spacing.md, borderRadius: radius.md, alignItems: 'center', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder },
  percentPillOn: { backgroundColor: colors.noir, borderColor: colors.noir, shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 8, shadowOffset: { width: 0, height: 0 }, elevation: 4 },
  percentTxt:    { color: colors.textMuted, fontFamily: typography.body, fontSize: typography.size.caption },
  percentTxtOn:  { color: colors.bg, fontFamily: typography.bodyBold, fontWeight: typography.weight.extrabold },
  inputBox:      { backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.cardBorder, paddingHorizontal: spacing.xl, paddingVertical: spacing.lg },
  inputVal:      { color: colors.text, fontFamily: typography.body, fontSize: typography.size.subheading },
  hint:          { color: colors.textDim, fontFamily: typography.body, fontSize: typography.size.xs, marginTop: spacing.xs },
  dateRow:       { flexDirection: 'row', gap: spacing.md },
  errorTxt:      { color: colors.red, fontFamily: typography.body, fontSize: typography.size.caption, marginTop: spacing.xs },
  slotRow:       { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  slotBox:       { flex: 1, backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.cardBorder, padding: spacing.lg, alignItems: 'center' },
  slotTxt:       { color: colors.text, fontFamily: typography.body, fontSize: typography.size.subheading },
  slotArrow:     { color: colors.textDim, fontFamily: typography.body, fontSize: typography.size.subheading },
  preview:       { backgroundColor: colors.primarySoft, borderRadius: radius.xl, padding: spacing.lg, borderWidth: 1, borderColor: colors.primarySoft },
  previewLabel:  { color: colors.primary, fontFamily: typography.bodyBold, fontSize: typography.size.caption, marginBottom: spacing.xs },
  previewTitle:  { color: colors.text, fontFamily: typography.bodyBold, fontSize: typography.size.subheading, fontWeight: typography.weight.extrabold },
  previewSub:    { color: colors.textMuted, fontFamily: typography.body, fontSize: typography.size.caption, marginTop: 3 },
  activateBtn:   { backgroundColor: colors.noir, borderRadius: radius.xl, padding: spacing.xl, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 14, shadowOffset: { width: 0, height: 0 }, elevation: 7 },
  activateBtnTxt:{ color: colors.card, fontFamily: typography.bodyBold, fontSize: typography.size.subheading, fontWeight: typography.weight.extrabold },
});
