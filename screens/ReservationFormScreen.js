import { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, TextInput, ActivityIndicator, Image, Animated,
} from 'react-native';
import { supabase } from '../supabase';

const C = {
  bg:'#0d1628', bg2:'#111827', bg3:'#1a2332',
  accent:'#c8975a', accent2:'#4a7fa5',
  text:'#f0ece4', dim:'#8a9ab0', dimmer:'#4a5568',
  green:'#3d9970', card:'#141e2e',
  border:'rgba(255,255,255,0.07)',
  borderAccent:'rgba(200,151,90,0.25)',
  red:'#e05a5a',
};

const MIDI_SLOTS = ['12:00','12:30','13:00','13:30','14:00'];
const SOIR_SLOTS = ['19:00','19:30','20:00','20:30','21:00','21:30','22:00'];

function buildDays() {
  const days = [];
  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push({
      dayName: d.toLocaleDateString('fr-FR', { weekday: 'short' }).toUpperCase(),
      dayNum:  d.getDate(),
      month:   d.toLocaleDateString('fr-FR', { month: 'short' }),
      value:   d.toISOString().split('T')[0],
      isToday: i === 0,
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

export default function ReservationFormScreen({ route, navigation }) {
  const restaurant = route?.params?.restaurant || { name: 'Restaurant', id: null, photo_url: null, avg_rating: null };

  const [date,     setDate]     = useState(null);
  const [heure,    setHeure]    = useState(null);
  const [adults,   setAdults]   = useState(2);
  const [children, setChildren] = useState(0);
  const [notes,    setNotes]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState(false);
  const [userId,   setUserId]   = useState(null);
  const successAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const u = data?.user;
      if (!u) return;
      supabase.from('users').select('id').eq('auth_id', u.id).single()
        .then(({ data: row }) => { if (row) setUserId(row.id); });
    });
  }, []);

  useEffect(() => {
    if (success) {
      Animated.spring(successAnim, { toValue: 1, useNativeDriver: true, tension: 55, friction: 8 }).start();
    }
  }, [success]);

  async function confirmer() {
    if (!date || !heure) { setError('Choisissez une date et une heure.'); return; }
    if (!userId)         { setError('Connectez-vous pour réserver.'); return; }
    if (!restaurant.id)  { setError('Restaurant introuvable.'); return; }

    setLoading(true); setError('');

    const { error: resaErr } = await supabase.from('reservations').insert({
      user_id:       userId,
      restaurant_id: restaurant.id,
      date,
      time_slot:     heure,
      nb_adults:     adults,
      nb_children:   children,
      notes:         notes.trim() || null,
    });

    if (resaErr) { setError(resaErr.message); setLoading(false); return; }

    await supabase.from('notifications').insert({
      recipient_id:   userId,
      recipient_type: 'user',
      type:           'new_resa',
      title:          'Demande envoyée',
      body:           `Votre réservation chez ${restaurant.name} le ${formatDateLong(date)} à ${heure} pour ${adults} personne${adults > 1 ? 's' : ''} est en attente de confirmation.`,
    });

    setLoading(false);
    setSuccess(true);
  }

  /* ── Écran succès ── */
  if (success) {
    return (
      <SafeAreaView style={s.root}>
        <Animated.View style={[s.successWrap, {
          opacity: successAnim,
          transform: [{ scale: successAnim.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }],
        }]}>
          <View style={s.successCheck}>
            <Text style={s.successCheckTxt}>✓</Text>
          </View>
          <Text style={s.successTitle}>Demande envoyée !</Text>

          <View style={s.successCard}>
            <Text style={s.successRestoName}>{restaurant.name}</Text>
            <View style={s.successDivider} />
            <View style={s.successRow}>
              <Text style={s.successRowIcon}>📅</Text>
              <Text style={s.successRowTxt}>{formatDateLong(date)}</Text>
            </View>
            <View style={s.successRow}>
              <Text style={s.successRowIcon}>🕐</Text>
              <Text style={[s.successRowTxt, { color: C.accent2 }]}>{heure}</Text>
            </View>
            <View style={s.successRow}>
              <Text style={s.successRowIcon}>👥</Text>
              <Text style={s.successRowTxt}>
                {adults} adulte{adults > 1 ? 's' : ''}
                {children > 0 ? ` · ${children} enfant${children > 1 ? 's' : ''}` : ''}
              </Text>
            </View>
          </View>

          <View style={s.successInfo}>
            <Text style={s.successInfoTxt}>⏳  En attente de confirmation du restaurant.{'\n'}Vous serez notifié(e) dès validation.</Text>
          </View>

          <TouchableOpacity style={s.successBtn} onPress={() => navigation.navigate('Main')}>
            <Text style={s.successBtnTxt}>RETOUR À L'ACCUEIL</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.successBtnOutline} onPress={() => { setSuccess(false); setDate(null); setHeure(null); setNotes(''); successAnim.setValue(0); }}>
            <Text style={s.successBtnOutlineTxt}>Faire une autre réservation</Text>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    );
  }

  /* ── Formulaire ── */
  return (
    <SafeAreaView style={s.root}>

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backBtnTxt}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerSub}>RÉSERVER UNE TABLE</Text>
          <Text style={s.headerTitle} numberOfLines={1}>{restaurant.name}</Text>
        </View>
        {!!restaurant.avg_rating && (
          <View style={s.ratingPill}>
            <Text style={s.ratingTxt}>★ {Number(restaurant.avg_rating).toFixed(1)}</Text>
          </View>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Photo bannière */}
        {restaurant.photo_url
          ? <Image source={{ uri: restaurant.photo_url }} style={s.banner} resizeMode="cover" />
          : <View style={[s.banner, s.bannerPlaceholder]}><Text style={{ fontSize: 40 }}>🍽️</Text></View>
        }

        {/* ── DATE ── */}
        <View style={s.sectionHeader}>
          <Text style={s.sectionLabel}>DATE</Text>
          {date && <Text style={s.sectionVal}>{formatDateLong(date)}</Text>}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.dateRow}>
          {DAYS.map(d => (
            <TouchableOpacity
              key={d.value}
              style={[s.dateCard, date === d.value && s.dateCardOn, d.isToday && !date && s.dateCardToday]}
              onPress={() => setDate(d.value)}
            >
              <Text style={[s.dateDayName, date === d.value && s.dateTxtOn, d.isToday && date !== d.value && { color: C.accent2 }]}>
                {d.isToday ? 'AUJ.' : d.dayName}
              </Text>
              <Text style={[s.dateDayNum, date === d.value && s.dateTxtOn]}>{d.dayNum}</Text>
              <Text style={[s.dateMonth, date === d.value && s.dateTxtOn]}>{d.month}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── HEURE ── */}
        <View style={s.sectionHeader}>
          <Text style={s.sectionLabel}>HEURE</Text>
          {heure && <Text style={[s.sectionVal, { color: C.accent2 }]}>{heure}</Text>}
        </View>

        <Text style={s.slotGroup}>☀️  Déjeuner</Text>
        <View style={s.slotsWrap}>
          {MIDI_SLOTS.map(h => (
            <TouchableOpacity key={h} style={[s.slotChip, heure === h && s.slotChipOn]} onPress={() => setHeure(h)}>
              <Text style={[s.slotTxt, heure === h && s.slotTxtOn]}>{h}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[s.slotGroup, { marginTop: 14 }]}>🌙  Dîner</Text>
        <View style={s.slotsWrap}>
          {SOIR_SLOTS.map(h => (
            <TouchableOpacity key={h} style={[s.slotChip, heure === h && s.slotChipOn]} onPress={() => setHeure(h)}>
              <Text style={[s.slotTxt, heure === h && s.slotTxtOn]}>{h}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── COUVERTS ── */}
        <Text style={[s.sectionLabel, { marginTop: 24 }]}>COUVERTS</Text>
        <View style={s.couvCard}>
          <View style={s.couvRow}>
            <View style={s.couvInfo}>
              <Text style={s.couvEmoji}>🧑</Text>
              <View>
                <Text style={s.couvLabel}>Adultes</Text>
                <Text style={s.couvSub}>Âge 13+</Text>
              </View>
            </View>
            <Stepper value={adults} min={1} max={20} onChange={setAdults} />
          </View>
          <View style={s.couvDivider} />
          <View style={s.couvRow}>
            <View style={s.couvInfo}>
              <Text style={s.couvEmoji}>👶</Text>
              <View>
                <Text style={s.couvLabel}>Enfants</Text>
                <Text style={s.couvSub}>Moins de 13 ans</Text>
              </View>
            </View>
            <Stepper value={children} min={0} max={10} onChange={setChildren} />
          </View>
        </View>

        {/* ── NOTE ── */}
        <Text style={[s.sectionLabel, { marginTop: 24 }]}>NOTE (optionnel)</Text>
        <View style={s.inputWrap}>
          <TextInput
            style={s.input}
            placeholder="Allergie, occasion spéciale, demande particulière…"
            placeholderTextColor={C.dimmer}
            value={notes}
            onChangeText={setNotes}
            multiline
            maxLength={300}
          />
          <Text style={s.charCount}>{notes.length}/300</Text>
        </View>

        {/* ── RÉCAP ── */}
        <View style={s.summaryCard}>
          <Text style={s.summaryTitle}>RÉCAPITULATIF</Text>
          <SumRow icon="🍽️" label="Restaurant" val={restaurant.name} />
          <SumRow icon="📅" label="Date"       val={date ? formatDateLong(date) : '—'} />
          <SumRow icon="🕐" label="Heure"      val={heure || '—'} accent />
          <SumRow icon="👥" label="Couverts"
            val={`${adults} adulte${adults > 1 ? 's' : ''}${children > 0 ? ` · ${children} enfant${children > 1 ? 's' : ''}` : ''}`}
            last
          />
        </View>

        {!!error && (
          <View style={s.errorBox}>
            <Text style={s.errorTxt}>⚠️  {error}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[s.confirmBtn, (!date || !heure || loading) && s.confirmBtnDim]}
          onPress={confirmer}
          disabled={loading || !date || !heure}
        >
          {loading
            ? <ActivityIndicator color={C.bg} />
            : <Text style={s.confirmBtnTxt}>CONFIRMER LA RÉSERVATION  →</Text>
          }
        </TouchableOpacity>

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Stepper({ value, min, max, onChange }) {
  return (
    <View style={st.row}>
      <TouchableOpacity style={[st.btn, value <= min && st.btnDim]} onPress={() => onChange(v => Math.max(min, v - 1))} disabled={value <= min}>
        <Text style={st.txt}>−</Text>
      </TouchableOpacity>
      <Text style={st.val}>{value}</Text>
      <TouchableOpacity style={[st.btn, value >= max && st.btnDim]} onPress={() => onChange(v => Math.min(max, v + 1))} disabled={value >= max}>
        <Text style={st.txt}>+</Text>
      </TouchableOpacity>
    </View>
  );
}
const st = StyleSheet.create({
  row:    { flexDirection: 'row', alignItems: 'center', gap: 16 },
  btn:    { width: 36, height: 36, borderRadius: 18, backgroundColor: C.bg3, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  btnDim: { opacity: 0.3 },
  txt:    { color: C.text, fontSize: 22, fontWeight: '300', lineHeight: 28 },
  val:    { color: C.text, fontSize: 20, fontWeight: '300', minWidth: 30, textAlign: 'center' },
});

function SumRow({ icon, label, val, accent, last }) {
  return (
    <View style={[s.sumRow, !last && s.sumBorder]}>
      <Text style={s.sumIcon}>{icon}</Text>
      <Text style={s.sumLbl}>{label}</Text>
      <Text style={[s.sumVal, accent && { color: C.accent2 }]}>{val}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  /* Header */
  header:       { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  backBtn:      { width: 38, height: 38, borderRadius: 19, backgroundColor: C.bg2, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  backBtnTxt:   { color: C.text, fontSize: 18 },
  headerSub:    { color: C.accent, fontSize: 9, letterSpacing: 3, marginBottom: 2 },
  headerTitle:  { color: C.text, fontSize: 18, fontWeight: '300', letterSpacing: 0.5 },
  ratingPill:   { backgroundColor: 'rgba(200,151,90,0.12)', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(200,151,90,0.3)', paddingHorizontal: 10, paddingVertical: 5 },
  ratingTxt:    { color: C.accent, fontSize: 12, fontWeight: '500' },

  /* Banner */
  banner:            { width: '100%', height: 150 },
  bannerPlaceholder: { backgroundColor: C.bg2, alignItems: 'center', justifyContent: 'center' },

  /* Section headers */
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 22, marginBottom: 12 },
  sectionLabel:  { color: C.dimmer, fontSize: 10, letterSpacing: 4 },
  sectionVal:    { color: C.accent, fontSize: 11 },

  /* Date */
  dateRow:      { paddingHorizontal: 20, paddingBottom: 4, gap: 8 },
  dateCard:     { width: 62, paddingVertical: 12, borderRadius: 14, backgroundColor: C.bg2, borderWidth: 1, borderColor: C.border, alignItems: 'center', gap: 2 },
  dateCardOn:   { backgroundColor: 'rgba(200,151,90,0.12)', borderColor: C.accent },
  dateCardToday:{ borderColor: 'rgba(74,127,165,0.4)' },
  dateDayName:  { color: C.dimmer, fontSize: 9, letterSpacing: 1 },
  dateDayNum:   { color: C.text, fontSize: 20, fontWeight: '300' },
  dateMonth:    { color: C.dimmer, fontSize: 9 },
  dateTxtOn:    { color: C.accent },

  /* Slots */
  slotGroup:    { color: C.dim, fontSize: 11, paddingHorizontal: 20, marginBottom: 10 },
  slotsWrap:    { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 20 },
  slotChip:     { paddingHorizontal: 18, paddingVertical: 12, borderRadius: 12, backgroundColor: C.bg2, borderWidth: 1, borderColor: C.border },
  slotChipOn:   { backgroundColor: 'rgba(74,127,165,0.15)', borderColor: C.accent2 },
  slotTxt:      { color: C.dim, fontSize: 14, fontWeight: '300' },
  slotTxtOn:    { color: C.accent2, fontWeight: '500' },

  /* Couverts */
  couvCard:     { marginHorizontal: 20, backgroundColor: C.bg2, borderRadius: 16, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  couvRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18 },
  couvInfo:     { flexDirection: 'row', alignItems: 'center', gap: 12 },
  couvEmoji:    { fontSize: 26 },
  couvLabel:    { color: C.text, fontSize: 14, fontWeight: '300', marginBottom: 2 },
  couvSub:      { color: C.dimmer, fontSize: 11 },
  couvDivider:  { height: 1, backgroundColor: C.border, marginHorizontal: 18 },

  /* Note */
  inputWrap:    { marginHorizontal: 20, backgroundColor: C.bg2, borderRadius: 14, borderWidth: 1, borderColor: C.border },
  input:        { color: C.text, fontSize: 13, fontWeight: '300', padding: 14, minHeight: 80, textAlignVertical: 'top' },
  charCount:    { color: C.dimmer, fontSize: 10, textAlign: 'right', paddingRight: 12, paddingBottom: 8 },

  /* Summary */
  summaryCard:  { margin: 20, backgroundColor: C.bg2, borderRadius: 16, borderWidth: 1, borderColor: C.borderAccent, padding: 16 },
  summaryTitle: { color: C.dimmer, fontSize: 9, letterSpacing: 4, marginBottom: 12 },
  sumRow:       { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9 },
  sumBorder:    { borderBottomWidth: 1, borderBottomColor: C.border },
  sumIcon:      { fontSize: 14, width: 22 },
  sumLbl:       { color: C.dim, fontSize: 13, flex: 1 },
  sumVal:       { color: C.text, fontSize: 13, fontWeight: '300', textAlign: 'right', flexShrink: 1, maxWidth: '55%' },

  /* Error */
  errorBox:     { marginHorizontal: 20, marginBottom: 14, backgroundColor: 'rgba(224,90,90,0.1)', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: 'rgba(224,90,90,0.3)' },
  errorTxt:     { color: C.red, fontSize: 12 },

  /* Confirm */
  confirmBtn:    { marginHorizontal: 20, backgroundColor: C.accent, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  confirmBtnDim: { opacity: 0.45 },
  confirmBtnTxt: { color: C.bg, fontSize: 13, fontWeight: '500', letterSpacing: 1.5 },

  /* Success */
  successWrap:        { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  successCheck:       { width: 84, height: 84, borderRadius: 42, backgroundColor: 'rgba(61,153,112,0.12)', borderWidth: 2, borderColor: '#3d9970', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  successCheckTxt:    { color: '#3d9970', fontSize: 40, fontWeight: '300' },
  successTitle:       { color: C.text, fontSize: 26, fontWeight: '300', letterSpacing: 0.5, marginBottom: 20, textAlign: 'center' },
  successCard:        { width: '100%', backgroundColor: C.bg2, borderRadius: 18, borderWidth: 1, borderColor: C.borderAccent, padding: 20, marginBottom: 14 },
  successRestoName:   { color: C.accent, fontSize: 17, fontWeight: '300', letterSpacing: 0.5, marginBottom: 12, textAlign: 'center' },
  successDivider:     { height: 1, backgroundColor: C.border, marginBottom: 10 },
  successRow:         { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 5 },
  successRowIcon:     { fontSize: 15 },
  successRowTxt:      { color: C.text, fontSize: 14, fontWeight: '300' },
  successInfo:        { width: '100%', backgroundColor: C.bg2, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.border, marginBottom: 24 },
  successInfoTxt:     { color: C.dim, fontSize: 12, textAlign: 'center', lineHeight: 20 },
  successBtn:         { width: '100%', backgroundColor: C.accent, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginBottom: 10 },
  successBtnTxt:      { color: C.bg, fontSize: 13, fontWeight: '500', letterSpacing: 2 },
  successBtnOutline:  { width: '100%', borderRadius: 14, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  successBtnOutlineTxt: { color: C.dim, fontSize: 13 },
});
