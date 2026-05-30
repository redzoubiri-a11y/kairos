import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, TextInput, Image, Animated,
  Platform, StatusBar as RNStatusBar,
} from 'react-native';
import { supabase } from '../supabase';
import { colors, typography, spacing, radius } from '../src/theme';

const TOP = Platform.OS === 'android' ? (RNStatusBar.currentHeight || 0) : 0;

const MIDI_SLOTS = [
  { h:'12:00' }, { h:'12:30' }, { h:'13:00', badge:'Populaire' },
  { h:'13:30', badge:'Populaire' }, { h:'14:00', badge:'Dernières places' },
];
const SOIR_SLOTS = [
  { h:'19:00' }, { h:'19:30', badge:'Populaire' },
  { h:'20:00', badge:'Populaire' }, { h:'20:30' },
  { h:'21:00' }, { h:'21:30', badge:'Dernières places' }, { h:'22:00' },
];

const OCCASIONS = [
  { id:'normal',    label:'Repas normal', icon:'🍽️' },
  { id:'anniv',     label:'Anniversaire', icon:'🎂' },
  { id:'romantique',label:'Romantique',   icon:'💑' },
  { id:'affaires',  label:'Affaires',     icon:'💼' },
  { id:'famille',   label:'Famille',      icon:'👨‍👩‍👧' },
  { id:'fete',      label:'Célébration',  icon:'🥂' },
];

function buildDays() {
  const days = [];
  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push({
      dayName: d.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.','').toUpperCase(),
      dayNum:  d.getDate(),
      month:   d.toLocaleDateString('fr-FR', { month: 'short' }),
      value:   d.toISOString().split('T')[0],
      isToday: i === 0,
      isWeekend: [0, 6].includes(d.getDay()),
    });
  }
  return days;
}

const DAYS = buildDays();

