import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { colors, typography, spacing, radius } from '../theme';

export default function DishCard({ dish, onEdit, onToggle, acting }) {
  const dimmed = !dish.is_available;
  return (
    <View style={s.card}>
      <View style={s.top}>
        {dish.photo ? (
          <Image source={{ uri: dish.photo }} style={s.photo} resizeMode="cover" />
        ) : null}
        <View style={{ flex: 1, gap: spacing.xxs }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' }}>
            <Text style={[s.name, dimmed && s.nameDim]}>{dish.name}</Text>
            {!dish.is_available && (
              <View style={s.indispoBadge}>
                <Text style={s.indispoTxt}>Indispo</Text>
              </View>
            )}
            {dish.is_dish_of_day && (
              <View style={s.dotdBadge}>
                <Text style={s.dotdTxt}>⭐ Plat du jour</Text>
              </View>
            )}
          </View>
          {!!dish.description && (
            <Text style={s.desc} numberOfLines={2}>{dish.description}</Text>
          )}
        </View>
        <Text style={s.price}>
          {dish.price ? `${Number(dish.price).toLocaleString('fr-FR')} DA` : '—'}
        </Text>
      </View>
      <View style={s.actions}>
        <TouchableOpacity style={s.editBtn} onPress={onEdit} activeOpacity={0.7}>
          <Text style={s.editTxt}>Modifier</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.switchTrack, dish.is_available && s.switchTrackOn, acting && { opacity: 0.5 }]}
          onPress={onToggle}
          disabled={acting}
          activeOpacity={0.8}
        >
          <View style={[s.switchThumb, dish.is_available && s.switchThumbOn]} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card:          { backgroundColor: colors.card, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.cardBorder, padding: spacing.xl, marginBottom: spacing.lg, gap: spacing.lg },
  top:           { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.lg },
  photo:         { width: 72, height: 72, borderRadius: radius.lg, backgroundColor: colors.cardHover, flexShrink: 0 },
  name:          { color: colors.text, fontSize: typography.size.subheading, fontWeight: typography.weight.medium },
  nameDim:       { color: colors.textDim },
  desc:          { color: colors.textDim, fontSize: typography.size.caption, lineHeight: 16 },
  price:         { color: colors.primary, fontSize: typography.size.subheading, fontWeight: typography.weight.bold, flexShrink: 0 },
  indispoBadge:  { backgroundColor: colors.redSoft, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xxs, borderWidth: 1, borderColor: 'rgba(224,90,90,0.3)' },
  indispoTxt:    { color: colors.red, fontSize: typography.size.xs, fontWeight: typography.weight.semibold },
  dotdBadge:     { backgroundColor: colors.goldSoft, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xxs, borderWidth: 1, borderColor: 'rgba(200,151,90,0.3)' },
  dotdTxt:       { color: colors.gold, fontSize: typography.size.xs, fontWeight: typography.weight.semibold },
  actions:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  editBtn:       { paddingHorizontal: spacing.xl, alignItems: 'center', paddingVertical: spacing.md, borderRadius: radius.lg, backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.blue },
  editTxt:       { color: colors.blue, fontSize: typography.size.body, fontWeight: typography.weight.semibold },
  // Switch compact de disponibilité — Menu Pro.dc.html : piste 38×22 radius 11, pastille 18×18 inset 2
  switchTrack:    { width: 38, height: 22, borderRadius: 11, backgroundColor: colors.cardBorder, justifyContent: 'center' },
  switchTrackOn:  { backgroundColor: colors.primary },
  switchThumb:    { width: 18, height: 18, borderRadius: 9, backgroundColor: '#FFFFFF', marginLeft: 2 },
  switchThumbOn:  { marginLeft: 18 },
});
