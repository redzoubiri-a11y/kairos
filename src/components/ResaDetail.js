import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, typography, spacing, radius } from '../theme';
import { STATUS_CFG, clientName } from '../hooks/useComptoir';
import EmptyState from './EmptyState';

export default function ResaDetail({ resa, onConfirm, onCancel, onArrive, onNoShow, acting }) {
  if (!resa) {
    return (
      <View style={s.empty}>
        <EmptyState icon={<Text style={{ fontSize: 20 }}>👆</Text>} title="Sélectionnez une réservation" subtitle="dans la liste à gauche" />
      </View>
    );
  }

  const cfg        = STATUS_CFG[resa.status] || STATUS_CFG.pending;
  const isAct      = acting.has(resa.id);
  const isPend     = resa.status === 'pending';
  const isConf     = resa.status === 'confirmed';
  const canAct     = isPend || isConf;
  const noShowCount = resa.users?.no_show_count ?? 0;

  return (
    <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      <View style={[s.statusBadge, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
        <Text style={[s.statusTxt, { color: cfg.color }]}>{cfg.label}</Text>
      </View>

      <Text style={[s.time, { color: cfg.color }]}>{resa.time_slot?.slice(0, 5)}</Text>
      <Text style={s.clientName}>{clientName(resa)}</Text>

      {noShowCount > 0 && (
        <View style={[s.noShowBadge, noShowCount >= 3 && s.noShowBadgeDanger]}>
          <Text style={[s.noShowTxt, noShowCount >= 3 && s.noShowTxtDanger]}>
            ⚠️  {noShowCount} no-show{noShowCount > 1 ? 's' : ''} enregistré{noShowCount > 1 ? 's' : ''}
          </Text>
        </View>
      )}

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
            {isConf && (
              <TouchableOpacity style={s.btnNoShow} onPress={() => onNoShow(resa)}>
                <Text style={s.btnNoShowTxt}>✕  NO SHOW</Text>
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

  content:     { padding: spacing.section, alignItems: 'center', paddingBottom: 60 },

  statusBadge: { borderRadius: radius.pill, borderWidth: 1.5, paddingHorizontal: spacing.xxl, paddingVertical: spacing.md, marginBottom: spacing.xl },
  statusTxt:   { fontFamily: typography.bodyBold, fontSize: typography.size.caption, letterSpacing: 2 },

  time:        { fontFamily: typography.display, fontSize: 72, letterSpacing: -1, lineHeight: 82 },
  clientName:  { fontFamily: typography.bodyMedium, color: colors.text, fontSize: typography.size.title, letterSpacing: 0.5, marginBottom: spacing.xxl },

  metaRow:     { flexDirection: 'row', gap: spacing.xxxl, marginBottom: spacing.xxl },
  metaBox:     { alignItems: 'center' },
  metaVal:     { color: colors.primary, fontFamily: typography.display, fontSize: 48, lineHeight: 52 },
  metaLbl:     { fontFamily: typography.body, color: colors.textDim, fontSize: typography.size.xs, letterSpacing: 2, marginTop: spacing.xs },

  notesBox:    { backgroundColor: colors.cardHover, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.cardBorder, padding: spacing.xl, width: '100%', marginBottom: spacing.xxl },
  notesLabel:  { fontFamily: typography.body, color: colors.textDim, fontSize: typography.size.caption, letterSpacing: 1, marginBottom: spacing.md },
  notesTxt:    { fontFamily: typography.body, color: colors.text, fontSize: typography.size.bodyLg, lineHeight: 20 },

  actions:       { width: '100%', gap: spacing.lg, marginTop: spacing.lg },
  acting:        { color: colors.primary, fontSize: 36, fontWeight: '200', textAlign: 'center' },
  btnConfirm:    { backgroundColor: colors.greenSoft, borderRadius: radius.xl, borderWidth: 1.5, borderColor: 'rgba(76,175,130,0.5)', paddingVertical: spacing.xl, alignItems: 'center' },
  btnConfirmTxt: { fontFamily: typography.bodySemibold, color: colors.green, fontSize: typography.size.heading2, letterSpacing: 1.5 },
  btnArrive:     { backgroundColor: colors.blueSoft, borderRadius: radius.xl, borderWidth: 1.5, borderColor: 'rgba(90,155,224,0.4)', paddingVertical: spacing.xl, alignItems: 'center' },
  btnArriveTxt:  { fontFamily: typography.bodySemibold, color: colors.blue, fontSize: typography.size.heading2, letterSpacing: 1.5 },
  btnCancel:     { backgroundColor: colors.redSoft, borderRadius: radius.xl, borderWidth: 1.5, borderColor: 'rgba(224,90,90,0.35)', paddingVertical: spacing.xl, alignItems: 'center' },
  btnCancelTxt:  { fontFamily: typography.bodySemibold, color: colors.red, fontSize: typography.size.heading2, letterSpacing: 1.5 },
  finalBadge:    { borderRadius: radius.pill, borderWidth: 1.5, paddingHorizontal: spacing.xxl, paddingVertical: spacing.xl, alignSelf: 'center', marginTop: spacing.lg },
  finalTxt:      { fontFamily: typography.bodySemibold, fontSize: typography.size.heading3, letterSpacing: 2 },

  noShowBadge:       { backgroundColor: colors.goldSoft, borderRadius: radius.lg, borderWidth: 1, borderColor: 'rgba(200,151,90,0.35)', paddingHorizontal: spacing.xxl, paddingVertical: spacing.md, marginBottom: spacing.xxl },
  noShowBadgeDanger: { backgroundColor: colors.redSoft, borderColor: 'rgba(224,90,90,0.4)' },
  noShowTxt:         { fontFamily: typography.bodySemibold, color: colors.gold, fontSize: typography.size.caption, letterSpacing: 0.5 },
  noShowTxtDanger:   { color: colors.red },

  btnNoShow:    { backgroundColor: colors.cardHover, borderRadius: radius.xl, borderWidth: 1.5, borderColor: colors.cardBorder, paddingVertical: spacing.xl, alignItems: 'center' },
  btnNoShowTxt: { fontFamily: typography.bodySemibold, color: colors.textMuted, fontSize: typography.size.heading2, letterSpacing: 1.5 },
});
