import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { colors, typography, spacing, radius } from '../theme';
import MLoader from './MLoader';
import Stars from './Stars';

export default function RestaurantAvisTab({ restaurant, reviews, loadingReviews }) {
  const rating = Number(restaurant.avg_rating || 0);

  if (loadingReviews) return (
    <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.xxl }}>
      {[1, 2, 3].map(i => (
        <MLoader key={i} width="100%" height={70} borderRadius={radius.md} style={{ marginBottom: spacing.lg }} />
      ))}
    </View>
  );

  return (
    <View style={s.wrap}>
      <View style={s.scoreHead}>
        <Text style={s.scoreBig}>{rating > 0 ? rating.toFixed(1).replace('.', ',') : '—'}</Text>
        <Stars value={rating} size={16} />
        <Text style={s.scoreCt}>{reviews.length > 0 ? `${reviews.length} avis` : 'Aucun avis'}</Text>
      </View>

      {reviews.length === 0 ? (
        <View style={s.empty}>
          <Text style={s.emptyEmoji}>💬</Text>
          <Text style={s.emptyTxt}>Aucun avis pour l'instant</Text>
          <Text style={s.emptySub}>Soyez le premier à partager votre expérience</Text>
        </View>
      ) : reviews.map((a, i) => {
        const displayName = a.nom || `${a.first_name || ''}${a.last_name ? ' ' + a.last_name[0] + '.' : ''}`.trim() || 'Anonyme';
        const note = a.note || a.rating || 0;
        return (
          <View key={a.id || i} style={[s.revRow, i < reviews.length - 1 && s.revRowBorder]}>
            <View style={s.revTop}>
              <Text style={s.revName}>{displayName}</Text>
              <Stars value={note} size={12} />
            </View>
            <Text style={s.revDate}>{a.date || (a.created_at || '').slice(0, 10)}</Text>
            {(a.txt || a.comment) && <Text style={s.revComment}>{a.txt || a.comment}</Text>}
          </View>
        );
      })}

      <TouchableOpacity
        style={s.ctaBtn}
        onPress={() => Alert.alert('Laisser un avis', 'Après votre visite, vous pouvez laisser un avis depuis Profil → Mes réservations → Historique.')}
      >
        <Text style={s.ctaTxt}>✏️ Laisser un avis</Text>
      </TouchableOpacity>

      <View style={{ height: 20 }} />
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { paddingHorizontal: spacing.xl },

  scoreHead: { alignItems: 'center', paddingVertical: spacing.xxl - 4, borderBottomWidth: 1, borderBottomColor: colors.cardBorder, marginTop: spacing.md },
  scoreBig:  { fontFamily: typography.display, fontSize: 36, color: colors.text },
  scoreCt:   { fontFamily: typography.body, fontSize: typography.size.caption, color: colors.textDim, marginTop: 2 },

  revRow:       { paddingVertical: spacing.lg + 2 },
  revRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  revTop:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  revName:   { fontFamily: typography.bodyBold, fontSize: typography.size.bodyLg - 0.5, color: colors.text },
  revDate:   { fontFamily: typography.body, fontSize: typography.size.xs + 0.5, color: colors.textDim, marginTop: 2 },
  revComment:{ fontFamily: typography.body, fontSize: typography.size.caption + 0.5, color: colors.textMuted, marginTop: spacing.sm, lineHeight: 19 },

  empty:     { alignItems: 'center', paddingVertical: 48, gap: spacing.md },
  emptyEmoji:{ fontSize: 36 },
  emptyTxt:  { fontFamily: typography.body, color: colors.textMuted, fontSize: typography.size.subheading },
  emptySub:  { fontFamily: typography.body, color: colors.textDim, fontSize: typography.size.body, textAlign: 'center' },

  ctaBtn: { marginTop: spacing.xxl - 4, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.cardBorder, paddingVertical: spacing.lg, alignItems: 'center' },
  ctaTxt: { fontFamily: typography.bodySemibold, fontSize: typography.size.body, color: colors.text },
});
