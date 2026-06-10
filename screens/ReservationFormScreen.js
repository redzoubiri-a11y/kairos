import { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Image, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing, radius } from '../src/theme';
import useReservationForm, { OCCASIONS, DAYS, formatDateLong } from '../src/hooks/useReservationForm';
import FormProgressBar from '../src/components/FormProgressBar';
import FormStepper from '../src/components/FormStepper';
import ReservationSuccess from '../src/components/ReservationSuccess';
import BottomTabBar from '../src/components/BottomTabBar';

function SumRow({ icon, label, val, accent, last }) {
  return (
    <View style={[s.sumRow, !last && s.sumBorder]}>
      <Text style={s.sumIcon}>{icon}</Text>
      <Text style={s.sumLbl}>{label}</Text>
      <Text style={[s.sumVal, accent && { color: '#C87860' }]}>{val}</Text>
    </View>
  );
}


export default function ReservationFormScreen({ route, navigation }) {
  const restaurant   = route?.params?.restaurant || { name: 'Restaurant', id: null, photo_url: null, avg_rating: null };
  const existingResa = route?.params?.reservation || null;
  const isEdit       = !!existingResa;

  const [success, setSuccess] = useState(false);

  const onSuccess = useCallback(() => {
    if (isEdit) { navigation.goBack(); } else { setSuccess(true); }
  }, [isEdit, navigation]);

  const {
    date, setDate, heure, setHeure,
    adults, setAdults, children, setChildren,
    occasion, setOccasion, notes, setNotes,
    loading, error,
    occasionObj, shakeTranslate,
    confirmer,
    availableDays, midiSlots, soirSlots,
  } = useReservationForm(restaurant, onSuccess, existingResa);

  const slotGroups = [
    { label: 'Déjeuner', icon: '☀️', slots: midiSlots },
    { label: 'Dîner',    icon: '🌙', slots: soirSlots },
  ];

  const step = date ? (heure ? 2 : 1) : 0;

  if (success) {
    return (
      <SafeAreaView style={s.root}>
        <ReservationSuccess
          restaurant={restaurant}
          date={formatDateLong(date)}
          heure={heure}
          adults={adults}
          onGoHome={() => navigation.navigate('Main')}
          onReset={() => setSuccess(false)}
        />
    </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.root} edges={['top', 'left', 'right']}>
      <LinearGradient colors={['#C4B8C8', '#8B9BB4', '#6B7F9E']} start={{ x: 0.2, y: 0 }} end={{ x: 0, y: 1 }} style={s.bgOverlay} pointerEvents="none" />

      {/* Header */}
      <View style={s.header}>
        <View style={{ flex: 1 }}>
          <Text style={s.headerSub}>{isEdit ? 'MODIFIER' : 'RÉSERVATION'}</Text>
          <Text style={s.headerTitle} numberOfLines={1}>{restaurant.name}</Text>
        </View>
        {!!restaurant.avg_rating && (
          <View style={s.ratingPill}>
            <Text style={s.ratingTxt}>★ {Number(restaurant.avg_rating).toFixed(1)}</Text>
          </View>
        )}
      </View>

      <FormProgressBar current={step} />

      <ScrollView showsVerticalScrollIndicator={false} automaticallyAdjustKeyboardInsets={true} keyboardDismissMode="interactive">

        {/* Banner */}
        <View style={s.bannerWrap}>
          {restaurant.photos?.[0]
            ? <Image source={{ uri: restaurant.photos[0] }} style={s.banner} resizeMode="cover" />
            : (
              <View style={[s.banner, s.bannerPlaceholder]}>
                <Text style={{ fontSize: 48, opacity: 0.5 }}>🍽️</Text>
                <Text style={s.bannerPlaceholderTxt}>{restaurant.name}</Text>
              </View>
            )
          }
          <LinearGradient colors={['rgba(0,0,0,0.70)', 'transparent']} style={s.bannerVeil} pointerEvents="none" />
        </View>

        {/* Date */}
        <View style={s.sectionHeader}>
          <View style={s.sectionLeft}>
            <View style={[s.sectionNum, date && s.sectionNumDone]}>
              <Text style={[s.sectionNumTxt, date && { color: colors.green }]}>{date ? '✓' : '1'}</Text>
            </View>
            <Text style={[s.sectionLabel, date && s.sectionLabelDone]}>CHOISIR UNE DATE</Text>
          </View>
          {date && <Text style={s.sectionChosen}>{formatDateLong(date)}</Text>}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.dateRow}>
          {availableDays.map(d => (
            <TouchableOpacity
              key={d.value}
              style={[
                s.dateCard,
                d.isToday && s.dateCardToday,
                date === d.value && s.dateCardOn,
                d.isWeekend && !date && s.dateCardWeekend,
              ]}
              onPress={() => setDate(d.value)}
            >
              <Text style={[s.dateDayName, date === d.value && s.dateTxtOn, d.isToday && date !== d.value && { color: '#C87860' }]}>
                {d.isToday ? 'AUJ.' : d.dayName}
              </Text>
              <Text style={[s.dateDayNum, date === d.value && s.dateTxtOn]}>{d.dayNum}</Text>
              <Text style={[s.dateMonth, date === d.value && s.dateTxtOn]}>{d.month}</Text>
              {d.isWeekend && <View style={[s.weekendDot, date === d.value && { backgroundColor: colors.accent }]} />}
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Heure */}
        <View style={s.sectionHeader}>
          <View style={s.sectionLeft}>
            <View style={[s.sectionNum, heure && s.sectionNumDone]}>
              <Text style={[s.sectionNumTxt, heure && { color: colors.green }]}>{heure ? '✓' : '2'}</Text>
            </View>
            <Text style={[s.sectionLabel, heure && s.sectionLabelDone]}>CHOISIR UNE HEURE</Text>
          </View>
          {heure && <Text style={[s.sectionChosen, { color: '#C87860' }]}>{heure}</Text>}
        </View>

        {slotGroups.map(({ label, icon, slots }, gi) => (
          <View key={label} style={[s.slotSection, gi > 0 && { marginTop: spacing.lg }]}>
            <View style={s.slotGroupRow}>
              <Text style={s.slotGroupIcon}>{icon}</Text>
              <Text style={s.slotGroupLabel}>{label}</Text>
            </View>
            <View style={s.slotsWrap}>
              {slots.map(({ h, badge }) => (
                <TouchableOpacity key={h} style={[s.slotChip, heure === h && s.slotChipOn]} onPress={() => setHeure(h)}>
                  <Text style={[s.slotTxt, heure === h && s.slotTxtOn]}>{h}</Text>
                  {badge && (
                    <View style={[s.slotBadge, badge === 'Populaire' ? s.slotBadgePopular : s.slotBadgeLast]}>
                      <Text style={[s.slotBadgeTxt, badge === 'Dernières places' && { color: colors.red }]}>{badge}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Couverts */}
        <View style={s.sectionHeader}>
          <View style={s.sectionLeft}>
            <View style={s.sectionNum}>
              <Text style={s.sectionNumTxt}>3</Text>
            </View>
            <Text style={s.sectionLabel}>COUVERTS</Text>
          </View>
          <Text style={s.sectionChosen}>{adults + children} pers.</Text>
        </View>

        <View style={s.couvCard}>
          <View style={s.couvRow}>
            <View style={s.couvInfo}>
              <View style={s.couvIconWrap}><Text style={s.couvEmoji}>🧑</Text></View>
              <View>
                <Text style={s.couvLabel}>Adultes</Text>
                <Text style={s.couvSub}>13 ans et plus</Text>
              </View>
            </View>
            <FormStepper value={adults} min={1} max={20} onChange={setAdults} />
          </View>
          <View style={s.couvDivider} />
          <View style={s.couvRow}>
            <View style={s.couvInfo}>
              <View style={s.couvIconWrap}><Text style={s.couvEmoji}>👶</Text></View>
              <View>
                <Text style={s.couvLabel}>Enfants</Text>
                <Text style={s.couvSub}>Moins de 13 ans</Text>
              </View>
            </View>
            <FormStepper value={children} min={0} max={10} onChange={setChildren} />
          </View>
        </View>

        {/* Occasion */}
        <View style={s.sectionHeader}>
          <View style={s.sectionLeft}>
            <View style={s.sectionNum}>
              <Text style={s.sectionNumTxt}>4</Text>
            </View>
            <Text style={s.sectionLabel}>OCCASION</Text>
          </View>
          <Text style={s.sectionChosen}>{occasionObj?.label}</Text>
        </View>

        <View style={s.occasionGrid}>
          {OCCASIONS.map(o => (
            <TouchableOpacity
              key={o.id}
              style={[s.occasionChip, occasion === o.id && s.occasionChipOn]}
              onPress={() => setOccasion(o.id)}
            >
              <Text style={s.occasionIcon}>{o.icon}</Text>
              <Text style={[s.occasionLabel, occasion === o.id && s.occasionLabelOn]}>{o.label}</Text>
              {occasion === o.id && (
                <View style={s.occasionCheck}>
                  <Text style={{ color: colors.accent, fontSize: typography.size.xs, fontWeight: typography.weight.semibold }}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Note */}
        <View style={s.sectionHeader}>
          <View style={s.sectionLeft}>
            <Text style={s.optLabel}>NOTE  <Text style={s.optSub}>optionnel</Text></Text>
          </View>
          <Text style={s.charCount}>{notes.length}/300</Text>
        </View>

        <View style={s.noteWrap}>
          <TextInput
            style={s.noteInput}
            placeholder="Allergie, demande particulière, message au chef…"
            placeholderTextColor={colors.textDim}
            value={notes}
            onChangeText={setNotes}
            multiline
            maxLength={300}
          />
        </View>

        {/* Récap */}
        <View style={s.summaryCard}>
          <Text style={s.summaryTitle}>RÉCAPITULATIF</Text>
          <SumRow icon="🍽️" label="Restaurant" val={restaurant.name} />
          <SumRow icon="📅" label="Date"        val={date ? formatDateLong(date) : '—'} />
          <SumRow icon="🕐" label="Heure"       val={heure || '—'} accent />
          <SumRow icon="👥" label="Couverts"    val={`${adults} adulte${adults > 1 ? 's' : ''}${children > 0 ? ` · ${children} enfant${children > 1 ? 's' : ''}` : ''}`} />
          <SumRow icon={occasionObj?.icon || '🍽️'} label="Occasion" val={occasionObj?.label || '—'} last />
        </View>

        {/* Erreur */}
        {!!error && (
          <Animated.View style={[s.errorBox, { transform: [{ translateX: shakeTranslate }] }]}>
            <Text style={s.errorTxt}>⚠️  {error}</Text>
          </Animated.View>
        )}

        {/* Confirmer */}
        <TouchableOpacity
          style={[s.confirmBtn, (!date || !heure || loading) && s.confirmBtnDim]}
          onPress={confirmer}
          disabled={loading || !date || !heure}
        >
          <LinearGradient colors={['#FF6B1A','#D93A00']} start={{x:0,y:0}} end={{x:1,y:0}} style={StyleSheet.absoluteFillObject} />
          {loading
            ? <Text style={s.confirmBtnTxt}>···</Text>
            : <>
                <Text style={s.confirmBtnTxt}>{isEdit ? 'MODIFIER LA RÉSERVATION' : 'CONFIRMER LA RÉSERVATION'}</Text>
                <Text style={s.confirmBtnArrow}>→</Text>
              </>
          }
        </TouchableOpacity>

        <Text style={s.legalTxt}>
          En confirmant, vous acceptez que le restaurant puisse vous contacter pour valider votre réservation.
        </Text>

        <View style={{ height: 60 }} />
      </ScrollView>
      <BottomTabBar navigation={navigation} activeTab={null} />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:      { flex: 1, backgroundColor: colors.bg },
  bgOverlay: { ...StyleSheet.absoluteFillObject, opacity: 0.06 },

  header:      { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, paddingHorizontal: spacing.xxl, paddingTop: spacing.lg, paddingBottom: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  headerSub:   { color: '#C87860', fontSize: typography.size.xs, letterSpacing: 3, marginBottom: 2 },
  headerTitle: { color: colors.text, fontSize: typography.size.heading3, fontWeight: typography.weight.regular, letterSpacing: 0.3 },
  ratingPill:  { backgroundColor: colors.navy, borderRadius: radius.md, borderWidth: 1, borderColor: colors.navyBorder, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  ratingTxt:   { color: '#C87860', fontSize: typography.size.body, fontWeight: typography.weight.medium },

  bannerWrap:          { width: '100%', height: 180, position: 'relative' },
  banner:              { width: '100%', height: 180 },
  bannerVeil:          { position: 'absolute', top: 0, left: 0, right: 0, height: 80 },
  bannerPlaceholder:   { backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  bannerPlaceholderTxt:{ color: colors.textMuted, fontSize: typography.size.bodyLg, fontWeight: typography.weight.regular },

  sectionHeader:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xxl, marginTop: spacing.xxxl, marginBottom: spacing.lg },
  sectionLeft:     { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  sectionNum:      { width: 22, height: 22, borderRadius: 0, backgroundColor: colors.cardHover, borderWidth: 1, borderColor: colors.cardBorder, alignItems: 'center', justifyContent: 'center' },
  sectionNumDone:  { backgroundColor: 'rgba(76,175,130,0.25)', borderColor: colors.green },
  sectionNumTxt:   { color: colors.text, fontSize: typography.size.sm, fontWeight: typography.weight.semibold },
  sectionLabel:    { color: colors.textMuted, fontSize: typography.size.sm, letterSpacing: 3 },
  sectionLabelDone:{ color: colors.green },
  sectionChosen:   { color: colors.textMuted, fontSize: typography.size.caption, fontWeight: typography.weight.medium },
  optLabel:        { color: colors.textDim, fontSize: typography.size.sm, letterSpacing: 3 },
  optSub:          { color: colors.textDim, fontSize: typography.size.xs, letterSpacing: 1, fontWeight: typography.weight.regular },
  charCount:       { color: colors.textDim, fontSize: typography.size.sm },

  dateRow:         { paddingHorizontal: spacing.xxl, paddingBottom: spacing.xs, gap: spacing.md },
  dateCard:        { width: 66, paddingVertical: 13, borderRadius: radius.xxl, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, alignItems: 'center', gap: spacing.xxs },
  dateCardOn:      { backgroundColor: colors.navy, borderColor: colors.navyBorder },
  dateCardToday:   { borderColor: '#C87860' },
  dateCardWeekend: { borderColor: colors.cardBorder },
  dateDayName:     { color: colors.textDim, fontSize: typography.size.xs, letterSpacing: 1.5 },
  dateDayNum:      { color: colors.text, fontSize: 22, fontWeight: typography.weight.regular },
  dateMonth:       { color: colors.textDim, fontSize: typography.size.xs },
  dateTxtOn:       { color: colors.text, fontWeight: typography.weight.semibold },
  weekendDot:      { width: 4, height: 4, borderRadius: 0, backgroundColor: '#C87860', marginTop: 2 },

  slotSection:     { paddingHorizontal: spacing.xxl },
  slotGroupRow:    { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.lg },
  slotGroupIcon:   { fontSize: 14 },
  slotGroupLabel:  { color: colors.textMuted, fontSize: typography.size.body },
  slotsWrap:       { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  slotChip:        { alignItems: 'center', paddingHorizontal: spacing.xl, paddingVertical: spacing.lg, borderRadius: radius.lg, backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', minWidth: 78 },
  slotChipOn:      { backgroundColor: 'rgba(200,120,96,0.14)', borderColor: '#C87860', shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 0 }, elevation: 5 },
  slotTxt:         { color: colors.textMuted, fontSize: typography.size.heading3, fontWeight: typography.weight.regular },
  slotTxtOn:       { color: '#C87860', fontWeight: typography.weight.semibold },
  slotBadge:       { marginTop: spacing.xs, paddingHorizontal: spacing.sm, paddingVertical: spacing.xxs, borderRadius: radius.sm, backgroundColor: colors.accentSoft },
  slotBadgePopular:{ backgroundColor: colors.accentSoft },
  slotBadgeLast:   { backgroundColor: colors.redSoft },
  slotBadgeTxt:    { color: colors.accent, fontSize: typography.size.xs },

  couvCard:    { marginHorizontal: spacing.xxl, backgroundColor: colors.card, borderRadius: radius.xxl, borderWidth: 1, borderColor: colors.cardBorder, overflow: 'hidden' },
  couvRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xxl, paddingVertical: spacing.xl },
  couvInfo:    { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  couvIconWrap:{ width: 40, height: 40, borderRadius: radius.lg, backgroundColor: colors.cardHover, alignItems: 'center', justifyContent: 'center' },
  couvEmoji:   { fontSize: 20 },
  couvLabel:   { color: colors.text, fontSize: typography.size.bodyLg, fontWeight: typography.weight.medium, marginBottom: 2 },
  couvSub:     { color: colors.textMuted, fontSize: typography.size.caption },
  couvDivider: { height: 1, backgroundColor: colors.cardBorder, marginHorizontal: spacing.xxl },

  occasionGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg, paddingHorizontal: spacing.xxl },
  occasionChip:   { width: '30%', flexGrow: 1, alignItems: 'center', paddingVertical: spacing.lg, borderRadius: radius.xl, backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', gap: spacing.sm, position: 'relative' },
  occasionChipOn: { backgroundColor: 'rgba(200,151,90,0.14)', borderColor: '#c8975a', shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 0 }, elevation: 5 },
  occasionIcon:   { fontSize: 22 },
  occasionLabel:  { color: colors.textMuted, fontSize: typography.size.caption, textAlign: 'center' },
  occasionLabelOn:{ color: colors.accent, fontWeight: typography.weight.semibold },
  occasionCheck:  { position: 'absolute', top: 7, right: 7, width: 16, height: 16, borderRadius: 0, backgroundColor: 'rgba(232,160,69,0.2)', alignItems: 'center', justifyContent: 'center' },

  noteWrap:  { marginHorizontal: spacing.xxl, backgroundColor: colors.card, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.cardBorder },
  noteInput: { color: colors.text, fontSize: typography.size.bodyLg, fontWeight: typography.weight.regular, padding: spacing.xl, minHeight: 90, textAlignVertical: 'top' },

  summaryCard:  { margin: spacing.xxl, backgroundColor: colors.card, borderRadius: radius.xxl, borderWidth: 1, borderColor: colors.cardBorder, padding: spacing.xl },
  summaryTitle: { color: colors.textDim, fontSize: typography.size.xs, letterSpacing: 4, marginBottom: spacing.lg },
  sumRow:       { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, paddingVertical: spacing.sm + 2 },
  sumBorder:    { borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  sumIcon:      { fontSize: 15, width: 22 },
  sumLbl:       { color: colors.textMuted, fontSize: typography.size.bodyLg, flex: 1 },
  sumVal:       { color: colors.text, fontSize: typography.size.bodyLg, fontWeight: typography.weight.medium, textAlign: 'right', flexShrink: 1, maxWidth: '55%' },

  errorBox: { marginHorizontal: spacing.xxl, marginBottom: spacing.lg, backgroundColor: colors.redSoft, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: 'rgba(224,90,90,0.3)' },
  errorTxt: { color: colors.red, fontSize: typography.size.body },

  confirmBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.lg, marginHorizontal: spacing.xxl, borderRadius: radius.xxl, paddingVertical: 17, overflow: 'hidden' },
  confirmBtnDim:  { opacity: 0.4 },
  confirmBtnTxt:  { color: '#FFFFFF', fontSize: typography.size.bodyLg, fontWeight: typography.weight.medium, letterSpacing: 1.5 },
  confirmBtnArrow:{ color: '#FFFFFF', fontSize: 18, fontWeight: typography.weight.regular },

  legalTxt: { marginHorizontal: spacing.xxl, marginTop: spacing.lg, color: colors.textDim, fontSize: typography.size.sm, lineHeight: 16, textAlign: 'center', fontStyle: 'italic' },
});
