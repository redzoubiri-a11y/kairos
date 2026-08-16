import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing, radius } from '../theme';
import { CUISINE_OPTIONS } from '../hooks/useProInfo';

const CUISINE_LABELS = Object.fromEntries(CUISINE_OPTIONS.map(o => [o.value, o.label]));

// Carte liste compacte de l'Accueil ("Les plus consultés") — photo carrée à
// gauche, infos à droite, motif horizontal de l'app Tabelog (pas la grande
// photo pleine largeur des cartes Explorer/Recherche).
export default function HomeListRow({ r, onPress }) {
  const rating = r.avg_rating > 0 ? Number(r.avg_rating).toFixed(1).replace('.', ',') : null;
  const starCount = r.avg_rating > 0 ? Math.max(1, Math.min(5, Math.round(r.avg_rating))) : 0;
  const meta = [CUISINE_LABELS[r.cuisine_type] || r.cuisine_type, r.quartier, r.avg_ticket > 0 ? `${r.avg_ticket.toLocaleString('fr-FR')} DA` : null]
    .filter(Boolean).join(' · ');

  return (
    <TouchableOpacity style={s.row} onPress={onPress} activeOpacity={0.85}>
      {r.photos?.[0] ? (
        <Image source={{ uri: r.photos[0] }} style={s.photo} resizeMode="cover" />
      ) : (
        <LinearGradient colors={colors.photoFallbackGradient} style={s.photo} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
      )}
      <View style={s.info}>
        <Text style={s.name} numberOfLines={1}>{r.name}</Text>
        {rating && (
          <View style={s.rateRow}>
            <Text style={s.stars}>{'★'.repeat(starCount)}</Text>
            <Text style={s.scoreNum}>{rating}</Text>
          </View>
        )}
        {!!meta && <Text style={s.meta} numberOfLines={1}>{meta}</Text>}
      </View>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  row:   { flexDirection: 'row', gap: spacing.lg, paddingVertical: spacing.lg - 1, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  photo: { width: 74, height: 74, borderRadius: radius.sm + 5, flexShrink: 0 },
  info:  { flex: 1, minWidth: 0, justifyContent: 'center' },
  name:  { fontFamily: typography.display, fontSize: typography.size.subheading - 0.5, color: colors.text },
  rateRow:   { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  stars:     { color: colors.star, fontSize: 10, letterSpacing: 1 },
  scoreNum:  { fontFamily: typography.display, fontSize: typography.size.caption, color: colors.text },
  meta:      { fontFamily: typography.body, fontSize: typography.size.caption, color: colors.textMuted, marginTop: 3 },
});
