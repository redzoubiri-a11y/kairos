import { useState } from 'react';
import { TouchableOpacity, View, Text, Image, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { colors, typography, spacing, radius } from '../theme';

const SW     = Dimensions.get('window').width;
const CARD_W = SW - 40;

const CUISINE_EMOJI = {
  algerien: '🥘', mediterraneen: '🐟', fast_casual: '☕',
  italien: '🍕', japonais: '🍣', turc: '🍢', libanais: '🌿', francais: '🍷',
};

export default function ListCard({ r, rank, onPress, onReserve }) {
  const [idx, setIdx] = useState(0);
  const photos = r.photos?.length > 0 ? r.photos : null;
  return (
    <View style={s.shadow}>
      <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.85}>
        {/* Image hero */}
        <View style={s.hero}>
          {photos ? (
            <ScrollView
              horizontal pagingEnabled showsHorizontalScrollIndicator={false}
              style={StyleSheet.absoluteFill}
              onMomentumScrollEnd={e => setIdx(Math.round(e.nativeEvent.contentOffset.x / CARD_W))}
            >
              {photos.map((uri, i) => (
                <Image key={i} source={{ uri }} style={{ width: CARD_W, height: 220 }} resizeMode="cover" />
              ))}
            </ScrollView>
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' }]}>
              <Text style={s.heroEmoji}>{CUISINE_EMOJI[r.cuisine_type] || '🍽️'}</Text>
            </View>
          )}
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

        {/* Corps carte */}
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
    </View>
  );
}

const s = StyleSheet.create({
  shadow:      { marginHorizontal: spacing.xl, marginBottom: spacing.xl },
  card:        { backgroundColor: colors.bg, borderRadius: radius.card, borderWidth: 1, borderColor: colors.separator, overflow: 'hidden' },
  hero:        { width: CARD_W, height: 220, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', backgroundColor: colors.card },
  heroEmoji:   { fontSize: 56 },
  dots:        { position: 'absolute', bottom: spacing.lg, flexDirection: 'row', gap: 4, alignSelf: 'center' },
  dot:         { width: 5, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)' },
  dotOn:       { backgroundColor: '#FFFFFF', width: 16 },
  rankBadge:   { position: 'absolute', top: spacing.lg, right: spacing.lg, backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  rankTxt:     { color: 'rgba(255,255,255,0.8)', fontSize: typography.size.caption, fontWeight: typography.weight.bold },
  topBadge:    { position: 'absolute', top: spacing.lg, left: spacing.lg, backgroundColor: colors.halalBg, borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderWidth: 1, borderColor: colors.halalBorder },
  topBadgeTxt: { color: colors.primary, fontSize: typography.size.sm, fontWeight: typography.weight.semibold },
  openBadge:   { position: 'absolute', bottom: spacing.lg, left: spacing.lg, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, gap: 5, borderWidth: 1, borderColor: 'rgba(76,175,130,0.35)' },
  openDot:     { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.green },
  openTxt:     { color: colors.green, fontSize: typography.size.sm, fontWeight: typography.weight.medium },
  body:        { padding: spacing.xl, gap: spacing.xl - 2, backgroundColor: colors.bg },
  bodyTop:     { gap: spacing.xs },
  tag:         { color: colors.textSecondary, fontSize: typography.size.xs, letterSpacing: 2, fontWeight: typography.weight.medium },
  name:        { color: colors.text, fontSize: typography.size.heading2, fontWeight: typography.weight.medium, letterSpacing: 0.2 },
  meta:        { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  ratingVal:   { color: colors.star, fontSize: typography.size.body, fontWeight: typography.weight.semibold },
  reviews:     { color: colors.textTertiary, fontSize: typography.size.caption },
  dot2:        { width: 3, height: 3, borderRadius: 2, backgroundColor: colors.textTertiary },
  price:       { color: colors.primary, fontSize: typography.size.body, fontWeight: typography.weight.semibold },
  footer:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  chips:       { flexDirection: 'row', gap: spacing.sm },
  chip:        { backgroundColor: colors.halalBg, borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderWidth: 1, borderColor: colors.halalBorder },
  chipTxt:     { color: colors.textSecondary, fontSize: typography.size.sm },
  resaBtn:     { borderRadius: radius.card, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary },
  resaBtnTxt:  { color: colors.bg, fontSize: typography.size.body, fontWeight: typography.weight.semibold, letterSpacing: 0.3 },
});
