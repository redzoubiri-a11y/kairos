import { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, typography, spacing, radius } from '../theme';
import MLoader from './MLoader';
import Stars from './Stars';

const MOCK_AVIS = [
  { id:'m1', nom:'Karim B.',   note:5, date:'12 mai 2026', txt:'Excellent ! Service impeccable, on reviendra sans hésiter.' },
  { id:'m2', nom:'Amira M.',   note:4, date:'8 mai 2026',  txt:'Très bonne cuisine, ambiance chaleureuse. Je recommande.' },
  { id:'m3', nom:'Sofiane A.', note:5, date:'2 mai 2026',  txt:"L'un des meilleurs de la ville. Qualité constante." },
  { id:'m4', nom:'Nadia K.',   note:4, date:'28 avr 2026', txt:'Service attentionné, plats généreux. Le couscous était parfait.' },
];

const AVATAR_COLORS = ['#E8A045','#5A9BE0','#4CAF82','#9b6cc8','#E05A5A','#5ab4c8'];
function avatarColor(name) {
  let h = 0;
  for (let i = 0; i < (name||'').length; i++) h = (h * 31 + name.charCodeAt(i)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[Math.abs(h)];
}

export default function RestaurantAvisTab({ restaurant, reviews, loadingReviews }) {
  const rating = Number(restaurant.avg_rating || 0);

  const { list, dist } = useMemo(() => {
    const list = reviews.length > 0 ? reviews : MOCK_AVIS;
    const dist = [5, 4, 3, 2, 1].map(n => ({
      n,
      pct: list.length > 0
        ? Math.round((list.filter(r => Math.round(r.note || r.rating) === n).length / list.length) * 100)
        : (n === 5 ? 60 : n === 4 ? 30 : 10),
    }));
    return { list, dist };
  }, [reviews]);

  if (loadingReviews) return (
    <View style={{ padding: spacing.xxl }}>
      {[1, 2, 3].map(i => (
        <MLoader key={i} width="100%" height={90} borderRadius={radius.xl} style={{ marginBottom: spacing.lg }} />
      ))}
    </View>
  );

  return (
    <>
      <View style={s.summary}>
        <View style={s.summaryLeft}>
          <Text style={s.bigRating}>{rating > 0 ? rating.toFixed(1) : '—'}</Text>
          <Stars value={rating} size={15} />
          <Text style={s.reviewCount}>
            {restaurant.review_count > 0 ? `${restaurant.review_count} avis` : `${list.length} avis`}
          </Text>
        </View>
        <View style={s.summaryRight}>
          {dist.map(d => (
            <View key={d.n} style={s.barRow}>
              <Text style={s.barLabel}>{d.n}</Text>
              <View style={s.barTrack}>
                <View style={[s.barFill, { width: `${d.pct}%` }]} />
              </View>
              <Text style={s.barPct}>{d.pct}%</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={s.divider} />

      {list.map((a, i) => {
        const displayName = a.nom || `${a.first_name || ''}${a.last_name ? ' ' + a.last_name[0] + '.' : ''}`.trim() || 'Anonyme';
        const note  = a.note || a.rating || 0;
        const color = avatarColor(displayName);
        return (
          <View key={a.id || i} style={s.card}>
            <View style={s.cardTop}>
              <View style={[s.avatar, { backgroundColor: color + '22', borderColor: color + '44' }]}>
                <Text style={[s.avatarTxt, { color }]}>{displayName[0].toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.nom}>{displayName}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.xxs }}>
                  <Stars value={note} size={11} />
                  <Text style={s.date}>{a.date || (a.created_at || '').slice(0, 10)}</Text>
                </View>
              </View>
              <View style={[s.noteBadge, note >= 4 && s.noteBadgeGood]}>
                <Text style={[s.noteBadgeTxt, note >= 4 && { color: colors.green }]}>{note}/5</Text>
              </View>
            </View>
            {(a.txt || a.comment) && <Text style={s.txt}>{a.txt || a.comment}</Text>}
          </View>
        );
      })}

      <View style={s.ctaWrap}>
        <View style={s.ctaDivider}>
          <View style={{ flex: 1, height: 1, backgroundColor: colors.cardBorder }} />
          <Text style={s.ctaDividerTxt}>Vous y étiez ?</Text>
          <View style={{ flex: 1, height: 1, backgroundColor: colors.cardBorder }} />
        </View>
        <TouchableOpacity style={s.ctaBtn}>
          <Text style={s.ctaIcon}>✏️</Text>
          <Text style={s.ctaTxt}>Laisser un avis</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />
    </>
  );
}

const s = StyleSheet.create({
  summary:      { flexDirection: 'row', gap: spacing.xl + 2, margin: spacing.xl, marginBottom: 0, backgroundColor: colors.card, borderRadius: radius.xxl, borderWidth: 1, borderColor: colors.cardBorder, padding: spacing.xl + 2 },
  summaryLeft:  { alignItems: 'center', gap: spacing.md - 2, justifyContent: 'center' },
  bigRating:    { color: colors.accent, fontSize: 48, fontWeight: typography.weight.regular, lineHeight: 54 },
  reviewCount:  { color: colors.textMuted, fontSize: typography.size.sm, marginTop: spacing.xxs },
  summaryRight: { flex: 1, gap: spacing.sm + 1, justifyContent: 'center' },
  barRow:       { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  barLabel:     { color: colors.textDim, fontSize: typography.size.caption, width: 10, textAlign: 'right' },
  barTrack:     { flex: 1, height: 5, backgroundColor: colors.cardHover, borderRadius: 0, overflow: 'hidden' },
  barFill:      { height: '100%', backgroundColor: colors.accent, borderRadius: 0 },
  barPct:       { color: colors.textDim, fontSize: typography.size.sm, width: 28, textAlign: 'right' },
  divider:      { height: 1, backgroundColor: colors.cardBorder, marginHorizontal: spacing.xl, marginVertical: spacing.xl },
  card:         { marginHorizontal: spacing.xl, marginBottom: spacing.md + 2, backgroundColor: colors.card, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.cardBorder, padding: spacing.xl },
  cardTop:      { flexDirection: 'row', gap: spacing.lg, marginBottom: spacing.md + 2 },
  avatar:       { width: 38, height: 38, borderRadius: 0, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  avatarTxt:    { fontSize: typography.size.heading3, fontWeight: typography.weight.regular },
  nom:          { color: colors.text, fontSize: typography.size.bodyLg, fontWeight: typography.weight.regular },
  date:         { color: colors.textDim, fontSize: typography.size.sm },
  noteBadge:    { backgroundColor: colors.cardHover, borderRadius: radius.sm, paddingHorizontal: spacing.sm + 1, paddingVertical: spacing.xxs + 1, borderWidth: 1, borderColor: colors.cardBorder, alignSelf: 'flex-start' },
  noteBadgeGood:{ backgroundColor: colors.greenSoft, borderColor: 'rgba(76,175,130,0.25)' },
  noteBadgeTxt: { color: colors.textMuted, fontSize: typography.size.sm },
  txt:          { color: colors.textMuted, fontSize: typography.size.bodyLg, fontWeight: typography.weight.regular, lineHeight: 20 },
  ctaWrap:      { margin: spacing.xl, gap: spacing.xl - 2 },
  ctaDivider:   { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  ctaDividerTxt:{ color: colors.textDim, fontSize: typography.size.caption },
  ctaBtn:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.md, backgroundColor: 'rgba(200,151,90,0.14)', borderRadius: radius.xl, borderWidth: 1, borderColor: 'rgba(200,151,90,0.4)', paddingVertical: spacing.xl - 2, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 0 }, elevation: 3 },
  ctaIcon:      { fontSize: typography.size.heading3 },
  ctaTxt:       { color: colors.text, fontSize: typography.size.subheading, fontWeight: typography.weight.regular },
});
