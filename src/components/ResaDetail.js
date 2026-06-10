import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, typography, spacing, radius } from '../theme';
import { STATUS_CFG, clientName } from '../hooks/useComptoir';

export default function ResaDetail({ resa, onConfirm, onCancel, onArrive, acting }) {
  if (!resa) {
    return (
      <View style={s.empty}>
        <Text style={{ fontSize: 48 }}>👆</Text>
        <Text style={s.emptyTitle}>Sélectionnez une réservation</Text>
        <Text style={s.emptySub}>dans la liste à gauche</Text>
      </View>
    );
  }

  const cfg    = STATUS_CFG[resa.status] || STATUS_CFG.pending;
  const isAct  = acting.has(resa.id);
  const isPend = resa.status === 'pending';
  const isConf = resa.status === 'confirmed';
  const canAct = isPend || isConf;

  return (
    <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      <View style={[s.statusBadge, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
        <Text style={[s.statusTxt, { color: cfg.color }]}>{cfg.label}</Text>
      </View>

      <Text style={[s.time, { color: cfg.color }]}>{resa.time_slot?.slice(0, 5)}</Text>
      <Text style={s.clientName}>{clientName(resa)}</Text>

      <View style={s.metaRow}>
        <View style={s.metaBox}>
          <Text style={s.metaVal}>{(resa.nb_adults || 0) + (resa.nb_children || 0)}</Text>
          <Text style={s.metaLbl}>PERSONNES</Text>
        </View>
        {resa.nb_children > 0 && (
          <View style={s.metaBox}>
            <Text style={s.metaVal}>{resa.nb_children}</Text>
            <Text style={s.metaLbl}>ENFANTS</Text>
          </View>
        )}
      </View>

      {!!resa.notes && (
        <View style={s.notesBox}>
          <Text style={s.notesLabel}>📝 Note</Text>
          <Text style={s.notesTxt}>{resa.notes}</Text>
        </View>
      )}

      <View style={s.actions}>
        {isAct ? (
          <Text style={s.acting}>···</Text>
        ) : canAct ? (
          <>
            {isPend && (
              <TouchableOpacity style={s.btnConfirm} onPress={() => onConfirm(resa)}>
                <Text style={s.btnConfirmTxt}>✓  CONFIRMER</Text>
              </TouchableOpacity>
            )}
            {isConf && (
              <TouchableOpacity style={s.btnArrive} onPress={() => onArrive(resa)}>
                <Text style={s.btnArriveTxt}>✓  MARQUER ARRIVÉ</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={s.btnCancel} onPress={() => onCancel(resa)}>
              <Text style={s.btnCancelTxt}>✕  ANNULER</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={[s.finalBadge, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
            <Text style={[s.finalTxt, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  empty:       { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg },
  emptyTitle:  { color: '#F5F2EC', fontSize: typography.size.heading2, fontWeight: '300' },
  emptySub:    { color: 'rgba(245,242,236,0.45)', fontSize: typography.size.body },

  content:     { padding: spacing.section, alignItems: 'center', paddingBottom: 60 },

  statusBadge: { borderRadius: radius.pill, borderWidth: 1.5, paddingHorizontal: spacing.xxl, paddingVertical: spacing.md, marginBottom: spacing.xl },
  statusTxt:   { fontSize: typography.size.caption, fontWeight: typography.weight.bold, letterSpacing: 2 },

  time:        { fontSize: 80, fontWeight: '100', letterSpacing: 2, lineHeight: 90 },
  clientName:  { color: '#F5F2EC', fontSize: typography.size.title, fontWeight: '300', letterSpacing: 0.5, marginBottom: spacing.xxl },

  metaRow:     { flexDirection: 'row', gap: spacing.xxxl, marginBottom: spacing.xxl },
  metaBox:     { alignItems: 'center' },
  metaVal:     { color: '#C87860', fontSize: 48, fontWeight: '200', lineHeight: 52 },
  metaLbl:     { color: 'rgba(245,242,236,0.40)', fontSize: typography.size.xs, letterSpacing: 2, marginTop: spacing.xs },

  notesBox:    { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: radius.xl, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', padding: spacing.xl, width: '100%', marginBottom: spacing.xxl },
  notesLabel:  { color: 'rgba(245,242,236,0.45)', fontSize: typography.size.caption, letterSpacing: 1, marginBottom: spacing.md },
  notesTxt:    { color: '#F5F2EC', fontSize: typography.size.bodyLg, lineHeight: 20 },

  actions:       { width: '100%', gap: spacing.lg, marginTop: spacing.lg },
  acting:        { color: '#C87860', fontSize: 36, fontWeight: '200', textAlign: 'center' },
  btnConfirm:    { backgroundColor: colors.greenSoft, borderRadius: radius.xl, borderWidth: 1.5, borderColor: 'rgba(76,175,130,0.5)', paddingVertical: spacing.xl, alignItems: 'center' },
  btnConfirmTxt: { color: colors.green, fontSize: typography.size.heading2, fontWeight: typography.weight.semibold, letterSpacing: 1.5 },
  btnArrive:     { backgroundColor: colors.blueSoft, borderRadius: radius.xl, borderWidth: 1.5, borderColor: 'rgba(90,155,224,0.4)', paddingVertical: spacing.xl, alignItems: 'center' },
  btnArriveTxt:  { color: colors.blue, fontSize: typography.size.heading2, fontWeight: typography.weight.semibold, letterSpacing: 1.5 },
  btnCancel:     { backgroundColor: colors.redSoft, borderRadius: radius.xl, borderWidth: 1.5, borderColor: 'rgba(224,90,90,0.35)', paddingVertical: spacing.xl, alignItems: 'center' },
  btnCancelTxt:  { color: colors.red, fontSize: typography.size.heading2, fontWeight: typography.weight.semibold, letterSpacing: 1.5 },
  finalBadge:    { borderRadius: radius.pill, borderWidth: 1.5, paddingHorizontal: spacing.xxl, paddingVertical: spacing.xl, alignSelf: 'center', marginTop: spacing.lg },
  finalTxt:      { fontSize: typography.size.heading3, fontWeight: typography.weight.semibold, letterSpacing: 2 },
});
