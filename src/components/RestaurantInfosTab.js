import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, radius } from '../theme';

export default function RestaurantInfosTab({ restaurant, desc }) {
  const rows = [
    { icon:'📍', label:'Adresse',      val: restaurant.address || restaurant.quartier || '—' },
    { icon:'🏙️', label:'Ville',        val: restaurant.city || '—' },
    { icon:'🍽️', label:'Cuisine',      val: (restaurant.cuisine_type || '—').replace(/_/g, ' ') },
    { icon:'🕐', label:'Horaires',     val: restaurant.opening_hours || '12h00 – 14h30  ·  19h00 – 22h30' },
    { icon:'📞', label:'Téléphone',    val: restaurant.phone || 'Non renseigné' },
    { icon:'💰', label:'Prix moyen',   val: restaurant.avg_ticket > 0 ? `${restaurant.avg_ticket.toLocaleString('fr-FR')} DA / pers.` : '—' },
    { icon:'🪑', label:'Capacité',     val: restaurant.capacity > 0 ? `${restaurant.capacity} couverts` : '—' },
    { icon:'🅿️', label:'Parking',      val: 'Disponible à proximité' },
    { icon:'♿', label:'Accessibilité', val: 'Accessible PMR' },
  ];

  return (
    <>
      {!!desc && (
        <View style={s.descWrap}>
          <Text style={s.descTxt}>{desc}</Text>
        </View>
      )}

      <View style={s.card}>
        {rows.map((row, i) => (
          <View key={i} style={[s.row, i < rows.length - 1 && s.rowBorder]}>
            <View style={s.iconWrap}>
              <Text style={s.icon}>{row.icon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.label}>{row.label.toUpperCase()}</Text>
              <Text style={s.val}>{row.val}</Text>
            </View>
          </View>
        ))}
      </View>

      <Text style={s.note}>
        Informations susceptibles de varier. Vérifiez directement auprès du restaurant pour confirmer les horaires et la disponibilité.
      </Text>

      <View style={{ height: 40 }} />
    </>
  );
}

const s = StyleSheet.create({
  descWrap: { marginHorizontal: spacing.xl, marginTop: spacing.xl, marginBottom: spacing.sm, backgroundColor: colors.card, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.cardBorder, padding: spacing.xl },
  descTxt:  { color: colors.textMuted, fontSize: typography.size.bodyLg, lineHeight: 22, fontWeight: typography.weight.regular },
  card:     { margin: spacing.xl, backgroundColor: colors.card, borderRadius: radius.xxl, borderWidth: 1, borderColor: colors.cardBorder, overflow: 'hidden' },
  row:      { flexDirection: 'row', alignItems: 'center', gap: spacing.xl - 2, paddingHorizontal: spacing.xl + 2, paddingVertical: spacing.xl - 2 },
  rowBorder:{ borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  iconWrap: { width: 32, height: 32, borderRadius: radius.md, backgroundColor: colors.cardHover, alignItems: 'center', justifyContent: 'center' },
  icon:     { fontSize: typography.size.heading2 },
  label:    { color: colors.textDim, fontSize: typography.size.xs, letterSpacing: 2, marginBottom: spacing.xxs },
  val:      { color: colors.text, fontSize: typography.size.bodyLg, fontWeight: typography.weight.regular },
  note:     { marginHorizontal: spacing.xl, color: colors.textDim, fontSize: typography.size.caption, lineHeight: 17, fontStyle: 'italic' },
});
