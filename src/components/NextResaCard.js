import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { colors, typography, spacing, radius } from '../theme';
import ResaBadge from './ResaBadge';
import { daysUntil, fmtLong } from '../hooks/useReservations';

export default function NextResaCard({ r, onCancel, onViewRestaurant, onEdit }) {
  const resto = r.restaurants || {};
  const diff  = Math.round((new Date(r.date+'T00:00:00') - new Date().setHours(0,0,0,0)) / 86400000);
  const urgentColor = diff === 0 ? colors.resa : diff === 1 ? colors.green : colors.blue;

  return (
    <View style={s.card}>
      <View style={s.photoWrap}>
        {resto.photos?.[0]
          ? <Image source={{ uri: resto.photos[0] }} style={s.photo} resizeMode="cover" />
          : <View style={[s.photo, { backgroundColor: colors.cardHover, alignItems:'center', justifyContent:'center' }]}>
              <Text style={{ fontSize:52 }}>🍽️</Text>
            </View>
        }
        <View style={s.photoOverlay} />
        <View style={s.photoTop}>
          <ResaBadge status={r.status} />
          {resto.avg_rating > 0 && (
            <View style={s.ratingPill}>
              <Text style={s.ratingTxt}>★ {Number(resto.avg_rating).toFixed(1)}</Text>
            </View>
          )}
        </View>
        <View style={s.photoBottom}>
          {resto.cuisine_type && (
            <Text style={s.photoCuisine}>{resto.cuisine_type.toUpperCase().replace(/_/g,' ')}</Text>
          )}
          <Text style={s.photoName}>{resto.name || '—'}</Text>
          {resto.quartier && <Text style={s.photoQuartier}>📍 {resto.quartier}</Text>}
        </View>
      </View>

      <View style={s.body}>
        <View style={[s.countdown, { borderColor: urgentColor+'40', backgroundColor: urgentColor+'0d' }]}>
          <Text style={[s.countdownLabel, { color: urgentColor }]}>
            {diff === 0 ? '🎉' : diff === 1 ? '⏰' : '📅'}
            {'  '}{daysUntil(r.date)}
          </Text>
          <Text style={[s.countdownDate, { color: urgentColor }]}>{fmtLong(r.date)}</Text>
        </View>

        <View style={s.details}>
          <View style={s.detailItem}>
            <Text style={s.detailIcon}>🕐</Text>
            <View>
              <Text style={s.detailLbl}>HEURE</Text>
              <Text style={s.detailVal}>{r.time_slot?.slice(0,5) || '—'}</Text>
            </View>
          </View>
          <View style={s.detailSep} />
          <View style={s.detailItem}>
            <Text style={s.detailIcon}>👤</Text>
            <View>
              <Text style={s.detailLbl}>COUVERTS</Text>
              <Text style={s.detailVal}>
                {r.nb_adults}{r.nb_children > 0 ? ` + ${r.nb_children}` : ''}
              </Text>
            </View>
          </View>
        </View>

        {!!r.notes && (
          <View style={s.note}>
            <Text style={s.noteLbl}>💬  Note</Text>
            <Text style={s.noteTxt}>{r.notes}</Text>
          </View>
        )}

        <View style={s.actions}>
          {onViewRestaurant && (
            <TouchableOpacity style={s.viewBtn} onPress={onViewRestaurant}>
              <Text style={s.viewBtnTxt} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>Voir le restaurant →</Text>
            </TouchableOpacity>
          )}
          {['confirmed','pending'].includes(r.status) && onEdit && (
            <TouchableOpacity style={s.editBtn} onPress={onEdit}>
              <Text style={s.editTxt} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>Modifier la réservation</Text>
            </TouchableOpacity>
          )}
          {['confirmed','pending'].includes(r.status) && (
            <TouchableOpacity style={s.cancelBtn} onPress={onCancel}>
              <Text style={s.cancelTxt} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>Annuler la réservation</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card:          { marginHorizontal: spacing.xl, backgroundColor: colors.card, borderRadius: radius.xxl, borderWidth:1, borderColor:'rgba(200,151,90,0.2)', overflow:'hidden', marginBottom: spacing.md },
  photoWrap:     { height:200, position:'relative' },
  photo:         { ...StyleSheet.absoluteFillObject },
  photoOverlay:  { ...StyleSheet.absoluteFillObject, backgroundColor:'rgba(10,10,10,0.45)' },
  photoTop:      { position:'absolute', top: spacing.xl, left: spacing.xl, right: spacing.xl, flexDirection:'row', justifyContent:'space-between', alignItems:'center' },
  ratingPill:    { backgroundColor:'rgba(10,10,10,0.72)', borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderWidth:1, borderColor:'rgba(200,151,90,0.4)' },
  ratingTxt:     { color: colors.gold, fontFamily: typography.bodyMedium, fontSize: typography.size.caption },
  photoBottom:   { position:'absolute', bottom:0, left:0, right:0, padding: spacing.xl, backgroundColor:'rgba(10,10,10,0.65)' },
  photoCuisine:  { color:'rgba(255,255,255,0.75)', fontFamily: typography.bodyBold, fontSize: typography.size.xs, letterSpacing:2.5, marginBottom:3 },
  photoName:     { color: '#FFFFFF', fontFamily: typography.display, fontSize: typography.size.title, letterSpacing:0.3, marginBottom:2 },
  photoQuartier: { color:'rgba(255,255,255,0.65)', fontFamily: typography.body, fontSize: typography.size.caption },
  body:          { padding: spacing.xl, gap: spacing.lg },
  countdown:     { flexDirection:'row', alignItems:'center', justifyContent:'space-between', borderWidth:1, borderRadius: radius.lg, paddingHorizontal: spacing.xl, paddingVertical: spacing.lg },
  countdownLabel:{ fontFamily: typography.bodySemibold, fontSize: typography.size.subheading },
  countdownDate: { fontFamily: typography.body, fontSize: typography.size.body },
  details:       { flexDirection:'row', backgroundColor: colors.primaryDim, borderRadius: radius.xl, overflow:'hidden', borderWidth:1, borderColor: colors.primarySoft },
  detailItem:    { flex:1, flexDirection:'row', alignItems:'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.lg },
  detailSep:     { width:1, backgroundColor: colors.primarySoft, marginVertical: spacing.md },
  detailIcon:    { fontSize: typography.size.heading2 },
  detailLbl:     { color: colors.primary, fontFamily: typography.bodyBold, fontSize: typography.size.xs, letterSpacing:2, marginBottom:3 },
  detailVal:     { color: colors.text, fontFamily: typography.bodyMedium, fontSize: typography.size.subheading },
  note:          { backgroundColor: colors.cardHover, borderRadius: radius.lg, padding: spacing.lg, borderWidth:1, borderColor: colors.cardBorder },
  noteLbl:       { color: colors.textMuted, fontFamily: typography.bodyMedium, fontSize: typography.size.sm, letterSpacing:1, marginBottom: spacing.xs },
  noteTxt:       { color: colors.text, fontFamily: typography.body, fontSize: typography.size.bodyLg, lineHeight:18 },
  actions:       { gap: spacing.md },
  viewBtn:       { backgroundColor: colors.blueSoft, borderWidth:1, borderColor:'rgba(90,155,224,0.25)', borderRadius: radius.lg, paddingVertical: spacing.lg, paddingHorizontal: spacing.sm, alignItems:'center' },
  viewBtnTxt:    { color: colors.blue, fontFamily: typography.bodySemibold, fontSize: typography.size.body },
  editBtn:       { borderWidth:1, borderColor:'rgba(90,155,224,0.3)', borderRadius: radius.lg, paddingVertical: spacing.lg, paddingHorizontal: spacing.sm, alignItems:'center', backgroundColor: colors.blueSoft },
  editTxt:       { color: colors.blue, fontFamily: typography.bodySemibold, fontSize: typography.size.body },
  cancelBtn:     { borderWidth:1, borderColor:'rgba(224,90,90,0.3)', borderRadius: radius.lg, paddingVertical: spacing.lg, paddingHorizontal: spacing.sm, alignItems:'center', backgroundColor: colors.redSoft },
  cancelTxt:     { color: colors.red, fontFamily: typography.bodySemibold, fontSize: typography.size.body },
});
