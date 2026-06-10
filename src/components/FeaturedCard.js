import { TouchableOpacity, View, Text, Image, StyleSheet } from 'react-native';
import { Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing, radius } from '../theme';

const SW     = Dimensions.get('window').width;
const FEAT_W = SW * 0.78;
const FEAT_H = 270;

const CUISINE_EMOJI = {
  algerien: '🥘', mediterraneen: '🐟', fast_casual: '☕',
  italien: '🍕', japonais: '🍣', turc: '🍢', libanais: '🌿', francais: '🍷',
};

export default function FeaturedCard({ r, onPress, onReserve }) {
  const photo = r.photos?.[0];
  return (
    <View style={s.shadow}>
      <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.88}>
        {photo
          ? <Image source={{ uri: photo }} style={s.photo} resizeMode="cover" />
          : <View style={[s.photo, { backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' }]}>
              <Text style={{ fontSize: 60 }}>{CUISINE_EMOJI[r.cuisine_type] || '🍽️'}</Text>
            </View>
        }
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
          <View style={s.bottomRow}>
            <View style={s.infoBox}>
              <Text style={s.infoTag} numberOfLines={1}>
                {(r.cuisine_type || '').replace(/_/g, ' ')}
              </Text>
              {!!r.quartier && <Text style={s.infoQuartier} numberOfLines={1}>{r.quartier}</Text>}
              <Text style={s.infoName} numberOfLines={1}>{r.name}</Text>
            </View>
            <TouchableOpacity style={s.resaBtn} onPress={onReserve}>
              <LinearGradient colors={['#FF6B1A','#D93A00']} start={{x:0,y:0}} end={{x:1,y:0}} style={StyleSheet.absoluteFillObject} />
              <Text style={s.resaBtnTxt}>Réserver</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  shadow:     { marginRight: spacing.xl - 2 },
  card:       { width: FEAT_W, height: FEAT_H, borderRadius: 0, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(0,0,0,0.09)' },
  photo:      { ...StyleSheet.absoluteFillObject },
  content:    { flex: 1, justifyContent: 'space-between', padding: spacing.xl },
  topRow:     { flexDirection: 'row', justifyContent: 'space-between' },
  openPill:   { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 0, paddingHorizontal: spacing.lg, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(76,175,130,0.4)' },
  openDot:    { width: 6, height: 6, borderRadius: 0, backgroundColor: colors.green },
  openTxt:    { color: colors.green, fontSize: typography.size.sm, fontWeight: typography.weight.medium },
  ratingPill: { backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 0, paddingHorizontal: spacing.lg, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(200,120,96,0.5)' },
  ratingTxt:  { color: '#C87860', fontSize: typography.size.caption, fontWeight: typography.weight.semibold },
  bottomRow:    { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  infoBox:      { backgroundColor: 'rgba(0,0,0,0.40)', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: 2, maxWidth: '62%' },
  infoTag:      { color: 'rgba(255,255,255,0.65)', fontSize: typography.size.xs, letterSpacing: 1.5, textTransform: 'uppercase' },
  infoQuartier: { color: 'rgba(255,255,255,0.65)', fontSize: typography.size.xs },
  infoName:     { color: '#FFFFFF', fontSize: typography.size.body, fontWeight: typography.weight.medium },
  resaBtn:    { borderRadius: radius.lg, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  resaBtnTxt: { color: '#FFFFFF', fontSize: typography.size.body, fontWeight: typography.weight.semibold, letterSpacing: 0.3 },
});
