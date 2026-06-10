import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { colors, typography, spacing, radius } from '../theme';
import ResaBadge from './ResaBadge';
import { fmtShort, daysUntil } from '../hooks/useReservations';

function Thumb({ url, size = 52 }) {
  if (url) return <Image source={{ uri: url }} style={{ width:size, height:size, borderRadius: radius.xl }} resizeMode="cover" />;
  return (
    <View style={{ width:size, height:size, borderRadius: radius.xl, backgroundColor: colors.cardHover, alignItems:'center', justifyContent:'center' }}>
      <Text style={{ fontSize: size * 0.38 }}>🍽️</Text>
    </View>
  );
}

export default function SmallResaCard({ r, onCancel, onPress, onEdit }) {
  const days = daysUntil(r.date);
  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.85}>
      <Thumb url={r.restaurants?.photos?.[0]} size={56} />
      <View style={{ flex:1 }}>
        <Text style={s.name} numberOfLines={1}>{r.restaurants?.name || '—'}</Text>
        <Text style={s.meta}>{fmtShort(r.date)} · {r.time_slot?.slice(0,5)} · {(r.nb_adults||0)+(r.nb_children||0)} pers.</Text>
        <Text style={[s.countdown, { color: days === 'DEMAIN' ? colors.green : colors.blue }]}>
          {days}
        </Text>
      </View>
      <View style={{ alignItems:'flex-end', gap: spacing.sm }}>
        <ResaBadge status={r.status} />
        {['confirmed','pending'].includes(r.status) && onEdit && (
          <TouchableOpacity onPress={onEdit}>
            <Text style={s.editTxt}>Modifier</Text>
          </TouchableOpacity>
        )}
        {['confirmed','pending'].includes(r.status) && (
          <TouchableOpacity onPress={onCancel}>
            <Text style={s.cancelTxt}>Annuler</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  card:      { flexDirection:'row', alignItems:'center', gap: spacing.lg, marginHorizontal: spacing.xl, marginBottom: spacing.md, backgroundColor: colors.card, borderRadius: radius.xxl, padding: spacing.xl, borderWidth:1, borderColor: colors.cardBorder },
  name:      { color: colors.text, fontSize: typography.size.subheading, fontWeight: typography.weight.regular, marginBottom:3 },
  meta:      { color: colors.textMuted, fontSize: typography.size.caption, marginBottom:3 },
  countdown: { fontSize: typography.size.caption, fontWeight: typography.weight.regular },
  editTxt:   { color: colors.blue, fontSize: typography.size.caption },
  cancelTxt: { color: colors.red, fontSize: typography.size.caption },
});
