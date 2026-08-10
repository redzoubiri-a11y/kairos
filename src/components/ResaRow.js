import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, typography, spacing, radius, alpha } from '../theme';
import { STATUS_CFG, clientName } from '../hooks/useComptoir';

export default function ResaRow({ resa, index, onConfirm, onCancel, onArrive, acting }) {
  const cfg        = STATUS_CFG[resa.status] || STATUS_CFG.pending;
  const isAct      = acting.has(resa.id);
  const isPending  = resa.status === 'pending';
  const isConf     = resa.status === 'confirmed';
  const isArrived  = resa.status === 'arrived';
  const canAct     = isPending || isConf;

  return (
    <View style={[s.card, index % 2 === 0 && s.cardStripe, { borderLeftColor: cfg.color }, isArrived && s.cardDim]}>
      <View style={s.infoRow}>
        <Text style={[s.time, { color: cfg.color }]} numberOfLines={1}>{resa.time_slot?.slice(0, 5)}</Text>
        <View style={s.clientCol}>
          <Text style={s.clientName} numberOfLines={1}>{clientName(resa)}</Text>
          {!!resa.notes && <Text style={s.notes} numberOfLines={1}>📝 {resa.notes}</Text>}
        </View>
        <Text style={s.couv}>
          {resa.nb_adults + (resa.nb_children || 0)}
          <Text style={s.couvUnit}> pers</Text>
        </Text>
        <View style={[s.badge, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
          <Text style={[s.badgeTxt, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
      </View>

      {canAct && (
        <View style={s.actionsRow}>
          {isAct ? (
            <Text style={s.acting}>···</Text>
          ) : (
            <>
              {isPending && (
                <TouchableOpacity style={[s.btn, s.btnConfirm]} onPress={() => onConfirm(resa)}>
                  <Text style={[s.btnTxt, { color: colors.green }]}>✓  CONFIRMER</Text>
                </TouchableOpacity>
              )}
              {isConf && (
                <TouchableOpacity style={[s.btn, s.btnArrive]} onPress={() => onArrive(resa)}>
                  <Text style={[s.btnTxt, { color: colors.blue }]}>✓  ARRIVÉ</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={[s.btn, s.btnCancel]} onPress={() => onCancel(resa)}>
                <Text style={[s.btnTxt, { color: colors.red }]}>✕  ANNULER</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  card:       { borderLeftWidth: 4, borderBottomWidth: 1, borderBottomColor: alpha(colors.onDark, 0.07), paddingVertical: spacing.xl, paddingHorizontal: spacing.xxl },
  cardDim:    { opacity: 0.4 },
  cardStripe: { backgroundColor: alpha(colors.onDark, 0.04) },

  infoRow:    { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  time:       { fontSize: 18, fontWeight: '300', flexShrink: 0, marginRight: spacing.md, minWidth: 52 },
  clientCol:  { flex: 1 },
  clientName: { color: colors.ivory, fontSize: typography.size.bodyLg, fontWeight: '400', letterSpacing: 0.3 },
  notes:      { color: alpha(colors.ivory, 0.5), fontSize: typography.size.body, fontStyle: 'italic', marginTop: 3 },
  couv:       { color: colors.ivory, fontSize: typography.size.bodyLg, fontWeight: '300' },
  couvUnit:   { color: alpha(colors.ivory, 0.45), fontSize: typography.size.body },
  badge:      { borderRadius: radius.md, borderWidth: 1, paddingHorizontal: spacing.lg, paddingVertical: 6, alignItems: 'center' },
  badgeTxt:   { fontSize: typography.size.caption, fontWeight: '700', letterSpacing: 1.2 },

  actionsRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  btn:        { flex: 1, borderRadius: radius.md, borderWidth: 1.5, paddingVertical: 12, alignItems: 'center', minWidth: 0 },
  btnTxt:     { fontSize: typography.size.body, fontWeight: typography.weight.semibold, letterSpacing: 0.5 },
  btnConfirm: { backgroundColor: alpha(colors.green, 0.22), borderColor: alpha(colors.green, 0.7) },
  btnArrive:  { backgroundColor: alpha(colors.blue, 0.22), borderColor: alpha(colors.blue, 0.7) },
  btnCancel:  { backgroundColor: alpha(colors.red, 0.22),  borderColor: alpha(colors.red, 0.65) },
  acting:     { color: colors.primary, fontSize: 22, textAlign: 'center', flex: 1 },
});
