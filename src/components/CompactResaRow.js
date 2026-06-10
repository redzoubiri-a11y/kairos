import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, radius } from '../theme';
import { STATUS_CFG, clientName } from '../hooks/useComptoir';

export default function CompactResaRow({ resa, isSelected, onSelect }) {
  const cfg       = STATUS_CFG[resa.status] || STATUS_CFG.pending;
  const isArrived = resa.status === 'arrived';
  return (
    <TouchableOpacity
      style={[s.row, isSelected && s.rowSel, { borderLeftColor: cfg.color }, isArrived && s.rowDim]}
      onPress={() => onSelect(resa.id)}
      activeOpacity={0.8}
    >
      <Text style={[s.time, { color: cfg.color }]}>{resa.time_slot?.slice(0, 5)}</Text>
      <View style={{ flex: 1 }}>
        <Text style={s.name} numberOfLines={1}>{clientName(resa)}</Text>
        <View style={s.meta}>
          <View style={[s.badge, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
            <Text style={[s.badgeTxt, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
          <Text style={s.covers}>{(resa.nb_adults || 0) + (resa.nb_children || 0)} pers.</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  row:     { flexDirection: 'row', alignItems: 'center', gap: spacing.xl, paddingVertical: spacing.xl, paddingHorizontal: spacing.xxl, borderLeftWidth: 3, borderLeftColor: 'transparent', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)' },
  rowDim:  { opacity: 0.4 },
  rowSel:  { backgroundColor: 'rgba(255,255,255,0.06)' },
  time:    { fontSize: typography.size.heading1, fontWeight: '300', letterSpacing: 0.5, width: 56 },
  name:    { color: '#F5F2EC', fontSize: typography.size.bodyLg, fontWeight: typography.weight.medium, marginBottom: spacing.xs },
  meta:    { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  badge:   { borderRadius: radius.sm, borderWidth: 1, paddingHorizontal: spacing.md, paddingVertical: 2 },
  badgeTxt:{ fontSize: typography.size.xs, fontWeight: typography.weight.semibold, letterSpacing: 1 },
  covers:  { color: colors.textMuted, fontSize: typography.size.caption },
});
