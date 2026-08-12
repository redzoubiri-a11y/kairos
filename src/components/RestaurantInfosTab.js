import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform } from 'react-native';
import { colors, typography, spacing, radius, shadows } from '../theme';
let MapView, Marker;
if (Platform.OS !== 'web') {
  const maps = require('react-native-maps');
  MapView = maps.default;
  Marker  = maps.Marker;
}

export function fmtHours(oh) {
  if (!oh) return null;
  if (typeof oh === 'string') return oh;
  if (!Array.isArray(oh) || oh.length === 0) return null;
  const hm = s => (s || '').replace(':', 'h');
  if (typeof oh[0].day === 'number') {
    const opens  = [...new Set(oh.map(d => d.open))];
    const closes = [...new Set(oh.map(d => d.close))];
    if (opens.length === 1 && closes.length === 1)
      return `Tous les jours  ${hm(opens[0])} – ${hm(closes[0])}`;
    const minOpen  = oh.reduce((mn, d) => d.open  < mn ? d.open  : mn, oh[0].open);
    const maxClose = oh.reduce((mx, d) => d.close > mx ? d.close : mx, oh[0].close);
    return `Lun–Sam  ${hm(minOpen)} – ${hm(maxClose)}`;
  }
  return oh.map(d => `${d.day}  ${hm(d.open)} – ${hm(d.close)}`).join('  ·  ');
}

// Horaires du jour (pas de fmtHours, qui résume toute la semaine) — pour le
// bandeau "Ouvert aujourd'hui" de la Fiche Restaurant. Le modèle de données
// actuel ne stocke qu'un seul créneau par jour (pas de split midi/soir) : on
// n'affiche donc pas l'exemple "12:00–15:00 · 19:00–23:00" de la maquette,
// qui suppose un modèle multi-créneaux inexistant côté données.
export function todaysHours(oh) {
  if (!oh || typeof oh === 'string' || !Array.isArray(oh) || oh.length === 0) return null;
  const day = new Date().getDay();
  const today = oh.find(d => d.day === day);
  if (!today) return null;
  const hm = s => (s || '').replace(':', 'h');
  return `${hm(today.open)} – ${hm(today.close)}`;
}

export function isOpenNow(oh) {
  if (!oh || typeof oh === 'string' || !Array.isArray(oh) || oh.length === 0) return null;
  const now = new Date();
  const day = now.getDay();
  const today = oh.find(d => d.day === day);
  if (!today) return null;
  const toMin = s => { const [h, m] = (s || '0:0').split(':').map(Number); return h * 60 + (m || 0); };
  const nowMin = now.getHours() * 60 + now.getMinutes();
  return nowMin >= toMin(today.open) && nowMin <= toMin(today.close);
}

function openInMaps(restaurant) {
  const query = restaurant.latitude && restaurant.longitude
    ? `${restaurant.latitude},${restaurant.longitude}`
    : restaurant.address || restaurant.quartier || restaurant.name;
  if (!query) return;
  Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`);
}

export default function RestaurantInfosTab({ restaurant, desc }) {
  const hasAddress = !!(restaurant.address || restaurant.quartier || (restaurant.latitude && restaurant.longitude));
  const hasCoords = !!(restaurant.latitude && restaurant.longitude);
  const rows = [
    { icon:'📍', label:'Adresse',      val: restaurant.address || restaurant.quartier || '—', onPress: hasAddress ? () => openInMaps(restaurant) : undefined },
    { icon:'🏙️', label:'Ville',        val: restaurant.city || '—' },
    { icon:'🍽️', label:'Cuisine',      val: (restaurant.cuisine_type || '—').replace(/_/g, ' ') },
    { icon:'🕐', label:'Horaires',     val: fmtHours(restaurant.opening_hours) || 'Non renseigné' },
    { icon:'📞', label:'Téléphone',    val: restaurant.phone || 'Non renseigné' },
    { icon:'💰', label:'Prix moyen',   val: restaurant.avg_ticket > 0 ? `${restaurant.avg_ticket.toLocaleString('fr-FR')} DA / pers.` : '—' },
    { icon:'🪑', label:'Capacité',     val: restaurant.capacity > 0 ? `${restaurant.capacity} couverts` : '—' },
  ];

  return (
    <>
      {!!desc && (
        <View style={s.descWrap}>
          <Text style={s.descTxt}>{desc}</Text>
        </View>
      )}

      {hasCoords && Platform.OS !== 'web' && (
        <TouchableOpacity style={s.mapWrap} activeOpacity={0.9} onPress={() => openInMaps(restaurant)}>
          <MapView
            style={StyleSheet.absoluteFill}
            initialRegion={{ latitude: restaurant.latitude, longitude: restaurant.longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 }}
            scrollEnabled={false}
            zoomEnabled={false}
            rotateEnabled={false}
            pitchEnabled={false}
            showsCompass={false}
            toolbarEnabled={false}
            pointerEvents="none"
          >
            <Marker coordinate={{ latitude: restaurant.latitude, longitude: restaurant.longitude }} tracksViewChanges={false}>
              <View style={[s.mapPin, shadows.mapPin]} />
            </Marker>
          </MapView>
        </TouchableOpacity>
      )}

      <View style={s.card}>
        {rows.map((row, i) => {
          const Row = row.onPress ? TouchableOpacity : View;
          return (
            <Row key={i} style={[s.row, i < rows.length - 1 && s.rowBorder]} onPress={row.onPress} activeOpacity={row.onPress ? 0.6 : 1}>
              <View style={s.iconWrap}>
                <Text style={s.icon}>{row.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.label}>{row.label.toUpperCase()}</Text>
                <Text style={[s.val, row.onPress && s.valLink]}>{row.val}</Text>
              </View>
              {!!row.onPress && <Text style={s.rowArrow}>›</Text>}
            </Row>
          );
        })}
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
  mapWrap:  { height: 120, marginHorizontal: spacing.xl, marginTop: spacing.xl, borderRadius: radius.xl - 2, overflow: 'hidden', backgroundColor: colors.cardHover },
  mapPin: {
    width: 26, height: 26, backgroundColor: colors.primary,
    borderTopLeftRadius: 13, borderTopRightRadius: 13, borderBottomRightRadius: 13, borderBottomLeftRadius: 0,
    transform: [{ rotate: '-45deg' }],
  },
  card:     { margin: spacing.xl, backgroundColor: colors.card, borderRadius: radius.xxl, borderWidth: 1, borderColor: colors.cardBorder, overflow: 'hidden' },
  row:      { flexDirection: 'row', alignItems: 'center', gap: spacing.xl - 2, paddingHorizontal: spacing.xl + 2, paddingVertical: spacing.xl - 2 },
  rowBorder:{ borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  iconWrap: { width: 32, height: 32, borderRadius: radius.md, backgroundColor: colors.cardHover, alignItems: 'center', justifyContent: 'center' },
  icon:     { fontSize: typography.size.heading2 },
  label:    { color: colors.textDim, fontSize: typography.size.xs, letterSpacing: 2, marginBottom: spacing.xxs },
  val:      { color: colors.text, fontSize: typography.size.bodyLg, fontWeight: typography.weight.regular },
  valLink:  { color: colors.primary },
  rowArrow: { color: colors.textDim, fontSize: 20 },
  note:     { marginHorizontal: spacing.xl, color: colors.textDim, fontSize: typography.size.caption, lineHeight: 17, fontStyle: 'italic' },
});
