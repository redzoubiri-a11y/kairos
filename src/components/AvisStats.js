import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, radius } from '../theme';
import { STARS } from '../hooks/useProAvis';

export default function AvisStats({ reviews }) {
  if (!reviews.length) return null;

  const avg       = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  const dist      = STARS.map(s => ({ star: s, count: reviews.filter(r => r.rating === s).length })).reverse();
  const max       = Math.max(...dist.map(d => d.count), 1);
  const responded = reviews.filter(r => r.pro_response).length;

  return (
    <View style={s.wrap}>
      <View style={s.scoreRow}>
        <View style={s.scoreLeft}>
          <Text style={s.scoreNum}>{avg.toFixed(1)}</Text>
          <Text style={s.scoreStar}>{'★'.repeat(Math.round(avg))}{'☆'.repeat(5 - Math.round(avg))}</Text>
          <Text style={s.scoreCount}>{reviews.length} avis certifiés</Text>
        </View>
        <View style={s.barBlock}>
          {dist.map(d => (
            <View key={d.star} style={s.barRow}>
              <Text style={s.barLabel}>{d.star}★</Text>
              <View style={s.barTrack}>
                <View style={[s.barFill, {
                  width: `${Math.round((d.count / max) * 100)}%`,
                  backgroundColor: d.star >= 4 ? colors.green : d.star === 3 ? colors.accent : colors.red,
                }]} />
              </View>
              <Text style={s.barCount}>{d.count}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={s.responseRow}>
        <View style={{ flex: 1 }}>
          <Text style={s.responseLabel}>Taux de réponse</Text>
          <View style={s.responseTrack}>
            <View style={[s.responseFill, { width: `${Math.round((responded / reviews.length) * 100)}%` }]} />
          </View>
        </View>
        <Text style={s.responseVal}>{Math.round((responded / reviews.length) * 100)}%</Text>
      </View>
      {responded < reviews.length && (
        <Text style={s.responseTip}>💡 {reviews.length - responded} avis sans réponse — réponds pour booster ta visibilité</Text>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  wrap:          { marginHorizontal: spacing.xl, marginBottom: spacing.lg, backgroundColor: colors.card, borderRadius: radius.xxl, borderWidth: 1, borderColor: colors.cardBorder, padding: spacing.xl, gap: spacing.lg },
  scoreRow:      { flexDirection: 'row', gap: spacing.xl },
  scoreLeft:     { alignItems: 'center', justifyContent: 'center', gap: spacing.xs, minWidth: 70 },
  scoreNum:      { color: colors.text, fontSize: 36, fontWeight: '200', lineHeight: 38 },
  scoreStar:     { color: colors.accent, fontSize: typography.size.body, letterSpacing: 1 },
  scoreCount:    { color: colors.textDim, fontSize: typography.size.xs, textAlign: 'center', marginTop: spacing.xxs },
  barBlock:      { flex: 1, gap: spacing.xs },
  barRow:        { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  barLabel:      { color: colors.textDim, fontSize: typography.size.xs, width: 22, textAlign: 'right' },
  barTrack:      { flex: 1, height: 6, backgroundColor: colors.cardHover || colors.bg, borderRadius: 0 },
  barFill:       { height: 6, borderRadius: 0, minWidth: 2 },
  barCount:      { color: colors.textMuted, fontSize: typography.size.xs, width: 16 },
  responseRow:   { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  responseLabel: { color: colors.textMuted, fontSize: typography.size.caption, marginBottom: spacing.xs },
  responseTrack: { height: 5, backgroundColor: colors.cardBorder, borderRadius: 0, overflow: 'hidden' },
  responseFill:  { height: 5, backgroundColor: colors.green, borderRadius: 0 },
  responseVal:   { color: colors.green, fontSize: typography.size.subheading, fontWeight: typography.weight.medium, minWidth: 36, textAlign: 'right' },
  responseTip:   { color: colors.accent, fontSize: typography.size.caption },
});
