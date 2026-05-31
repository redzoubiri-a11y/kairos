import { useState } from 'react';
import { TouchableOpacity, View, Text, Image, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { colors, typography, spacing, radius } from '../theme';

const SW     = Dimensions.get('window').width;
const CARD_W = SW - 40;

const CUISINE_EMOJI = {
  algerien: '🥘', mediterraneen: '🐟', fast_casual: '☕',
  italien: '🍕', japonais: '🍣', turc: '🍢', libanais: '🌿', francais: '🍷',
};
const CARD_BG = ['#1A1006', '#0F1006', '#16100A', '#100616', '#060F16', '#160606'];

export default function ListCard({ r, rank, onPress, onReserve }) {
  const [idx, setIdx] = useState(0);
  const photos = r.photos?.length > 0 ? r.photos : null;
  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.85}>
      <View style={[s.hero, { backgroundColor: CARD_BG[rank % CARD_BG.length] }]}>
        {photos ? (
          <ScrollView
            horizontal pagingEnabled showsHorizontalScrollIndicator={false}
            style={StyleSheet.absoluteFill}
            onMomentumScrollEnd={e => setIdx(Math.round(e.nativeEvent.contentOffset.x / CARD_W))}
          >
            {photos.map((uri, i) => (
              <Image key={i} source={{ uri }} style={{ width: CARD_W, height: 200 }} resizeMode="cover" />
            ))}
          </ScrollView>
        ) : (
          <Text style={s.heroEmoji}>{CUISINE_EMOJI[r.cuisine_type] || '🍽️'}</Text>
        )}
        <View style={s.heroOverlay} />
        {photos?.length > 1 && (
          <View style={s.dots}>
            {photos.map((_, i) => <View key={i} style={[s.dot, i === idx && s.dotOn]} />)}
          </View>
        )}
        <View style={s.rankBadge}><Text style={s.rankTxt}>#{rank + 1}</Text></View>
        {(r.avg_rating || 0) >= 4.5 && (
          <View style={s.topBadge}><Text style={s.topBadgeTxt}>⭐ Top</Text></View>
        )}
        <View style={s.openBadge}>
          <View style={s.openDot} /><Text style={s.openTxt}>Ouvert</Text>
        </View>
      </View>
      <View style={s.body}>
        <View style={s.bodyTop}>
          <Text style={s.tag}>
            {(r.cuisine_type || '').toUpperCase().replace(/_/g, ' ')}
            {r.quartier ? '  ·  ' + r.quartier : ''}
          </Text>
          <Text style={s.name} numberOfLines={1}>{r.name}</Text>
          <View style={s.meta}>
            <Text style={s.ratingVal}>★ {r.avg_rating > 0 ? Number(r.avg_rating).toFixed(1) : '—'}</Text>
            {r.review_count > 0 && <Text style={s.reviews}>({r.review_count} avis)</Text>}
            <View style={s.dot2} />
            <Text style={s.price}>{r.avg_ticket > 0 ? r.avg_ticket.toLocaleString('fr-FR') + ' DA' : '—'}</Text>
          </View>
        </View>
        <View style={s.footer}>
          <View style={s.chips}>
            <View style={s.chip}><Text style={s.chipTxt}>📱 En ligne</Text></View>
            <View style={s.chip}><Text style={s.chipTxt}>⚡ ~20 min</Text></View>
          </View>
          <TouchableOpacity style={s.resaBtn} onPress={onReserve}>
            <Text style={s.resaBtnTxt}>Réserver →</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  card:        { marginHorizontal: spacing.xl, marginBottom: spacing.xl - 4, backgroundColor: colors.card, borderRadius: radius.xxl, borderWidth: 1, borderColor: colors.cardBorder, overflow: 'hidden' },
  hero:        { width: CARD_W, height: 200, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  heroEmoji:   { fontSize: 56 },
  heroOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, backgroundColor: 'rgba(15,13,11,0.6)' },
  dots:        { position: 'absolute', bottom: spacing.lg, flexDirection: 'row', gap: 4, alignSelf: 'center' },
  dot:         { width: 5, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.35)' },
  dotOn:       { backgroundColor: colors.text, width: 16 },
  rankBadge:   { position: 'absolute', top: spacing.lg, right: spacing.lg, backgroundColor: 'rgba(15,13,11,0.85)', borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderWidth: 1, borderColor: colors.cardBorder },
  rankTxt:     { color: colors.textDim, fontSize: typography.size.caption, fontWeight: typography.weight.bold },
  topBadge:    { position: 'absolute', top: spacing.lg, left: spacing.lg, backgroundColor: colors.accentSoft, borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderWidth: 1, borderColor: 'rgba(232,160,69,0.35)' },
  topBadgeTxt: { color: colors.accent, fontSize: typography.size.sm, fontWeight: typography.weight.semibold },
  openBadge:   { position: 'absolute', bottom: spacing.lg, left: spacing.lg, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(15,13,11,0.85)', borderRadius: 100, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, gap: 5, borderWidth: 1, borderColor: 'rgba(76,175,130,0.3)' },
  openDot:     { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.green },
  openTxt:     { color: colors.green, fontSize: typography.size.sm, fontWeight: typography.weight.medium },
  body:        { padding: spacing.xl, gap: spacing.xl - 2 },
  bodyTop:     { gap: spacing.xs },
  tag:         { color: colors.accent, fontSize: typography.size.xs, letterSpacing: 2.5, fontWeight: typography.weight.medium },
  name:        { color: colors.text, fontSize: typography.size.heading2, fontWeight: typography.weight.medium, letterSpacing: 0.2 },
  meta:        { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  ratingVal:   { color: colors.accent, fontSize: typography.size.body, fontWeight: typography.weight.semibold },
  reviews:     { color: colors.textDim, fontSize: typography.size.caption },
  dot2:        { width: 3, height: 3, borderRadius: 2, backgroundColor: colors.textDim },
  price:       { color: colors.textMuted, fontSize: typography.size.body },
  footer:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  chips:       { flexDirection: 'row', gap: spacing.sm },
  chip:        { backgroundColor: colors.blueSoft, borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderWidth: 1, borderColor: 'rgba(90,155,224,0.2)' },
  chipTxt:     { color: colors.blue, fontSize: typography.size.sm },
  resaBtn:     { backgroundColor: colors.accent, borderRadius: radius.lg, paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
  resaBtnTxt:  { color: colors.bg, fontSize: typography.size.body, fontWeight: typography.weight.bold },
});
