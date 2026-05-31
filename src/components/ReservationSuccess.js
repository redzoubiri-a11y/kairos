import { View, Text, TouchableOpacity, Image, StyleSheet, Animated } from 'react-native';
import { colors, typography, spacing, radius } from '../theme';
import { formatDateLong } from '../hooks/useReservationForm';

export default function ReservationSuccess({
  restaurant, date, heure, adults, children, occasionObj,
  successAnim, successScale,
  onGoHome, onReset,
}) {
  return (
    <Animated.ScrollView
      contentContainerStyle={s.wrap}
      showsVerticalScrollIndicator={false}
      style={{ opacity: successAnim, transform: [{ scale: successScale }] }}
    >
      <View style={s.ring}>
        <View style={s.check}>
          <Text style={s.checkTxt}>✓</Text>
        </View>
      </View>

      <Text style={s.title}>Demande envoyée !</Text>
      <Text style={s.sub}>Le restaurant va confirmer votre table sous peu.</Text>

      <View style={s.card}>
        {restaurant.photo_url && (
          <Image source={{ uri: restaurant.photo_url }} style={s.photo} resizeMode="cover" />
        )}
        <View style={s.cardBody}>
          <Text style={s.restoName}>{restaurant.name}</Text>
          {restaurant.avg_rating > 0 && (
            <Text style={s.rating}>★ {Number(restaurant.avg_rating).toFixed(1)}</Text>
          )}
        </View>
        <View style={s.divider} />
        <View style={s.details}>
          <View style={s.detailItem}>
            <Text style={s.detailIcon}>📅</Text>
            <View>
              <Text style={s.detailLabel}>DATE</Text>
              <Text style={s.detailVal}>{formatDateLong(date)}</Text>
            </View>
          </View>
          <View style={s.detailItem}>
            <Text style={s.detailIcon}>🕐</Text>
            <View>
              <Text style={s.detailLabel}>HEURE</Text>
              <Text style={[s.detailVal, { color: colors.blue }]}>{heure}</Text>
            </View>
          </View>
          <View style={s.detailItem}>
            <Text style={s.detailIcon}>👥</Text>
            <View>
              <Text style={s.detailLabel}>COUVERTS</Text>
              <Text style={s.detailVal}>
                {adults} adulte{adults > 1 ? 's' : ''}
                {children > 0 ? ` · ${children} enfant${children > 1 ? 's' : ''}` : ''}
              </Text>
            </View>
          </View>
          {occasionObj?.id !== 'normal' && (
            <View style={s.detailItem}>
              <Text style={s.detailIcon}>{occasionObj.icon}</Text>
              <View>
                <Text style={s.detailLabel}>OCCASION</Text>
                <Text style={s.detailVal}>{occasionObj.label}</Text>
              </View>
            </View>
          )}
        </View>
      </View>

      <View style={s.statusRow}>
        <View style={s.statusDot} />
        <Text style={s.statusTxt}>En attente de confirmation  ·  Notification à venir</Text>
      </View>

      <TouchableOpacity style={s.btnPrimary} onPress={onGoHome}>
        <Text style={s.btnPrimaryTxt}>RETOUR À L'ACCUEIL</Text>
      </TouchableOpacity>
      <TouchableOpacity style={s.btnOutline} onPress={onReset}>
        <Text style={s.btnOutlineTxt}>Faire une autre réservation</Text>
      </TouchableOpacity>
      <View style={{ height: 40 }} />
    </Animated.ScrollView>
  );
}

const s = StyleSheet.create({
  wrap:       { alignItems: 'center', paddingHorizontal: spacing.section - 4, paddingTop: 48 },
  ring:       { width: 100, height: 100, borderRadius: 50, borderWidth: 1, borderColor: 'rgba(76,175,130,0.25)', backgroundColor: 'rgba(76,175,130,0.04)', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xxl },
  check:      { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.greenSoft, borderWidth: 2, borderColor: colors.green, alignItems: 'center', justifyContent: 'center' },
  checkTxt:   { color: colors.green, fontSize: 32, fontWeight: typography.weight.regular },
  title:      { color: colors.text, fontSize: 26, fontWeight: typography.weight.regular, letterSpacing: 0.5, marginBottom: spacing.md, textAlign: 'center' },
  sub:        { color: colors.textMuted, fontSize: typography.size.bodyLg, textAlign: 'center', marginBottom: spacing.section - 4, lineHeight: 20 },
  card:       { width: '100%', backgroundColor: colors.card, borderRadius: spacing.xxl, borderWidth: 1, borderColor: 'rgba(232,160,69,0.3)', overflow: 'hidden', marginBottom: spacing.lg },
  photo:      { width: '100%', height: 120 },
  cardBody:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingVertical: spacing.lg },
  restoName:  { color: colors.accent, fontSize: typography.size.heading3, fontWeight: typography.weight.regular, letterSpacing: 0.3 },
  rating:     { color: colors.accent, fontSize: typography.size.bodyLg },
  divider:    { height: 1, backgroundColor: colors.cardBorder },
  details:    { padding: spacing.xl, gap: spacing.lg },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  detailIcon: { fontSize: 18, width: 26 },
  detailLabel:{ color: colors.textDim, fontSize: typography.size.xs, letterSpacing: 2, marginBottom: 2 },
  detailVal:  { color: colors.text, fontSize: typography.size.bodyLg, fontWeight: typography.weight.regular },
  statusRow:  { flexDirection: 'row', alignItems: 'center', gap: spacing.md, width: '100%', backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.cardBorder, marginBottom: spacing.xxxl },
  statusDot:  { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.accent },
  statusTxt:  { color: colors.textMuted, fontSize: typography.size.body, flex: 1 },
  btnPrimary:    { width: '100%', backgroundColor: colors.accent, borderRadius: radius.xxl, paddingVertical: 15, alignItems: 'center', marginBottom: spacing.lg },
  btnPrimaryTxt: { color: colors.bg, fontSize: typography.size.bodyLg, fontWeight: typography.weight.medium, letterSpacing: 2 },
  btnOutline:    { width: '100%', borderRadius: radius.xxl, paddingVertical: 15, alignItems: 'center', borderWidth: 1, borderColor: colors.cardBorder },
  btnOutlineTxt: { color: colors.textMuted, fontSize: typography.size.bodyLg },
});
