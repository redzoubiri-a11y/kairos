import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, SafeAreaView } from 'react-native';
import { supabase } from '../supabase';
import { colors, typography, spacing, radius } from '../src/theme';

function Field({ label, value, onChangeText, placeholder, keyboardType }) {
  return (
    <View style={s.fieldWrap}>
      <Text style={s.fieldLabel}>{label}</Text>
      <TextInput
        style={s.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textDim}
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

  const set    = useCallback((key) => (val) => setForm(prev => ({ ...prev, [key]: val })), []);
  const goBack = useCallback(() => navigation.goBack(), [navigation]);

  const soumettre = useCallback(async () => {
    if (!form.nom || !form.prenom || !form.restaurant || !form.telephone) {
      setError('Nom, prénom, restaurant et téléphone sont obligatoires');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setError('Vous devez être connecté pour soumettre une demande.'); return; }
      const { error: err } = await supabase.from('pro_requests').insert({
        user_id:         session.user.id,
        first_name:      form.prenom,
        last_name:       form.nom,
        restaurant_name: form.restaurant,
        address:         form.adresse,
        city:            form.ville,
        phone:           form.telephone,
        status:          'pending',
      });
      console.log('[Supabase error]', err);
      if (err) { setError(err.message); return; }
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
    } finally {
      setLoading(false);
    }
  }, [form]);

  if (success) {
    return (
      <SafeAreaView style={s.root}>
        <View style={s.successWrap}>
          <View style={s.successRing}>
            <Text style={s.successEmoji}>🍽️</Text>
          </View>
          <Text style={s.successTitle}>Demande envoyée</Text>
          <Text style={s.successSub}>
            Notre équipe examine votre candidature{'\n'}et vous contacte dans les 48h.
          </Text>
          <TouchableOpacity style={s.successBtn} onPress={goBack}>
            <Text style={s.successBtnTxt}>RETOUR AU PROFIL</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.root}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={goBack}>
          <Text style={s.backBtnTxt}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerSub}>ESPACE PRO</Text>
          <Text style={s.headerTitle}>Devenir restaurateur</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        <View style={s.intro}>
          <Text style={s.introEmoji}>🏪</Text>
          <Text style={s.introTxt}>
            Rejoignez MIDA et gérez vos réservations depuis votre tableau de bord professionnel.
          </Text>
        </View>

        <Text style={s.sectionLabel}>VOS INFORMATIONS</Text>
        <Field label="Prénom"    value={form.prenom}    onChangeText={set('prenom')}    placeholder="Votre prénom" />
        <Field label="Nom"       value={form.nom}       onChangeText={set('nom')}       placeholder="Votre nom" />
        <Field label="Téléphone" value={form.telephone} onChangeText={set('telephone')} placeholder="+213 6XX XXX XXX" keyboardType="phone-pad" />

        <Text style={s.sectionLabel}>VOTRE RESTAURANT</Text>
        <Field label="Nom du restaurant" value={form.restaurant} onChangeText={set('restaurant')} placeholder="Ex: Dar Zitoun" />
        <Field label="Adresse"           value={form.adresse}    onChangeText={set('adresse')}    placeholder="Rue, numéro" />
        <Field label="Ville"             value={form.ville}      onChangeText={set('ville')}      placeholder="Alger, Oran…" />

        {!!error && (
          <View style={s.errorBox}>
            <Text style={s.errorTxt}>⚠️  {error}</Text>
          </View>
        )}

        <TouchableOpacity style={[s.submitBtn, loading && { opacity: 0.6 }]} onPress={soumettre} disabled={loading}>
          <Text style={s.submitBtnTxt}>{loading ? '···' : 'ENVOYER MA CANDIDATURE  →'}</Text>
        </TouchableOpacity>

        <Text style={s.legalTxt}>
          Votre dossier sera examiné sous 48h ouvrées. Activation gratuite pendant 3 mois.
        </Text>

        <View style={{ height: spacing.section * 2 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },

  /* Header */
  header:      { flexDirection: 'row', alignItems: 'center', gap: spacing.xl - 2, paddingHorizontal: spacing.xxl, paddingTop: spacing.xl, paddingBottom: spacing.xl, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  backBtn:     { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, alignItems: 'center', justifyContent: 'center' },
  backBtnTxt:  { color: colors.text, fontSize: typography.size.heading1 },
  headerSub:   { color: colors.accent, fontSize: typography.size.xs, letterSpacing: 3, marginBottom: spacing.xxs },
  headerTitle: { color: colors.text, fontSize: typography.size.title, fontWeight: typography.weight.regular, letterSpacing: 0.5 },

  /* Intro */
  intro:     { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.lg, margin: spacing.xxl, padding: spacing.xl, backgroundColor: colors.accentSoft, borderRadius: radius.xl, borderWidth: 1, borderColor: 'rgba(232,160,69,0.2)' },
  introEmoji:{ fontSize: typography.size.heading1 },
  introTxt:  { flex: 1, color: colors.textMuted, fontSize: typography.size.bodyLg, fontWeight: typography.weight.regular, lineHeight: 20 },

  /* Sections */
  sectionLabel: { color: colors.textDim, fontSize: typography.size.xs, letterSpacing: 4, paddingHorizontal: spacing.xxl, marginTop: spacing.xxl, marginBottom: spacing.lg, textTransform: 'uppercase' },

  /* Champ */
  fieldWrap:  { marginHorizontal: spacing.xxl, marginBottom: spacing.lg },
  fieldLabel: { color: colors.textMuted, fontSize: typography.size.caption, letterSpacing: 1, marginBottom: spacing.sm },
  input:      { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: radius.lg, paddingHorizontal: spacing.xl, paddingVertical: spacing.lg, color: colors.text, fontSize: typography.size.subheading, fontWeight: typography.weight.regular },

  /* Erreur */
  errorBox: { marginHorizontal: spacing.xxl, marginTop: spacing.md, backgroundColor: colors.redSoft, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: 'rgba(224,90,90,0.3)' },
  errorTxt:  { color: colors.red, fontSize: typography.size.body },

  /* Submit */
  submitBtn:    { marginHorizontal: spacing.xxl, marginTop: spacing.xxl, backgroundColor: colors.accent, borderRadius: radius.xl, paddingVertical: spacing.xl - 1, alignItems: 'center' },
  submitBtnTxt: { color: colors.bg, fontSize: typography.size.bodyLg, fontWeight: typography.weight.medium, letterSpacing: 1.5 },

  /* Légal */
  legalTxt: { marginHorizontal: spacing.xxl, marginTop: spacing.lg, color: colors.textDim, fontSize: typography.size.caption, textAlign: 'center', lineHeight: 16, fontStyle: 'italic' },

  /* Succès */
  successWrap:  { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.section },
  successRing:  { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: 'rgba(232,160,69,0.3)', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xxl },
  successEmoji: { fontSize: 44 },
  successTitle: { color: colors.text, fontSize: typography.size.title, fontWeight: typography.weight.regular, letterSpacing: 0.5, marginBottom: spacing.lg, textAlign: 'center' },
  successSub:   { color: colors.textMuted, fontSize: typography.size.bodyLg, textAlign: 'center', lineHeight: 22, marginBottom: spacing.section },
  successBtn:   { backgroundColor: colors.accent, borderRadius: radius.xl, paddingVertical: spacing.xl - 1, paddingHorizontal: spacing.section, alignItems: 'center' },
  successBtnTxt:{ color: colors.bg, fontSize: typography.size.bodyLg, fontWeight: typography.weight.medium, letterSpacing: 2 },
});