function formatDateLong(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

/* ─── Stepper progrès ─── */
const STEPS = ['Date', 'Heure', 'Couverts', 'Confirmation'];
function ProgressBar({ current }) {
  return (
    <View style={pb.row}>
      {STEPS.map((label, i) => {
        const done   = i < current;
        const active = i === current;
        const last   = i === STEPS.length - 1;
        return (
          <View key={i} style={{ flexDirection:'row', alignItems:'center', flex: last ? 0 : 1 }}>
            <View style={pb.stepWrap}>
              <View style={[pb.circle, done && pb.circleDone, active && pb.circleActive]}>
                {done
                  ? <Text style={pb.checkTxt}>✓</Text>
                  : <Text style={[pb.numTxt, active && pb.numTxtActive]}>{i + 1}</Text>
                }
              </View>
              <Text style={[pb.label, active && pb.labelActive, done && pb.labelDone]}>{label}</Text>
            </View>
            {!last && <View style={[pb.line, done && pb.lineDone]} />}
          </View>
        );
      })}
    </View>
  );
}
const pb = StyleSheet.create({
  row:          { flexDirection:'row', alignItems:'flex-start', paddingHorizontal:spacing.xxl, paddingVertical:spacing.lg, backgroundColor:colors.card, borderBottomWidth:1, borderBottomColor:colors.cardBorder },
  stepWrap:     { alignItems:'center', gap:spacing.xs },
  circle:       { width:26, height:26, borderRadius:13, backgroundColor:colors.cardHover, borderWidth:1, borderColor:colors.cardBorder, alignItems:'center', justifyContent:'center' },
  circleDone:   { backgroundColor:'rgba(76,175,130,0.2)', borderColor:colors.green },
  circleActive: { backgroundColor:colors.accentSoft, borderColor:colors.accent },
  checkTxt:     { color:colors.green, fontSize:typography.size.caption, fontWeight:typography.weight.semibold },
  numTxt:       { color:colors.textDim, fontSize:typography.size.caption },
  numTxtActive: { color:colors.accent },
  label:        { color:colors.textDim, fontSize:typography.size.xs, letterSpacing:0.3 },
  labelActive:  { color:colors.accent },
  labelDone:    { color:colors.green },
  line:         { flex:1, height:1, backgroundColor:colors.cardBorder, marginBottom:14, marginHorizontal:spacing.xs },
  lineDone:     { backgroundColor:colors.green },
});

/* ─── Stepper numérique ─── */
function Stepper({ value, min, max, onChange }) {
  return (
    <View style={st.row}>
      <TouchableOpacity style={[st.btn, value <= min && st.btnDim]} onPress={() => onChange(v => Math.max(min, v - 1))} disabled={value <= min}>
        <Text style={st.sym}>−</Text>
      </TouchableOpacity>
      <Text style={st.val}>{value}</Text>
      <TouchableOpacity style={[st.btn, value >= max && st.btnDim]} onPress={() => onChange(v => Math.min(max, v + 1))} disabled={value >= max}>
        <Text style={st.sym}>+</Text>
      </TouchableOpacity>
    </View>
  );
}
const st = StyleSheet.create({
  row:    { flexDirection:'row', alignItems:'center', gap:spacing.lg },
  btn:    { width:38, height:38, borderRadius:19, backgroundColor:colors.cardHover, borderWidth:1, borderColor:colors.cardBorder, alignItems:'center', justifyContent:'center' },
  btnDim: { opacity:0.25 },
  sym:    { color:colors.text, fontSize:22, fontWeight:typography.weight.regular, lineHeight:30 },
  val:    { color:colors.text, fontSize:22, fontWeight:typography.weight.regular, minWidth:32, textAlign:'center' },
});

/* ─── Ligne récap ─── */
function SumRow({ icon, label, val, accent, last }) {
  return (
    <View style={[s.sumRow, !last && s.sumBorder]}>
      <Text style={s.sumIcon}>{icon}</Text>
      <Text style={s.sumLbl}>{label}</Text>
      <Text style={[s.sumVal, accent && { color:colors.blue }]}>{val}</Text>
    </View>
  );
}

/* ─── Écran principal ─── */
export default function ReservationFormScreen({ route, navigation }) {
  const restaurant = route?.params?.restaurant || { name:'Restaurant', id:null, photo_url:null, avg_rating:null };

  const [date,      setDate]      = useState(null);
  const [heure,     setHeure]     = useState(null);
  const [adults,    setAdults]    = useState(2);
  const [children,  setChildren]  = useState(0);
  const [occasion,  setOccasion]  = useState('normal');
  const [notes,     setNotes]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [success,   setSuccess]   = useState(false);
  const [userId,    setUserId]    = useState(null);
  const successAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim   = useRef(new Animated.Value(0)).current;

  const step = useMemo(() => (!date ? 0 : !heure ? 1 : 2), [date, heure]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const u = data?.user;
      if (!u) return;
      const { data: row } = await supabase.from('users').select('id').eq('auth_id', u.id).single();
      if (row) setUserId(row.id);
    })();
  }, []);

  useEffect(() => {
    if (success) {
      Animated.spring(successAnim, { toValue:1, useNativeDriver:true, tension:55, friction:8 }).start();
    }
  }, [success]);

  const triggerShake = useCallback(() => {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 1,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -1, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 1,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,  duration: 60, useNativeDriver: true }),
    ]).start();
  }, []);

  const goBack    = useCallback(() => navigation.goBack(), [navigation]);
  const goHome    = useCallback(() => navigation.navigate('Main'), [navigation]);
  const resetForm = useCallback(() => {
    setSuccess(false); setDate(null); setHeure(null);
    setNotes(''); setOccasion('normal'); successAnim.setValue(0);
  }, [successAnim]);

  const occasionObj    = useMemo(() => OCCASIONS.find(o => o.id === occasion), [occasion]);
  const shakeTranslate = useMemo(() => shakeAnim.interpolate({ inputRange: [-1, 1], outputRange: [-8, 8] }), []);
  const successScale   = useMemo(() => successAnim.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }), []);

  const confirmer = useCallback(async () => {
    if (!date || !heure) {
      setError('Choisissez une date et une heure pour continuer.');
      triggerShake();
      return;
    }
    if (!userId)        { setError('Connectez-vous pour réserver.'); return; }
    if (!restaurant.id) { setError('Restaurant introuvable.'); return; }

    setLoading(true);
    setError('');

    try {
      const noteText = [
        occasion !== 'normal' ? `Occasion : ${occasionObj?.label}` : null,
        notes.trim() || null,
      ].filter(Boolean).join('\n') || null;

      const { error: resaErr } = await supabase.from('reservations').insert({
        user_id:       userId,
        restaurant_id: restaurant.id,
        date,
        time_slot:     heure,
        nb_adults:     adults,
        nb_children:   children,
        notes:         noteText,
      });

      if (resaErr) { setError(resaErr.message); return; }

      await supabase.from('notifications').insert({
        recipient_id:   userId,
        recipient_type: 'user',
        type:           'new_resa',
        title:          'Demande envoyée',
        body:           `Votre réservation chez ${restaurant.name} le ${formatDateLong(date)} à ${heure} pour ${adults} personne${adults > 1 ? 's' : ''} est en attente de confirmation.`,
      });

      setSuccess(true);
    } finally {
      setLoading(false);
    }
  }, [date, heure, userId, restaurant.id, restaurant.name, occasion, occasionObj, notes, adults, children, triggerShake]);

  /* ── Écran succès ── */
  if (success) {
    return (
      <SafeAreaView style={s.root}>
        <Animated.ScrollView
          contentContainerStyle={s.successWrap}
          showsVerticalScrollIndicator={false}
          style={{
            opacity: successAnim,
            transform: [{ scale: successScale }],
          }}
        >
          <View style={s.successRing}>
            <View style={s.successCheck}>
              <Text style={s.successCheckTxt}>✓</Text>
            </View>
          </View>

          <Text style={s.successTitle}>Demande envoyée !</Text>
          <Text style={s.successSub}>Le restaurant va confirmer votre table sous peu.</Text>

          <View style={s.successCard}>
            {restaurant.photo_url && (
              <Image source={{ uri: restaurant.photo_url }} style={s.successPhoto} resizeMode="cover" />
            )}
            <View style={s.successCardBody}>
              <Text style={s.successRestoName}>{restaurant.name}</Text>
              {restaurant.avg_rating > 0 && (
                <Text style={s.successRating}>★ {Number(restaurant.avg_rating).toFixed(1)}</Text>
              )}
            </View>
            <View style={s.successDivider} />
            <View style={s.successDetails}>
              <View style={s.successDetailItem}>
                <Text style={s.successDetailIcon}>📅</Text>
                <View>
                  <Text style={s.successDetailLabel}>DATE</Text>
                  <Text style={s.successDetailVal}>{formatDateLong(date)}</Text>
                </View>
              </View>
              <View style={s.successDetailItem}>
                <Text style={s.successDetailIcon}>🕐</Text>
                <View>
                  <Text style={s.successDetailLabel}>HEURE</Text>
                  <Text style={[s.successDetailVal, { color:colors.blue }]}>{heure}</Text>
                </View>
              </View>
              <View style={s.successDetailItem}>
                <Text style={s.successDetailIcon}>👥</Text>
                <View>
                  <Text style={s.successDetailLabel}>COUVERTS</Text>
                  <Text style={s.successDetailVal}>
                    {adults} adulte{adults > 1 ? 's' : ''}
                    {children > 0 ? ` · ${children} enfant${children > 1 ? 's' : ''}` : ''}
                  </Text>
                </View>
              </View>
              {occasionObj && occasionObj.id !== 'normal' && (
                <View style={s.successDetailItem}>
                  <Text style={s.successDetailIcon}>{occasionObj.icon}</Text>
                  <View>
                    <Text style={s.successDetailLabel}>OCCASION</Text>
                    <Text style={s.successDetailVal}>{occasionObj.label}</Text>
                  </View>
                </View>
              )}
            </View>
          </View>

          <View style={s.successStatus}>
            <View style={s.successStatusDot} />
            <Text style={s.successStatusTxt}>En attente de confirmation  ·  Notification à venir</Text>
          </View>

          <TouchableOpacity style={s.successBtn} onPress={goHome}>
            <Text style={s.successBtnTxt}>RETOUR À L'ACCUEIL</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.successBtnOutline} onPress={resetForm}>
            <Text style={s.successBtnOutlineTxt}>Faire une autre réservation</Text>
          </TouchableOpacity>
          <View style={{ height:40 }} />
        </Animated.ScrollView>
      </SafeAreaView>
    );
  }

  /* ── Formulaire ── */
  return (
    <SafeAreaView style={s.root}>

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={goBack}>
          <Text style={s.backBtnTxt}>←</Text>
        </TouchableOpacity>
        <View style={{ flex:1 }}>
          <Text style={s.headerSub}>RÉSERVATION</Text>
          <Text style={s.headerTitle} numberOfLines={1}>{restaurant.name}</Text>
        </View>
        {!!restaurant.avg_rating && (
          <View style={s.ratingPill}>
            <Text style={s.ratingTxt}>★ {Number(restaurant.avg_rating).toFixed(1)}</Text>
          </View>
        )}
      </View>

      {/* Progress stepper */}
      <ProgressBar current={step} />

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Hero bannière */}
        {restaurant.photo_url
          ? <Image source={{ uri:restaurant.photo_url }} style={s.banner} resizeMode="cover" />
          : (
            <View style={[s.banner, s.bannerPlaceholder]}>
              <Text style={{ fontSize:48, opacity:0.5 }}>🍽️</Text>
              <Text style={s.bannerPlaceholderTxt}>{restaurant.name}</Text>
            </View>
          )
        }

        {/* ── SECTION DATE ── */}
        <View style={s.sectionHeader}>
          <View style={s.sectionLeft}>
            <View style={[s.sectionNum, date && s.sectionNumDone]}>
              <Text style={[s.sectionNumTxt, date && { color:colors.green }]}>{date ? '✓' : '1'}</Text>
            </View>
            <Text style={[s.sectionLabel, date && s.sectionLabelDone]}>CHOISIR UNE DATE</Text>
          </View>
          {date && <Text style={s.sectionChosen}>{formatDateLong(date)}</Text>}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.dateRow}>
          {DAYS.map(d => (
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
              <Text style={[s.dateDayName, date === d.value && s.dateTxtOn, d.isToday && date !== d.value && { color:colors.blue }]}>
                {d.isToday ? 'AUJ.' : d.dayName}
              </Text>
              <Text style={[s.dateDayNum, date === d.value && s.dateTxtOn]}>{d.dayNum}</Text>
              <Text style={[s.dateMonth, date === d.value && s.dateTxtOn]}>{d.month}</Text>
              {d.isWeekend && <View style={[s.weekendDot, date === d.value && { backgroundColor:colors.accent }]} />}
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── SECTION HEURE ── */}
        <View style={s.sectionHeader}>
          <View style={s.sectionLeft}>
            <View style={[s.sectionNum, heure && s.sectionNumDone]}>
              <Text style={[s.sectionNumTxt, heure && { color:colors.green }]}>{heure ? '✓' : '2'}</Text>
            </View>
            <Text style={[s.sectionLabel, heure && s.sectionLabelDone]}>CHOISIR UNE HEURE</Text>
          </View>
          {heure && <Text style={[s.sectionChosen, { color:colors.blue }]}>{heure}</Text>}
        </View>

        {/* Déjeuner */}
        <View style={s.slotSection}>
          <View style={s.slotGroupRow}>
            <Text style={s.slotGroupIcon}>☀️</Text>
            <Text style={s.slotGroupLabel}>Déjeuner</Text>
          </View>
          <View style={s.slotsWrap}>
            {MIDI_SLOTS.map(({ h, badge }) => (
              <TouchableOpacity key={h} style={[s.slotChip, heure === h && s.slotChipOn]} onPress={() => setHeure(h)}>
                <Text style={[s.slotTxt, heure === h && s.slotTxtOn]}>{h}</Text>
                {badge && (
                  <View style={[s.slotBadge, badge === 'Populaire' && s.slotBadgePopular, badge === 'Dernières places' && s.slotBadgeLast]}>
                    <Text style={[s.slotBadgeTxt, badge === 'Dernières places' && { color:colors.red }]}>{badge}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Dîner */}
        <View style={[s.slotSection, { marginTop:spacing.lg }]}>
          <View style={s.slotGroupRow}>
            <Text style={s.slotGroupIcon}>🌙</Text>
            <Text style={s.slotGroupLabel}>Dîner</Text>
          </View>
          <View style={s.slotsWrap}>
            {SOIR_SLOTS.map(({ h, badge }) => (
              <TouchableOpacity key={h} style={[s.slotChip, heure === h && s.slotChipOn]} onPress={() => setHeure(h)}>
                <Text style={[s.slotTxt, heure === h && s.slotTxtOn]}>{h}</Text>
                {badge && (
                  <View style={[s.slotBadge, badge === 'Populaire' && s.slotBadgePopular, badge === 'Dernières places' && s.slotBadgeLast]}>
                    <Text style={[s.slotBadgeTxt, badge === 'Dernières places' && { color:colors.red }]}>{badge}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── SECTION COUVERTS ── */}
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
              <View style={s.couvIconWrap}>
                <Text style={s.couvEmoji}>🧑</Text>
              </View>
              <View>
                <Text style={s.couvLabel}>Adultes</Text>
                <Text style={s.couvSub}>13 ans et plus</Text>
              </View>
            </View>
            <Stepper value={adults} min={1} max={20} onChange={setAdults} />
          </View>
          <View style={s.couvDivider} />
          <View style={s.couvRow}>
            <View style={s.couvInfo}>
              <View style={s.couvIconWrap}>
                <Text style={s.couvEmoji}>👶</Text>
              </View>
              <View>
                <Text style={s.couvLabel}>Enfants</Text>
                <Text style={s.couvSub}>Moins de 13 ans</Text>
              </View>
            </View>
            <Stepper value={children} min={0} max={10} onChange={setChildren} />
          </View>
        </View>

        {/* ── SECTION OCCASION ── */}
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
                  <Text style={{ color:colors.accent, fontSize:typography.size.xs, fontWeight:typography.weight.semibold }}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* ── NOTE ── */}
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

        {/* ── RÉCAP ── */}
        <View style={s.summaryCard}>
          <Text style={s.summaryTitle}>RÉCAPITULATIF</Text>
          <SumRow icon="🍽️" label="Restaurant" val={restaurant.name} />
          <SumRow icon="📅" label="Date"        val={date ? formatDateLong(date) : '—'} />
          <SumRow icon="🕐" label="Heure"       val={heure || '—'} accent />
          <SumRow icon="👥" label="Couverts"    val={`${adults} adulte${adults > 1 ? 's' : ''}${children > 0 ? ` · ${children} enfant${children > 1 ? 's' : ''}` : ''}`} />
          <SumRow icon={occasionObj?.icon || '🍽️'}
                  label="Occasion" val={occasionObj?.label || '—'} last />
        </View>

        {/* Erreur */}
        {!!error && (
          <Animated.View style={[s.errorBox, { transform:[{ translateX: shakeTranslate }] }]}>
            <Text style={s.errorTxt}>⚠️  {error}</Text>
          </Animated.View>
        )}

        {/* Bouton confirmer */}
        <TouchableOpacity
          style={[s.confirmBtn, (!date || !heure || loading) && s.confirmBtnDim]}
          onPress={confirmer}
          disabled={loading || !date || !heure}
        >
          {loading
            ? <Text style={s.confirmBtnTxt}>···</Text>
            : <>
                <Text style={s.confirmBtnTxt}>CONFIRMER LA RÉSERVATION</Text>
                <Text style={s.confirmBtnArrow}>→</Text>
              </>
          }
        </TouchableOpacity>

        <Text style={s.legalTxt}>
          En confirmant, vous acceptez que le restaurant puisse vous contacter pour valider votre réservation.
        </Text>

        <View style={{ height:60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex:1, backgroundColor:colors.bg },

  /* Header */
  header:      { flexDirection:'row', alignItems:'center', gap:spacing.lg, paddingHorizontal:spacing.xxl, paddingTop:spacing.lg, paddingBottom:spacing.lg, borderBottomWidth:1, borderBottomColor:colors.cardBorder },
  backBtn:     { width:38, height:38, borderRadius:19, backgroundColor:colors.card, borderWidth:1, borderColor:colors.cardBorder, alignItems:'center', justifyContent:'center' },
  backBtnTxt:  { color:colors.text, fontSize:18 },
  headerSub:   { color:colors.accent, fontSize:typography.size.xs, letterSpacing:3, marginBottom:2 },
  headerTitle: { color:colors.text, fontSize:typography.size.heading3, fontWeight:typography.weight.regular, letterSpacing:0.3 },
  ratingPill:  { backgroundColor:colors.accentSoft, borderRadius:radius.md, borderWidth:1, borderColor:'rgba(232,160,69,0.3)', paddingHorizontal:spacing.lg, paddingVertical:spacing.sm },
  ratingTxt:   { color:colors.accent, fontSize:typography.size.body, fontWeight:typography.weight.medium },

  /* Banner */
  banner:              { width:'100%', height:180 },
  bannerPlaceholder:   { backgroundColor:colors.card, alignItems:'center', justifyContent:'center', gap:spacing.md },
  bannerPlaceholderTxt:{ color:colors.textMuted, fontSize:typography.size.bodyLg, fontWeight:typography.weight.regular },

  /* Section headers */
  sectionHeader:   { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:spacing.xxl, marginTop:spacing.xxxl, marginBottom:spacing.lg },
  sectionLeft:     { flexDirection:'row', alignItems:'center', gap:spacing.lg },
  sectionNum:      { width:22, height:22, borderRadius:11, backgroundColor:colors.cardHover, borderWidth:1, borderColor:colors.cardBorder, alignItems:'center', justifyContent:'center' },
  sectionNumDone:  { backgroundColor:'rgba(76,175,130,0.15)', borderColor:colors.green },
  sectionNumTxt:   { color:colors.textDim, fontSize:typography.size.sm, fontWeight:typography.weight.semibold },
  sectionLabel:    { color:colors.textMuted, fontSize:typography.size.sm, letterSpacing:3 },
  sectionLabelDone:{ color:colors.green },
  sectionChosen:   { color:colors.accent, fontSize:typography.size.caption },
  optLabel:        { color:colors.textMuted, fontSize:typography.size.sm, letterSpacing:3 },
  optSub:          { color:colors.textDim, fontSize:typography.size.xs, letterSpacing:1, fontWeight:typography.weight.regular },
  charCount:       { color:colors.textDim, fontSize:typography.size.sm },

  /* Dates */
  dateRow:        { paddingHorizontal:spacing.xxl, paddingBottom:spacing.xs, gap:spacing.md },
  dateCard:       { width:66, paddingVertical:13, borderRadius:radius.xxl, backgroundColor:colors.card, borderWidth:1, borderColor:colors.cardBorder, alignItems:'center', gap:spacing.xxs },
  dateCardOn:     { backgroundColor:colors.accentSoft, borderColor:colors.accent },
  dateCardToday:  { borderColor:'rgba(90,155,224,0.5)' },
  dateCardWeekend:{ borderColor:'rgba(232,160,69,0.15)' },
  dateDayName:    { color:colors.textDim, fontSize:typography.size.xs, letterSpacing:1.5 },
  dateDayNum:     { color:colors.text, fontSize:22, fontWeight:typography.weight.regular },
  dateMonth:      { color:colors.textDim, fontSize:typography.size.xs },
  dateTxtOn:      { color:colors.accent },
  weekendDot:     { width:4, height:4, borderRadius:2, backgroundColor:'rgba(232,160,69,0.4)', marginTop:2 },

  /* Slots */
  slotSection:    { paddingHorizontal:spacing.xxl },
  slotGroupRow:   { flexDirection:'row', alignItems:'center', gap:spacing.sm, marginBottom:spacing.lg },
  slotGroupIcon:  { fontSize:14 },
  slotGroupLabel: { color:colors.textMuted, fontSize:typography.size.body },
  slotsWrap:      { flexDirection:'row', flexWrap:'wrap', gap:spacing.md },
  slotChip:       { alignItems:'center', paddingHorizontal:spacing.xl, paddingVertical:spacing.lg, borderRadius:radius.lg, backgroundColor:colors.card, borderWidth:1, borderColor:colors.cardBorder, minWidth:78 },
  slotChipOn:     { backgroundColor:'rgba(90,155,224,0.15)', borderColor:colors.blue },
  slotTxt:        { color:colors.textMuted, fontSize:typography.size.heading3, fontWeight:typography.weight.regular },
  slotTxtOn:      { color:colors.blue, fontWeight:typography.weight.medium },
  slotBadge:      { marginTop:spacing.xs, paddingHorizontal:spacing.sm, paddingVertical:spacing.xxs, borderRadius:radius.sm, backgroundColor:colors.accentSoft },
  slotBadgePopular:{ backgroundColor:colors.accentSoft },
  slotBadgeLast:  { backgroundColor:colors.redSoft },
  slotBadgeTxt:   { color:colors.accent, fontSize:typography.size.xs },

  /* Couverts */
  couvCard:    { marginHorizontal:spacing.xxl, backgroundColor:colors.card, borderRadius:radius.xxl, borderWidth:1, borderColor:colors.cardBorder, overflow:'hidden' },
  couvRow:     { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:spacing.xxl, paddingVertical:spacing.xl },
  couvInfo:    { flexDirection:'row', alignItems:'center', gap:spacing.lg },
  couvIconWrap:{ width:40, height:40, borderRadius:radius.lg, backgroundColor:colors.cardHover, alignItems:'center', justifyContent:'center' },
  couvEmoji:   { fontSize:20 },
  couvLabel:   { color:colors.text, fontSize:typography.size.bodyLg, fontWeight:typography.weight.regular, marginBottom:2 },
  couvSub:     { color:colors.textDim, fontSize:typography.size.caption },
  couvDivider: { height:1, backgroundColor:colors.cardBorder, marginHorizontal:spacing.xxl },

  /* Occasion */
  occasionGrid:   { flexDirection:'row', flexWrap:'wrap', gap:spacing.lg, paddingHorizontal:spacing.xxl },
  occasionChip:   { width:'30%', flexGrow:1, alignItems:'center', paddingVertical:spacing.lg, borderRadius:radius.xl, backgroundColor:colors.card, borderWidth:1, borderColor:colors.cardBorder, gap:spacing.sm, position:'relative' },
  occasionChipOn: { backgroundColor:colors.accentSoft, borderColor:colors.accent },
  occasionIcon:   { fontSize:22 },
  occasionLabel:  { color:colors.textMuted, fontSize:typography.size.caption, textAlign:'center' },
  occasionLabelOn:{ color:colors.accent },
  occasionCheck:  { position:'absolute', top:7, right:7, width:16, height:16, borderRadius:8, backgroundColor:'rgba(232,160,69,0.2)', alignItems:'center', justifyContent:'center' },

  /* Note */
  noteWrap:  { marginHorizontal:spacing.xxl, backgroundColor:colors.card, borderRadius:radius.xl, borderWidth:1, borderColor:colors.cardBorder },
  noteInput: { color:colors.text, fontSize:typography.size.bodyLg, fontWeight:typography.weight.regular, padding:spacing.xl, minHeight:90, textAlignVertical:'top' },

  /* Résumé */
  summaryCard:  { margin:spacing.xxl, backgroundColor:colors.card, borderRadius:radius.xxl, borderWidth:1, borderColor:'rgba(232,160,69,0.3)', padding:spacing.xl },
  summaryTitle: { color:colors.textDim, fontSize:typography.size.xs, letterSpacing:4, marginBottom:spacing.lg },
  sumRow:       { flexDirection:'row', alignItems:'center', gap:spacing.lg, paddingVertical:spacing.sm+2 },
  sumBorder:    { borderBottomWidth:1, borderBottomColor:colors.cardBorder },
  sumIcon:      { fontSize:15, width:22 },
  sumLbl:       { color:colors.textMuted, fontSize:typography.size.bodyLg, flex:1 },
  sumVal:       { color:colors.text, fontSize:typography.size.bodyLg, fontWeight:typography.weight.regular, textAlign:'right', flexShrink:1, maxWidth:'55%' },

  /* Erreur */
  errorBox: { marginHorizontal:spacing.xxl, marginBottom:spacing.lg, backgroundColor:colors.redSoft, borderRadius:radius.lg, padding:spacing.lg, borderWidth:1, borderColor:'rgba(224,90,90,0.3)' },
  errorTxt: { color:colors.red, fontSize:typography.size.body },

  /* Bouton confirmer */
  confirmBtn:     { flexDirection:'row', alignItems:'center', justifyContent:'center', gap:spacing.lg, marginHorizontal:spacing.xxl, backgroundColor:colors.accent, borderRadius:radius.xxl, paddingVertical:17 },
  confirmBtnDim:  { opacity:0.4 },
  confirmBtnTxt:  { color:colors.bg, fontSize:typography.size.bodyLg, fontWeight:typography.weight.medium, letterSpacing:1.5 },
  confirmBtnArrow:{ color:colors.bg, fontSize:18, fontWeight:typography.weight.regular },

  /* Note légale */
  legalTxt: { marginHorizontal:spacing.xxl, marginTop:spacing.lg, color:colors.textDim, fontSize:typography.size.sm, lineHeight:16, textAlign:'center', fontStyle:'italic' },

  /* ── Succès ── */
  successWrap:      { alignItems:'center', paddingHorizontal:spacing.section-4, paddingTop:48 },
  successRing:      { width:100, height:100, borderRadius:50, borderWidth:1, borderColor:'rgba(76,175,130,0.25)', backgroundColor:'rgba(76,175,130,0.04)', alignItems:'center', justifyContent:'center', marginBottom:spacing.xxl },
  successCheck:     { width:72, height:72, borderRadius:36, backgroundColor:colors.greenSoft, borderWidth:2, borderColor:colors.green, alignItems:'center', justifyContent:'center' },
  successCheckTxt:  { color:colors.green, fontSize:32, fontWeight:typography.weight.regular },
  successTitle:     { color:colors.text, fontSize:26, fontWeight:typography.weight.regular, letterSpacing:0.5, marginBottom:spacing.md, textAlign:'center' },
  successSub:       { color:colors.textMuted, fontSize:typography.size.bodyLg, textAlign:'center', marginBottom:spacing.section-4, lineHeight:20 },
  successCard:      { width:'100%', backgroundColor:colors.card, borderRadius:spacing.xxl, borderWidth:1, borderColor:'rgba(232,160,69,0.3)', overflow:'hidden', marginBottom:spacing.lg },
  successPhoto:     { width:'100%', height:120 },
  successCardBody:  { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:spacing.xl, paddingVertical:spacing.lg },
  successRestoName: { color:colors.accent, fontSize:typography.size.heading3, fontWeight:typography.weight.regular, letterSpacing:0.3 },
  successRating:    { color:colors.accent, fontSize:typography.size.bodyLg },
  successDivider:   { height:1, backgroundColor:colors.cardBorder },
  successDetails:   { padding:spacing.xl, gap:spacing.lg },
  successDetailItem:{ flexDirection:'row', alignItems:'center', gap:spacing.lg },
  successDetailIcon:{ fontSize:18, width:26 },
  successDetailLabel:{ color:colors.textDim, fontSize:typography.size.xs, letterSpacing:2, marginBottom:2 },
  successDetailVal: { color:colors.text, fontSize:typography.size.bodyLg, fontWeight:typography.weight.regular },
  successStatus:    { flexDirection:'row', alignItems:'center', gap:spacing.md, width:'100%', backgroundColor:colors.card, borderRadius:radius.lg, padding:spacing.lg, borderWidth:1, borderColor:colors.cardBorder, marginBottom:spacing.xxxl },
  successStatusDot: { width:7, height:7, borderRadius:4, backgroundColor:colors.accent },
  successStatusTxt: { color:colors.textMuted, fontSize:typography.size.body, flex:1 },
  successBtn:        { width:'100%', backgroundColor:colors.accent, borderRadius:radius.xxl, paddingVertical:15, alignItems:'center', marginBottom:spacing.lg },
  successBtnTxt:     { color:colors.bg, fontSize:typography.size.bodyLg, fontWeight:typography.weight.medium, letterSpacing:2 },
  successBtnOutline: { width:'100%', borderRadius:radius.xxl, paddingVertical:15, alignItems:'center', borderWidth:1, borderColor:colors.cardBorder },
  successBtnOutlineTxt:{ color:colors.textMuted, fontSize:typography.size.bodyLg },
});
