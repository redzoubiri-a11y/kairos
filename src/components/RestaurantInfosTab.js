import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform } from 'react-native';
import { colors, typography, spacing, radius, shadows } from '../theme';
export { todaysHours, isOpenNow } from '../utils/openingHours';
import { fmtHours, hoursFromSchedule, mvpSlots, slotsFromSchedule, nextDays } from '../utils/openingHours';
let MapView, Marker;
if (Platform.OS !== 'web') {
  const maps = require('react-native-maps');
  MapView = maps.default;
  Marker  = maps.Marker;
}

const DATES = nextDays(5);

function openInMaps(restaurant) {
  const query = restaurant.latitude && restaurant.longitude
    ? `${restaurant.latitude},${restaurant.longitude}`
    : restaurant.address || restaurant.quartier || restaurant.name;
  if (!query) return;
  Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`);
}

export default function RestaurantInfosTab({
  restaurant, desc, scheduleMap = null,
  selectedDateIdx = 0, onSelectDate, selectedSlot, onSelectSlot,
}) {
  const hasCoords = !!(restaurant.latitude && restaurant.longitude);
  const dayOfWeek = DATES[selectedDateIdx]?.day;
  // Les services déclarés par le restaurateur priment : eux seuls connaissent la
  // coupure midi/soir. L'amplitude d'`opening_hours` ne sert plus que de repli
  // pour les fiches sans ligne dans `restaurant_schedules`.
  const daySchedule = scheduleMap?.[dayOfWeek];
  const isToday = selectedDateIdx === 0;
  const slotsFor = today => daySchedule
    ? slotsFromSchedule(daySchedule, today)
    : mvpSlots(restaurant.opening_hours, dayOfWeek, today);
  const slots = slotsFor(isToday);
  // Sur aujourd'hui, les créneaux déjà écoulés sont retirés (la fiche proposait
  // encore 13:30 à 21 h). Une journée vide n'est alors plus forcément une
  // fermeture : on relit la liste non filtrée pour ne pas annoncer « fermé » un
  // jour où le service est simplement terminé.
  const ferme = slots.length === 0 && (!isToday || slotsFor(false).length === 0);

  const infoRows = [
    { icon: '💰', label: 'Prix moyen', val: restaurant.avg_ticket > 0 ? `${restaurant.avg_ticket.toLocaleString('fr-FR')} DA / pers.` : null },
    { icon: '📍', label: 'Adresse', val: restaurant.address || restaurant.quartier || null, onPress: () => openInMaps(restaurant) },
    { icon: '📞', label: 'Téléphone', val: restaurant.phone || null },
    // Les services déclarés priment ici aussi : opening_hours ne sait pas dire
    // « 12h – 16h · 19h – 23h » et affichait l'amplitude, coupure comprise.
    { icon: '🕐', label: 'Horaires', val: hoursFromSchedule(scheduleMap) || fmtHours(restaurant.opening_hours) || null },
  ].filter(r => r.val);

  return (
    <View style={s.wrap}>
      {/* Réservation en ligne — bande de dates + créneaux MVP (pas de vraie
          vérification de disponibilité, cf. plan du lot validé le 16/08/2026) */}
      <Text style={s.sectionTitle}>Réservation en ligne</Text>
      <View style={s.dateStrip}>
        {DATES.map((d, i) => (
          <TouchableOpacity
            key={i}
            style={[s.dateCell, i === selectedDateIdx && s.dateCellOn]}
            onPress={() => { onSelectDate?.(i); onSelectSlot?.(null); }}
          >
            <Text style={[s.dateDow, i === selectedDateIdx && s.dateTxtOn]}>{d.dow}</Text>
            <Text style={[s.dateNum, i === selectedDateIdx && s.dateTxtOn]}>{d.num}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {slots.length > 0 ? (
        <View style={s.slots}>
          {slots.map(slot => (
            <TouchableOpacity
              key={slot}
              style={[s.slot, slot === selectedSlot && s.slotOn]}
              onPress={() => onSelectSlot?.(slot)}
            >
              <Text style={[s.slotTxt, slot === selectedSlot && s.slotTxtOn]}>{slot}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <Text style={s.slotsEmpty}>
          {ferme ? 'Fermé ce jour-là' : 'Plus de créneau aujourd’hui'}
        </Text>
      )}

      {infoRows.length > 0 && (
        <>
          <Text style={s.sectionTitle}>Infos pratiques</Text>
          <View style={s.infoCard}>
            {infoRows.map((row, i) => {
              const Row = row.onPress ? TouchableOpacity : View;
              return (
                <Row key={row.label} style={[s.infoRow, i > 0 && s.infoRowBorder]} onPress={row.onPress} activeOpacity={0.6}>
                  <View style={s.infoIcon}><Text>{row.icon}</Text></View>
                  <Text style={s.infoTxt}>{row.label} · <Text style={s.infoTxtB}>{row.val}</Text></Text>
                </Row>
              );
            })}
          </View>
        </>
      )}

      {hasCoords && Platform.OS !== 'web' && (
        <TouchableOpacity style={s.mapWrap} activeOpacity={0.9} onPress={() => openInMaps(restaurant)}>
          <MapView
            style={StyleSheet.absoluteFill}
            initialRegion={{ latitude: restaurant.latitude, longitude: restaurant.longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 }}
            scrollEnabled={false} zoomEnabled={false} rotateEnabled={false} pitchEnabled={false}
            showsCompass={false} toolbarEnabled={false} pointerEvents="none"
          >
            <Marker coordinate={{ latitude: restaurant.latitude, longitude: restaurant.longitude }} tracksViewChanges={false}>
              <View style={[s.mapPin, shadows.mapPin]} />
            </Marker>
          </MapView>
        </TouchableOpacity>
      )}

      {!!desc && (
        <>
          <Text style={s.sectionTitle}>À propos</Text>
          <Text style={s.desc}>{desc}</Text>
        </>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { paddingHorizontal: spacing.xl },
  sectionTitle: { fontFamily: typography.display, fontSize: typography.size.heading3, color: colors.text, marginTop: spacing.xxl - 4, marginBottom: spacing.lg - 2 },

  dateStrip: { flexDirection: 'row', gap: spacing.sm - 2 },
  dateCell:  { flex: 1, alignItems: 'center', paddingVertical: spacing.sm + 1, borderRadius: radius.md, borderWidth: 1, borderColor: colors.cardBorder },
  dateCellOn:{ backgroundColor: colors.noir, borderColor: colors.noir },
  dateDow:   { fontFamily: typography.bodyBold, fontSize: typography.size.xs, color: colors.textDim },
  dateNum:   { fontFamily: typography.display, fontSize: typography.size.body, color: colors.text, marginTop: 2 },
  dateTxtOn: { color: colors.card },

  slots: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.lg - 2 },
  slot:  { paddingHorizontal: spacing.xl - 2, paddingVertical: spacing.sm + 1, borderRadius: radius.md, backgroundColor: colors.primary },
  slotOn:{ backgroundColor: colors.noir },
  slotTxt: { fontFamily: typography.bodyBold, fontSize: typography.size.caption + 0.5, color: colors.card },
  slotTxtOn: { color: colors.card },
  slotsEmpty: { fontFamily: typography.body, fontSize: typography.size.body, color: colors.textDim, marginTop: spacing.lg - 2 },

  infoCard: { backgroundColor: colors.bg, borderRadius: radius.lg, paddingHorizontal: spacing.lg + 2 },
  infoRow:  { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, paddingVertical: spacing.lg - 1 },
  infoRowBorder: { borderTopWidth: 1, borderTopColor: colors.cardBorder },
  infoIcon: { width: 30, height: 30, borderRadius: radius.sm + 2, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, alignItems: 'center', justifyContent: 'center' },
  infoTxt:  { fontFamily: typography.body, fontSize: typography.size.body, color: colors.text, flex: 1 },
  infoTxtB: { fontFamily: typography.bodyBold },

  mapWrap: { height: 120, marginTop: spacing.xxl - 4, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.cardHover },
  mapPin: {
    width: 26, height: 26, backgroundColor: colors.primary,
    borderTopLeftRadius: 13, borderTopRightRadius: 13, borderBottomRightRadius: 13, borderBottomLeftRadius: 0,
    transform: [{ rotate: '-45deg' }],
  },

  desc: { fontFamily: typography.body, fontSize: typography.size.body, color: colors.textMuted, lineHeight: 21 },
});
