import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { colors, typography, spacing, radius } from '../theme';
import { statusCfg, fmtShort } from '../hooks/useReservations';

function Thumb({ url, size = 56 }) {
  if (url) return <Image source={{ uri: url }} style={{ width: size, height: size, borderRadius: radius.md }} resizeMode="cover" />;
  return (
    <View style={{ width: size, height: size, borderRadius: radius.md, backgroundColor: colors.cardHover, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: size * 0.38 }}>🍽️</Text>
    </View>
  );
}

export default function HistResaCard({ r, onReserveAgain, onPress, onReview, hasReview, isPendingReview }) {
  const sc        = statusCfg(r.status);
  const canRebook = ['completed', 'arrived', 'no_show'].includes(r.status);
  const canReview = r.status === 'arrived' && !!r.restaurants?.id;
  const partyCount = (r.nb_adults || 0) + (r.nb_children || 0);

  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.9}>
      <View style={s.cardTop}>
        <Text style={s.dateBadge} numberOfLines={1}>{fmtShort(r.date)} · {r.time_slot?.slice(0, 5)}</Text>
        <View style={[s.statusTag, { backgroundColor: sc.bg }]}>
          <Text style={[s.statusTagTxt, { color: sc.color }]}>{sc.label}</Text>
        </View>
      </View>

      <View style={s.body}>
        <Thumb url={r.restaurants?.photos?.[0]} />
        <View style={{ flex: 1 }}>
          <Text style={s.name} numberOfLines={1}>{r.restaurants?.name || '—'}</Text>
          <Text style={s.meta}>
            {partyCount} personne{partyCount > 1 ? 's' : ''}{r.restaurants?.quartier ? ` · ${r.restaurants.quartier}` : ''}
          </Text>
          {!!r.notes && <Text style={s.note} numberOfLines={1}>💬 {r.notes}</Text>}
        </View>
      </View>

      {canReview && onReview && (
        hasReview ? (
          <View style={s.statusRow}><Text style={s.reviewedTxt}>✓ Avis publié</Text></View>
        ) : isPendingReview ? (
          <View style={s.statusRow}><Text style={s.pendingTxt}>⏳ Modération en cours</Text></View>
        ) : (
          <TouchableOpacity style={s.actBtn} onPress={() => onReview(r)}>
            <Text style={s.actBtnTxt}>⭐ Laisser un avis</Text>
          </TouchableOpacity>
        )
      )}
      {canRebook && onReserveAgain && (
        <TouchableOpacity style={s.actBtn} onPress={onReserveAgain}>
          <Text style={s.actBtnTxt}>Réserver à nouveau →</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  card: { marginHorizontal: spacing.xl, marginBottom: spacing.lg, backgroundColor: colors.card, borderRadius: radius.lg + 1, borderWidth: 1, borderColor: colors.cardBorder, overflow: 'hidden' },

  cardTop:   { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.sm, paddingHorizontal: spacing.xl, paddingTop: spacing.lg + 2 },
  dateBadge: { flex: 1, fontFamily: typography.bodyBold, fontSize: typography.size.caption - 1, color: colors.textDim, textTransform: 'uppercase', letterSpacing: 0.3 },
  statusTag:    { flexShrink: 0, borderRadius: radius.sm + 2, paddingHorizontal: spacing.sm, paddingVertical: 5 },
  statusTagTxt: { fontFamily: typography.bodyBold, fontSize: typography.size.xs + 0.5, letterSpacing: 0.2 },

  body:  { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, padding: spacing.xl, paddingTop: spacing.md },
  name:  { color: colors.text, fontFamily: typography.display, fontSize: typography.size.subheading - 1 },
  meta:  { fontFamily: typography.body, color: colors.textMuted, fontSize: typography.size.caption + 0.5, marginTop: 3 },
  note:  { fontFamily: typography.body, color: colors.textDim, fontSize: typography.size.xs + 1, marginTop: 2 },

  actBtn:    { marginHorizontal: spacing.xl, marginBottom: spacing.lg, borderRadius: radius.md + 1, borderWidth: 1, borderColor: colors.cardBorder, paddingVertical: spacing.md + 1, alignItems: 'center' },
  actBtnTxt: { fontFamily: typography.bodySemibold, color: colors.text, fontSize: typography.size.caption + 0.5 },

  statusRow:   { paddingHorizontal: spacing.xl, paddingBottom: spacing.lg, alignItems: 'center' },
  reviewedTxt: { fontFamily: typography.bodyMedium, color: colors.green, fontSize: typography.size.caption + 0.5 },
  pendingTxt:  { fontFamily: typography.body, color: colors.textMuted, fontSize: typography.size.caption + 0.5, fontStyle: 'italic' },
});
