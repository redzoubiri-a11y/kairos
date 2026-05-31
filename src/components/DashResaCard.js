import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, typography, spacing, radius } from '../theme';
import { clientName } from '../hooks/useComptoir';
import { STATUS, avatarColor, formatDate } from '../hooks/useDashboard';

export default function DashResaCard({ r, onConfirm, onCancel, onArrived, isActing, isToday }) {
  const st  = STATUS[r.status] || STATUS.pending;
  const nom = clientName(r);
  const col = avatarColor(nom);
  const initials = nom.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const covers = (r.nb_adults || 0) + (r.nb_children || 0);
  const showArrivedBtn = r.status === 'confirmed' && isToday;
  const showActions    = r.status === 'pending';

  return (
    <View style={[s.card, { borderLeftColor: st.color }]}>
      <View style={s.top}>
        <View style={s.timeCol}>
          <Text style={s.timeVal}>{r.time_slot?.slice(0, 5) || '—'}</Text>
          <Text style={s.dateVal}>{formatDate(r.date)}</Text>
        </View>
        <View style={[s.avatar, { backgroundColor: col + '22', borderColor: col + '55' }]}>
          <Text style={[s.avatarTxt, { color: col }]}>{initials || '?'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.name}>{nom}</Text>
          <View style={s.coverRow}>
            <Text style={s.coverTxt}>👥 {covers} couvert{covers > 1 ? 's' : ''}</Text>
            {r.nb_children > 0 && <Text style={s.childTxt}>· {r.nb_children} enfant{r.nb_children > 1 ? 's' : ''}</Text>}
          </View>
        </View>
        <View style={[s.badge, { backgroundColor: st.bg, borderColor: st.border }]}>
          <Text style={[s.badgeTxt, { color: st.color }]}>{st.label}</Text>
        </View>
      </View>

      {!!r.notes && (
        <View style={s.noteWrap}>
          <Text style={s.noteIcon}>💬</Text>
          <Text style={s.noteTxt}>{r.notes}</Text>
        </View>
      )}

      {(showActions || showArrivedBtn) && (
        <View style={s.actions}>
          {showActions && (
            <>
              <TouchableOpacity style={s.btnConfirm} onPress={onConfirm} disabled={isActing}>
                <Text style={s.btnConfirmTxt}>{isActing ? '···' : '✓  Confirmer'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.btnRefuse} onPress={onCancel} disabled={isActing}>
                <Text style={s.btnRefuseTxt}>✕  Refuser</Text>
              </TouchableOpacity>
            </>
          )}
          {showArrivedBtn && (
            <TouchableOpacity style={s.btnArrived} onPress={onArrived} disabled={isActing}>
              <Text style={s.btnArrivedTxt}>{isActing ? '···' : '🪑  Client arrivé'}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  card:          { backgroundColor: colors.card, borderRadius: radius.xxl, borderWidth: 1, borderColor: colors.cardBorder, borderLeftWidth: 3, marginHorizontal: spacing.xxl, marginBottom: spacing.lg, padding: spacing.xl, gap: spacing.lg },
  top:           { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  timeCol:       { alignItems: 'center', minWidth: 46 },
  timeVal:       { color: colors.text, fontSize: typography.size.heading3, fontWeight: typography.weight.medium },
  dateVal:       { color: colors.textDim, fontSize: typography.size.xs, marginTop: 2 },
  avatar:        { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  avatarTxt:     { fontSize: typography.size.body, fontWeight: typography.weight.medium },
  name:          { color: colors.text, fontSize: typography.size.subheading, fontWeight: '300', marginBottom: spacing.xxs },
  coverRow:      { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  coverTxt:      { color: colors.textMuted, fontSize: typography.size.body },
  childTxt:      { color: colors.textDim, fontSize: typography.size.caption },
  badge:         { borderRadius: radius.md, borderWidth: 1, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  badgeTxt:      { fontSize: typography.size.xs, fontWeight: typography.weight.semibold, letterSpacing: 1 },
  noteWrap:      { flexDirection: 'row', gap: spacing.md, backgroundColor: colors.cardHover, borderRadius: radius.md, padding: spacing.lg },
  noteIcon:      { fontSize: 13 },
  noteTxt:       { color: colors.textMuted, fontSize: typography.size.body, lineHeight: 18, flex: 1 },
  actions:       { flexDirection: 'row', gap: spacing.md },
  btnConfirm:    { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 11, borderRadius: radius.lg, backgroundColor: colors.greenSoft, borderWidth: 1, borderColor: 'rgba(76,175,130,0.3)' },
  btnConfirmTxt: { color: colors.green, fontSize: typography.size.bodyLg, fontWeight: typography.weight.medium },
  btnRefuse:     { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 11, borderRadius: radius.lg, backgroundColor: colors.redSoft, borderWidth: 1, borderColor: 'rgba(224,90,90,0.25)' },
  btnRefuseTxt:  { color: colors.red, fontSize: typography.size.bodyLg },
  btnArrived:    { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 11, borderRadius: radius.lg, backgroundColor: colors.blueSoft, borderWidth: 1, borderColor: 'rgba(90,155,224,0.3)' },
  btnArrivedTxt: { color: colors.blue, fontSize: typography.size.bodyLg },
});
