import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { colors, typography, spacing, radius } from '../theme';
import ResaBadge from './ResaBadge';
import { statusCfg, fmtShort } from '../hooks/useReservations';

function Thumb({ url, size = 52 }) {
  if (url) return <Image source={{ uri: url }} style={{ width:size, height:size, borderRadius: radius.xl }} resizeMode="cover" />;
  return (
    <View style={{ width:size, height:size, borderRadius: radius.xl, backgroundColor: colors.cardHover, alignItems:'center', justifyContent:'center' }}>
      <Text style={{ fontSize: size * 0.38 }}>🍽️</Text>
    </View>
  );
}

export default function HistResaCard({ r, onReserveAgain, onPress, onReview, hasReview }) {
  const sc        = statusCfg(r.status);
  const canRebook = ['completed','arrived','no_show'].includes(r.status);
  const canReview = ['arrived','completed','confirmed'].includes(r.status) && !!r.restaurants?.id;

  return (
    <TouchableOpacity style={[s.card, { borderLeftColor: sc.color }]} onPress={onPress} activeOpacity={0.85}>
      <Thumb url={r.restaurants?.photo_url} size={50} />
      <View style={{ flex:1 }}>
        <Text style={s.name} numberOfLines={1}>{r.restaurants?.name || '—'}</Text>
        <Text style={s.meta}>{fmtShort(r.date)} · {r.time_slot?.slice(0,5)} · {(r.nb_adults||0)+(r.nb_children||0)} pers.</Text>
        {!!r.notes && <Text style={s.note} numberOfLines={1}>💬 {r.notes}</Text>}
        <View style={s.actions}>
          {canRebook && onReserveAgain && (
            <TouchableOpacity onPress={onReserveAgain}>
              <Text style={s.reBook}>Réserver à nouveau →</Text>
            </TouchableOpacity>
          )}
          {canReview && onReview && (
            hasReview
              ? <Text style={s.reviewed}>✓ Avis publié</Text>
              : (
                <TouchableOpacity onPress={() => onReview(r)} style={s.reviewBtn}>
                  <Text style={s.reviewBtnTxt}>★ Laisser un avis</Text>
                </TouchableOpacity>
              )
          )}
        </View>
      </View>
      <ResaBadge status={r.status} />
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  card:         { flexDirection:'row', alignItems:'center', gap: spacing.lg, paddingVertical: spacing.xl, paddingHorizontal: spacing.xxl, borderBottomWidth:1, borderBottomColor: colors.cardBorder, borderLeftWidth:3 },
  name:         { color: colors.text, fontSize: typography.size.subheading, fontWeight: typography.weight.regular, marginBottom:3 },
  meta:         { color: colors.textMuted, fontSize: typography.size.caption, marginBottom:2 },
  note:         { color: colors.textDim, fontSize: typography.size.sm },
  actions:      { flexDirection:'row', flexWrap:'wrap', gap: spacing.lg, marginTop: spacing.xs },
  reBook:       { color: colors.blue, fontSize: typography.size.caption },
  reviewBtn:    { backgroundColor: colors.accentSoft, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.xxs, borderWidth:1, borderColor:'rgba(232,160,69,0.3)' },
  reviewBtnTxt: { color: colors.accent, fontSize: typography.size.caption, fontWeight: typography.weight.regular },
  reviewed:     { color: colors.green, fontSize: typography.size.caption },
});
