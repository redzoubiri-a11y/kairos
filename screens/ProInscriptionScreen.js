import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, SafeAreaView } from 'react-native';
import { supabase } from '../supabase';

const C = {
  bg:'#0d1628', bg2:'#111827', bg3:'#1a2332',
  accent:'#c8975a', accent2:'#4a7fa5',
  text:'#f0ece4', dim:'#8a9ab0', dimmer:'#4a5568',
  border:'rgba(255,255,255,0.07)', red:'#c0392b',
};

function Field({ label, value, onChangeText, placeholder, keyboardType }) {
  return (
    <View style={s.fieldWrap}>
      <Text style={s.fieldLabel}>{label}</Text>
      <TextInput
        style={s.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={C.dimmer}
        keyboardType={keyboardType || 'default'}
        autoCapitalize="none"
      />
    </View>
  );
}

export default function ProInscriptionScreen({ navigation }) {
  const [form, setForm] = useState({ nom: '', prenom: '', restaurant: '', adresse: '', ville: '', telephone: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const set = (key) => (val) => setForm(prev => ({ ...prev, [key]: val }));

  async function soumettre() {
    if (!form.nom || !form.prenom || !form.restaurant || !form.telephone) {
      setError('Nom, prénom, restaurant et téléphone sont obligatoires');
      return;
    }
    setLoading(true);
    setError('');
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setError('Vous devez être connecté pour soumettre une demande.'); setLoading(false); return; }
    const { error: err } = await supabase.from('pro_requests').insert({
      user_id: session.user.id,
      first_name:   form.prenom,
      last_name:    form.nom,
      restaurant_name: form.restaurant,
      address:      form.adresse,
      city:         form.ville,
      phone:        form.telephone,
      status:       'pending',
    });
    console.log('[Supabase error]', err);
    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    } else {
      setSuccess(true);
      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer re_4r96SqBU_Bx1ad4EV3s93NvieWfMMEs3a',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'KAIROS <onboarding@resend.dev>',
          to: ['red.zoubiri@gmail.com'],
          subject: `Nouvelle demande PRO — ${form.restaurant}`,
          html: `
            <h2>Nouvelle demande d'accès PRO</h2>
            <table cellpadding="8" style="border-collapse:collapse">
              <tr><td><b>Prénom :</b></td><td>${form.prenom}</td></tr>
              <tr><td><b>Nom :</b></td><td>${form.nom}</td></tr>
              <tr><td><b>Restaurant :</b></td><td>${form.restaurant}</td></tr>
              <tr><td><b>Téléphone :</b></td><td>${form.telephone}</td></tr>
              <tr><td><b>Adresse :</b></td><td>${form.adresse || '—'}</td></tr>
              <tr><td><b>Ville :</b></td><td>${form.ville || '—'}</td></tr>
              <tr><td><b>Email :</b></td><td>${session.user.email}</td></tr>
              <tr><td><b>Date :</b></td><td>${new Date().toLocaleString('fr-FR')}</td></tr>
            </table>
          `,
        }),
      });
      const resendData = await resendRes.json();
      console.log('[Resend]', JSON.stringify(resendData));
      setSuccess(true);
    }
    setLoading(false);
  }

  if (success) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.successWrap}>
          <Text style={s.successEmoji}>🍽️</Text>
          <Text style={s.successTitle}>Demande envoyée</Text>
          <Text style={s.successSub}>Notre équipe examine votre candidature et vous contacte dans les 48h.</Text>
          <TouchableOpacity style={s.successBtn} onPress={() => navigation.goBack()}>
            <Text style={s.successBtnTxt}>RETOUR AU PROFIL</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backBtnTxt}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerSub}>espace pro</Text>
          <Text style={s.headerTitle}>Devenir restaurateur</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={s.intro}>
          <Text style={s.introTxt}>Rejoignez MIDA et gérez vos réservations depuis votre tableau de bord professionnel.</Text>
        </View>

        <Text style={s.sectionLabel}>VOS INFORMATIONS</Text>
        <Field label="Prénom"  value={form.prenom}    onChangeText={set('prenom')}    placeholder="Votre prénom" />
        <Field label="Nom"     value={form.nom}       onChangeText={set('nom')}       placeholder="Votre nom" />
        <Field label="Téléphone" value={form.telephone} onChangeText={set('telephone')} placeholder="+213 6XX XXX XXX" keyboardType="phone-pad" />

        <Text style={s.sectionLabel}>VOTRE RESTAURANT</Text>
        <Field label="Nom du restaurant" value={form.restaurant} onChangeText={set('restaurant')} placeholder="Ex: Dar Zitoun" />
        <Field label="Adresse"           value={form.adresse}    onChangeText={set('adresse')}    placeholder="Rue, numéro" />
        <Field label="Ville"             value={form.ville}      onChangeText={set('ville')}      placeholder="Alger, Oran…" />

        {error ? <Text style={s.error}>{error}</Text> : null}

        <TouchableOpacity style={s.submitBtn} onPress={soumettre} disabled={loading}>
          <Text style={s.submitBtnTxt}>{loading ? '...' : 'ENVOYER MA CANDIDATURE'}</Text>
        </TouchableOpacity>

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container:     { flex: 1, backgroundColor: C.bg },
  header:        { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: C.border },
  backBtn:       { width: 38, height: 38, borderRadius: 19, backgroundColor: C.bg2, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  backBtnTxt:    { color: C.text, fontSize: 18 },
  headerSub:     { color: C.accent, fontSize: 10, fontStyle: 'italic', letterSpacing: 2 },
  headerTitle:   { color: C.text, fontSize: 20, fontWeight: '300', letterSpacing: 0.5 },
  intro:         { margin: 20, padding: 16, backgroundColor: 'rgba(200,151,90,0.08)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(200,151,90,0.2)' },
  introTxt:      { color: C.dim, fontSize: 13, fontWeight: '300', lineHeight: 20 },
  sectionLabel:  { color: C.dimmer, fontSize: 10, letterSpacing: 5, paddingHorizontal: 20, marginTop: 20, marginBottom: 10, textTransform: 'uppercase' },
  fieldWrap:     { marginHorizontal: 20, marginBottom: 12 },
  fieldLabel:    { color: C.dim, fontSize: 11, letterSpacing: 1, marginBottom: 6 },
  input:         { backgroundColor: C.bg2, borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: C.text, fontSize: 14, fontWeight: '300' },
  error:         { color: C.red, fontSize: 12, textAlign: 'center', marginHorizontal: 20, marginTop: 8, marginBottom: 4 },
  submitBtn:     { marginHorizontal: 20, marginTop: 20, backgroundColor: C.accent, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  submitBtnTxt:  { color: C.bg, fontSize: 13, fontWeight: '500', letterSpacing: 2 },
  successWrap:   { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  successEmoji:  { fontSize: 64, marginBottom: 20 },
  successTitle:  { color: C.text, fontSize: 24, fontWeight: '300', letterSpacing: 0.5, marginBottom: 10 },
  successSub:    { color: C.dim, fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: 32 },
  successBtn:    { backgroundColor: C.accent, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 32 },
  successBtnTxt: { color: C.bg, fontSize: 13, fontWeight: '500', letterSpacing: 2 },
});
