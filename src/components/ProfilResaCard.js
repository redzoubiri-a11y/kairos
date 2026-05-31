import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, typography, spacing, radius } from '../theme';
import { STATUS, CUISINE_EMOJI, fmtDate } from '../hooks/useProfil';

function todayStr() { return new Date().toISOString().split('T')[0]; }

export default function ProfilResaCard({ r, cancelling, onCancel, onReserveAgain }) {
  const resto = r.restaurants || {};
  const st = STATUS[r.status] || { label: r.status, color: colors.textDim };
  const isCancelling = cancelling.has(r.id);
  const isPast = r.date < todayStr() || ['cancelled','completed','no_show','arrived'].includes(r.status);

  return (
    <View style={[s.card, { borderLeftColor: st.color }]}>
      <View style={s.top}>
        <View style={s.iconWrap}>
          <Text style={s.icon}>{CUISINE_EMOJI[resto.cuisine_type] || '🍽️'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.name} numberOfLines={1}>{resto.name || '—'}</Text>
          {!!resto.quartier && <Text style={s.quartier}>{resto.quartier}</Text>}
          <View style={s.meta}>
            <Text style={s.metaTxt}>📅 {fmtDate(r.date)}</Text>
            <Text style={s.sep}>·</Text>
            <Text style={s.metaTxt}>🕐 {r.time_slot?.slice(0,5)}</Text>
            <Text style={s.sep}>·</Text>
            <Text style={s.metaTxt}>👥 {(r.nb_adults||0)+(r.nb_children||0)}</Text>
          </View>
        </View>
        <View style={[s.badge, { borderColor: st.color+'55', backgroundColor: st.color+'15' }]}>
          <Text style={[s.badgeTxt, { color: st.color }]}>{st.label}</Text>
        </View>
      </View>
      {!!r.notes && (
        <View style={s.note}><Text style={s.noteTxt}>💬  {r.notes}</Text></View>
      )}
      {(!isPast || onReserveAgain) && (
        <View style={s.foot}>
          {!isPast && (
            <TouchableOpacity style={s.cancelBtn} onPress={() => onCancel(r.id, resto.name)} disabled={isCancelling}>
              <Text style={s.cancelTxt}>{isCancelling ? '···' : 'Annuler la réservation'}</Text>
            </TouchableOpacity>
          )}
          {isPast && onReserveAgain && (
            <TouchableOpacity style={s.againBtn} onPress={onReserveAgain}>
              <Text style={s.againTxt}>Réserver à nouveau →</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  card:     { marginHorizontal: spacing.xxl, marginTop: spacing.lg, backgroundColor: colors.card, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.cardBorder, borderLeftWidth: 3, overflow: 'hidden' },
  top:      { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, padding: spacing.lg },
  iconWrap: { width: 44, height: 44, borderRadius: radius.lg, backgroundColor: colors.cardHover, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  icon:     { fontSize: 20 },
  name:     { color: colors.text, fontSize: typography.size.subheading, marginBottom: 2 },
  quartier: { color: colors.textDim, fontSize: typography.size.sm, marginBottom: spacing.xs },
  meta:     { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  metaTxt:  { color: colors.textMuted, fontSize: typography.size.caption },
  sep:      { color: colors.textDim },
  badge:    { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.md, borderWidth: 1, flexShrink: 0 },
  badgeTxt: { fontSize: typography.size.xs, fontWeight: typography.weight.semibold },
  note:     { backgroundColor: colors.cardHover, marginHorizontal: spacing.lg, marginBottom: spacing.lg, padding: spacing.lg, borderRadius: radius.md },
  noteTxt:  { color: colors.textMuted, fontSize: typography.size.body, lineHeight: 18 },
  foot:     { borderTopWidth: 1, borderTopColor: colors.cardBorder },
  cancelBtn:{ paddingVertical: 11, alignItems: 'center' },
  cancelTxt:{ color: colors.red, fontSize: typography.size.body },
  againBtn: { paddingVertical: 11, alignItems: 'center' },
  againTxt: { color: colors.blue, fontSize: typography.size.body },
});
