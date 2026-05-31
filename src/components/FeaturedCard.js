import { TouchableOpacity, View, Text, Image, StyleSheet } from 'react-native';
import { Dimensions } from 'react-native';
import { colors, typography, spacing, radius } from '../theme';

const SW     = Dimensions.get('window').width;
const FEAT_W = SW * 0.78;
const FEAT_H = 260;

const CUISINE_EMOJI = {
  algerien: '🥘', mediterraneen: '🐟', fast_casual: '☕',
  italien: '🍕', japonais: '🍣', turc: '🍢', libanais: '🌿', francais: '🍷',
};

export default function FeaturedCard({ r, onPress, onReserve }) {
  const photo = r.photos?.[0];
  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.88}>
      {photo
        ? <Image source={{ uri: photo }} style={s.photo} resizeMode="cover" />
        : <View style={[s.photo, { backgroundColor: '#1A1006', alignItems: 'center', justifyContent: 'center' }]}>
            <Text style={{ fontSize: 60 }}>{CUISINE_EMOJI[r.cuisine_type] || '🍽️'}</Text>
          </View>
      }
      <View style={[s.overlay, { opacity: 0.22 }]} />
      <View style={s.overlayBottom} />
      <View style={s.content}>
        <View style={s.topRow}>
          <View style={s.openPill}>
            <View style={s.openDot} />
            <Text style={s.openTxt}>Ouvert</Text>
          </View>
          {r.avg_rating > 0 && (
            <View style={s.ratingPill}>
              <Text style={s.ratingTxt}>★ {Number(r.avg_rating).toFixed(1)}</Text>
            </View>
          )}
        </View>
        <View style={s.bottom}>
          <Text style={s.tag}>
            {(r.cuisine_type || '').toUpperCase().replace(/_/g, ' ')}
            {r.quartier ? '  ·  ' + r.quartier : ''}
          </Text>
          <Text style={s.name} numberOfLines={1}>{r.name}</Text>
          <View style={s.footRow}>
            <Text style={s.price}>
              {r.avg_ticket > 0 ? '~' + r.avg_ticket.toLocaleString('fr-FR') + ' DA' : ''}
            </Text>
            <TouchableOpacity style={s.resaBtn} onPress={onReserve}>
              <Text style={s.resaBtnTxt}>Réserver</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  card:          { width: FEAT_W, height: FEAT_H, borderRadius: radius.xxl, overflow: 'hidden', marginRight: spacing.xl - 2, backgroundColor: colors.card },
  photo:         { ...StyleSheet.absoluteFillObject },
  overlay:       { ...StyleSheet.absoluteFillObject, backgroundColor: '#000' },
  overlayBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, height: FEAT_H * 0.62, backgroundColor: 'rgba(15,13,11,0.88)' },
  content:       { flex: 1, justifyContent: 'space-between', padding: spacing.xl },
  topRow:        { flexDirection: 'row', justifyContent: 'space-between' },
  openPill:      { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(15,13,11,0.8)', borderRadius: 100, paddingHorizontal: spacing.lg, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(76,175,130,0.4)' },
  openDot:       { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.green },
  openTxt:       { color: colors.green, fontSize: typography.size.sm, fontWeight: typography.weight.medium },
  ratingPill:    { backgroundColor: 'rgba(15,13,11,0.8)', borderRadius: 100, paddingHorizontal: spacing.lg, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(232,160,69,0.4)' },
  ratingTxt:     { color: colors.accent, fontSize: typography.size.caption, fontWeight: typography.weight.semibold },
  bottom:        { gap: 5 },
  tag:           { color: 'rgba(232,160,69,0.8)', fontSize: typography.size.xs, letterSpacing: 2.5, fontWeight: typography.weight.medium },
  name:          { color: colors.text, fontSize: typography.size.title, fontWeight: typography.weight.regular, letterSpacing: 0.3 },
  footRow:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.md },
  price:         { color: colors.textMuted, fontSize: typography.size.caption },
  resaBtn:       { backgroundColor: colors.accent, borderRadius: radius.lg, paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
  resaBtnTxt:    { color: colors.bg, fontSize: typography.size.body, fontWeight: typography.weight.bold },
});
