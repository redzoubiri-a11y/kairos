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
          <Text style={s.editTxt}>✏️  Modifier</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.toggleBtn, dish.is_available ? s.toggleRed : s.toggleGreen]}
          onPress={onToggle}
          disabled={acting}
          activeOpacity={0.7}
        >
          <Text style={[s.toggleTxt, dish.is_available ? s.toggleTxtRed : s.toggleTxtGreen]}>
            {acting ? '···' : dish.is_available ? '⏸  Indisponible' : '▶  Disponible'}
          </Text>
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
  price:         { color: colors.accent, fontSize: typography.size.subheading, fontWeight: typography.weight.bold, flexShrink: 0 },
  indispoBadge:  { backgroundColor: colors.redSoft, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xxs, borderWidth: 1, borderColor: 'rgba(224,90,90,0.3)' },
  indispoTxt:    { color: colors.red, fontSize: typography.size.xs, fontWeight: typography.weight.semibold },
  dotdBadge:     { backgroundColor: colors.accentSoft, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xxs, borderWidth: 1, borderColor: 'rgba(232,160,69,0.3)' },
  dotdTxt:       { color: colors.accent, fontSize: typography.size.xs, fontWeight: typography.weight.semibold },
  actions:       { flexDirection: 'row', gap: spacing.md },
  editBtn:       { flex: 1, alignItems: 'center', paddingVertical: spacing.md, borderRadius: radius.lg, backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: 'rgba(232,160,69,0.25)' },
  editTxt:       { color: colors.accent, fontSize: typography.size.body, fontWeight: typography.weight.semibold },
  toggleBtn:     { flex: 1, alignItems: 'center', paddingVertical: spacing.md, borderRadius: radius.lg },
  toggleRed:     { backgroundColor: colors.redSoft, borderWidth: 1, borderColor: 'rgba(224,90,90,0.25)' },
  toggleGreen:   { backgroundColor: colors.greenSoft, borderWidth: 1, borderColor: 'rgba(76,175,130,0.25)' },
  toggleTxt:     { fontSize: typography.size.body, fontWeight: typography.weight.semibold },
  toggleTxtRed:  { color: colors.red },
  toggleTxtGreen:{ color: colors.green },
});
