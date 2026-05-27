import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, TextInput, ActivityIndicator,
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

const HEURES   = ['12:00','12:30','13:00','13:30','19:00','19:30','20:00','20:30','21:00','21:30'];
const COUVERTS = [1,2,3,4,5,6,7,8];
const ENFANTS  = [0,1,2,3,4,5,6];

function buildDays() {
  const days = [];
  const today = new Date();
  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push({
      label: d.toLocaleDateString('fr-FR', { weekday:'short', day:'numeric', month:'short' }),
      value: d.toISOString().split('T')[0],
    });
  }
  return days;
}

const DAYS = buildDays();

export default function ReservationFormScreen({ route, navigation }) {
  const restaurant = route?.params?.restaurant || { name: 'Restaurant', id: null };

  const [date,     setDate]     = useState(null);
  const [heure,    setHeure]    = useState(null);
  const [adults,   setAdults]   = useState(2);
  const [children, setChildren] = useState(0);
  const [notes,    setNotes]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState(false);
  const [userId,   setUserId]   = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const u = data?.user;
      if (!u) return;
      supabase.from('users').select('id').eq('auth_id', u.id).single()
        .then(({ data: row }) => { if (row) setUserId(row.id); });
    });
  }, []);

  async function confirmer() {
    if (!date || !heure) {
      setError('Choisissez une date et une heure.');
      return;
    }
    if (!userId) {
      setError('Connectez-vous pour réserver.');
      return;
    }
    if (!restaurant.id) {
      setError('Restaurant introuvable.');
      return;
    }

    setLoading(true);
    setError('');

    const { error: resaErr } = await supabase.from('reservations').insert({
      user_id:       userId,
      restaurant_id: restaurant.id,
      date,
      time_slot:     heure,
      nb_adults:     adults,
      nb_children:   children,
      notes:         notes.trim() || null,
    });

    if (resaErr) {
      setError(resaErr.message);
      setLoading(false);
      return;
    }

    // Notification de confirmation
    await supabase.from('notifications').insert({
      recipient_id:   userId,
      recipient_type: 'user',
      type:           'new_resa',
      title:          'Demande envoyée',
      body:           `Votre réservation chez ${restaurant.name} le ${date} à ${heure} pour ${adults} personne${adults > 1 ? 's' : ''} est en attente de confirmation.`,
    });

    setLoading(false);
    setSuccess(true);
  }

  /* ── Écran de succès ── */
  if (success) {
    return (
      <SafeAreaView style={s.root}>
        <View style={s.successWrap}>
          <View style={s.successIconWrap}>
            <Text style={s.successIcon}>📅</Text>
          </View>
          <Text style={s.successTitle}>Demande envoyée !</Text>
          <Text style={s.successSub}>
            Votre réservation chez{'\n'}
            <Text style={s.successAccent}>{restaurant.name}</Text>
            {'\n'}le {date} à {heure} pour {adults} personne{adults > 1 ? 's' : ''}
            {'\n'}est en attente de confirmation.
          </Text>
          <View style={s.successInfo}>
            <Text style={s.successInfoTxt}>⏳  Vous recevrez une notification{'\n'}dès que le restaurant confirme.</Text>
          </View>
          <TouchableOpacity style={s.successBtn} onPress={() => navigation.navigate('Main')}>
            <Text style={s.successBtnTxt}>RETOUR À L'ACCUEIL</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.successBtnOutline} onPress={() => navigation.goBack()}>
            <Text style={s.successBtnOutlineTxt}>Faire une autre réservation</Text>
          </TouchableOpacity>
        </View>
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
          <Text style={s.headerSub}>réserver une table</Text>
          <Text style={s.headerTitle} numberOfLines={1}>{restaurant.name}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Date */}
        <Text style={s.sectionLabel}>DATE</Text>
        <ScrollView
          horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.chipRow}
        >
          {DAYS.map((d, i) => (
            <TouchableOpacity
              key={i}
              style={[s.dateChip, date === d.value && s.dateChipOn]}
              onPress={() => setDate(d.value)}
            >
              <Text style={[s.dateTxt, date === d.value && s.dateTxtOn]}>{d.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Heure */}
        <Text style={s.sectionLabel}>HEURE</Text>
        <View style={s.heuresGrid}>
          {HEURES.map((h) => (
            <TouchableOpacity
              key={h}
              style={[s.heureChip, heure === h && s.heureChipOn]}
              onPress={() => setHeure(h)}
            >
              <Text style={[s.heureTxt, heure === h && s.heureTxtOn]}>{h}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Adultes */}
        <Text style={s.sectionLabel}>ADULTES</Text>
        <View style={s.numRow}>
          {COUVERTS.map((n) => (
            <TouchableOpacity
              key={n}
              style={[s.numChip, adults === n && s.numChipOn]}
              onPress={() => setAdults(n)}
            >
              <Text style={[s.numTxt, adults === n && s.numTxtOn]}>{n}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Enfants */}
        <Text style={s.sectionLabel}>ENFANTS</Text>
        <View style={s.numRow}>
          {ENFANTS.map((n) => (
            <TouchableOpacity
              key={n}
              style={[s.numChip, children === n && s.numChipOn]}
              onPress={() => setChildren(n)}
            >
              <Text style={[s.numTxt, children === n && s.numTxtOn]}>{n}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Note optionnelle */}
        <Text style={s.sectionLabel}>NOTE (optionnel)</Text>
        <View style={s.inputWrap}>
          <TextInput
            style={s.input}
            placeholder="Allergie, occasion spéciale, demande particulière…"
            placeholderTextColor={C.dimmer}
            value={notes}
            onChangeText={setNotes}
            multiline
            maxLength={200}
          />
        </View>

        {/* Récapitulatif */}
        <View style={s.summaryCard}>
          <Text style={s.summaryTitle}>RÉCAPITULATIF</Text>
          <Row label="Restaurant" val={restaurant.name} />
          <Row label="Date"       val={date  || '—'} />
          <Row label="Heure"      val={heure || '—'} accent />
          <Row label="Couverts"   val={`${adults} adulte${adults > 1 ? 's' : ''}${children > 0 ? ` · ${children} enfant${children > 1 ? 's' : ''}` : ''}`} last />
        </View>

        {/* Erreur */}
        {!!error && (
          <View style={s.errorBox}>
            <Text style={s.errorTxt}>⚠️  {error}</Text>
          </View>
        )}

        {/* Bouton */}
        <TouchableOpacity
          style={[s.confirmBtn, (!date || !heure || loading) && s.confirmBtnDim]}
          onPress={confirmer}
          disabled={loading || !date || !heure}
        >
          {loading
            ? <ActivityIndicator color={C.bg} />
            : <Text style={s.confirmBtnTxt}>CONFIRMER LA RÉSERVATION</Text>
          }
        </TouchableOpacity>

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, val, accent, last }) {
  return (
    <View style={[s.summaryRow, !last && s.summaryBorder]}>
      <Text style={s.summaryLbl}>{label}</Text>
      <Text style={[s.summaryVal, accent && { color: C.accent2 }]}>{val}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root:              { flex: 1, backgroundColor: C.bg },

  /* Header */
  header:            { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: C.border },
  backBtn:           { width: 38, height: 38, borderRadius: 19, backgroundColor: C.bg2, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  backBtnTxt:        { color: C.text, fontSize: 18 },
  headerSub:         { color: C.accent, fontSize: 10, fontStyle: 'italic', letterSpacing: 2 },
  headerTitle:       { color: C.text, fontSize: 20, fontWeight: '300', letterSpacing: 0.5 },

  /* Sections */
  sectionLabel:      { color: C.dimmer, fontSize: 10, letterSpacing: 4, paddingHorizontal: 20, marginTop: 22, marginBottom: 12 },
  chipRow:           { paddingHorizontal: 20, paddingBottom: 4, gap: 8 },

  /* Date chips */
  dateChip:          { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, backgroundColor: C.bg2, borderWidth: 1, borderColor: C.border, alignItems: 'center' },
  dateChipOn:        { backgroundColor: 'rgba(200,151,90,0.12)', borderColor: C.accent },
  dateTxt:           { color: C.dim, fontSize: 12, fontWeight: '300' },
  dateTxtOn:         { color: C.accent },

  /* Heure grid */
  heuresGrid:        { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 20 },
  heureChip:         { width: '22%', paddingVertical: 13, borderRadius: 12, backgroundColor: C.bg2, borderWidth: 1, borderColor: C.border, alignItems: 'center' },
  heureChipOn:       { backgroundColor: 'rgba(74,127,165,0.15)', borderColor: C.accent2 },
  heureTxt:          { color: C.dim, fontSize: 13 },
  heureTxtOn:        { color: C.accent2, fontWeight: '500' },

  /* Num chips */
  numRow:            { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 20 },
  numChip:           { width: 46, height: 46, borderRadius: 23, backgroundColor: C.bg2, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  numChipOn:         { backgroundColor: 'rgba(200,151,90,0.12)', borderColor: C.accent },
  numTxt:            { color: C.dim, fontSize: 15 },
  numTxtOn:          { color: C.accent, fontWeight: '500' },

  /* Note input */
  inputWrap:         { marginHorizontal: 20, backgroundColor: C.bg2, borderRadius: 14, borderWidth: 1, borderColor: C.border },
  input:             { color: C.text, fontSize: 13, fontWeight: '300', padding: 14, minHeight: 70, textAlignVertical: 'top' },

  /* Récap */
  summaryCard:       { margin: 20, backgroundColor: C.bg2, borderRadius: 16, borderWidth: 1, borderColor: C.borderAccent, padding: 16 },
  summaryTitle:      { color: C.dimmer, fontSize: 9, letterSpacing: 4, marginBottom: 12 },
  summaryRow:        { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 9 },
  summaryBorder:     { borderBottomWidth: 1, borderBottomColor: C.border },
  summaryLbl:        { color: C.dim, fontSize: 13 },
  summaryVal:        { color: C.text, fontSize: 13, fontWeight: '300' },

  /* Erreur */
  errorBox:          { marginHorizontal: 20, marginBottom: 14, backgroundColor: 'rgba(224,90,90,0.1)', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: 'rgba(224,90,90,0.3)' },
  errorTxt:          { color: C.red, fontSize: 12 },

  /* Bouton confirmer */
  confirmBtn:        { marginHorizontal: 20, backgroundColor: C.accent, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  confirmBtnDim:     { opacity: 0.5 },
  confirmBtnTxt:     { color: C.bg, fontSize: 13, fontWeight: '500', letterSpacing: 2 },

  /* Succès */
  successWrap:       { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 36 },
  successIconWrap:   { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(200,151,90,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 24, borderWidth: 1, borderColor: 'rgba(200,151,90,0.3)' },
  successIcon:       { fontSize: 38 },
  successTitle:      { color: C.text, fontSize: 24, fontWeight: '300', letterSpacing: 0.5, marginBottom: 16, textAlign: 'center' },
  successSub:        { color: C.dim, fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 20 },
  successAccent:     { color: C.accent },
  successInfo:       { backgroundColor: C.bg2, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: C.border, marginBottom: 28, width: '100%' },
  successInfoTxt:    { color: C.dim, fontSize: 13, textAlign: 'center', lineHeight: 20 },
  successBtn:        { backgroundColor: C.accent, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 32, marginBottom: 12, width: '100%', alignItems: 'center' },
  successBtnTxt:     { color: C.bg, fontSize: 13, fontWeight: '500', letterSpacing: 2 },
  successBtnOutline: { borderRadius: 14, paddingVertical: 14, paddingHorizontal: 32, borderWidth: 1, borderColor: C.border, width: '100%', alignItems: 'center' },
  successBtnOutlineTxt: { color: C.dim, fontSize: 13 },
});
