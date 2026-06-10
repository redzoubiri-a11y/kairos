import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, typography, spacing, radius } from '../theme';
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
  card:       { borderLeftWidth: 4, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)', paddingVertical: spacing.xl, paddingHorizontal: spacing.xxl },
  cardDim:    { opacity: 0.4 },
  cardStripe: { backgroundColor: 'rgba(255,255,255,0.04)' },

  infoRow:    { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  time:       { fontSize: 18, fontWeight: '300', flexShrink: 0, marginRight: spacing.md, minWidth: 52 },
  clientCol:  { flex: 1 },
  clientName: { color: '#F5F2EC', fontSize: typography.size.bodyLg, fontWeight: '400', letterSpacing: 0.3 },
  notes:      { color: 'rgba(245,242,236,0.50)', fontSize: typography.size.body, fontStyle: 'italic', marginTop: 3 },
  couv:       { color: '#F5F2EC', fontSize: typography.size.bodyLg, fontWeight: '300' },
  couvUnit:   { color: 'rgba(245,242,236,0.45)', fontSize: typography.size.body },
  badge:      { borderRadius: radius.md, borderWidth: 1, paddingHorizontal: spacing.lg, paddingVertical: 6, alignItems: 'center' },
  badgeTxt:   { fontSize: typography.size.caption, fontWeight: '700', letterSpacing: 1.2 },

  actionsRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  btn:        { flex: 1, borderRadius: radius.md, borderWidth: 1.5, paddingVertical: 12, alignItems: 'center', minWidth: 0 },
  btnTxt:     { fontSize: typography.size.body, fontWeight: typography.weight.semibold, letterSpacing: 0.5 },
  btnConfirm: { backgroundColor: 'rgba(76,175,130,0.22)', borderColor: 'rgba(76,175,130,0.70)' },
  btnArrive:  { backgroundColor: 'rgba(90,155,224,0.22)', borderColor: 'rgba(90,155,224,0.70)' },
  btnCancel:  { backgroundColor: 'rgba(224,90,90,0.22)',  borderColor: 'rgba(224,90,90,0.65)' },
  acting:     { color: '#C87860', fontSize: 22, textAlign: 'center', flex: 1 },
});
