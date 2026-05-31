import { useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { colors, typography, spacing, radius } from '../src/theme';
import useProInscription from '../src/hooks/useProInscription';
import FormField from '../src/components/FormField';
import MidaLogo from '../src/components/MidaLogo';

export default function ProInscriptionScreen({ navigation }) {
  const { form, loading, error, success, set, soumettre } = useProInscription();
  const goBack = useCallback(() => navigation.goBack(), [navigation]);

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
          <MidaLogo showTagline={false} style={{ alignItems: 'flex-start', marginBottom: 2 }} />
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
        <FormField label="Prénom"    value={form.prenom}    onChangeText={set('prenom')}    placeholder="Votre prénom" />
        <FormField label="Nom"       value={form.nom}       onChangeText={set('nom')}       placeholder="Votre nom" />
        <FormField label="Téléphone" value={form.telephone} onChangeText={set('telephone')} placeholder="+213 6XX XXX XXX" keyboardType="phone-pad" />

        <Text style={s.sectionLabel}>VOTRE RESTAURANT</Text>
        <FormField label="Nom du restaurant" value={form.restaurant} onChangeText={set('restaurant')} placeholder="Ex: Dar Zitoun" />
        <FormField label="Adresse"           value={form.adresse}    onChangeText={set('adresse')}    placeholder="Rue, numéro" />
        <FormField label="Ville"             value={form.ville}      onChangeText={set('ville')}      placeholder="Alger, Oran…" />

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

  header:      { flexDirection: 'row', alignItems: 'center', gap: spacing.xl - 2, paddingHorizontal: spacing.xxl, paddingTop: spacing.xl, paddingBottom: spacing.xl, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  backBtn:     { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, alignItems: 'center', justifyContent: 'center' },
  backBtnTxt:  { color: colors.text, fontSize: typography.size.heading1 },
  headerSub:   { color: colors.accent, fontSize: typography.size.xs, letterSpacing: 3, marginBottom: spacing.xxs },
  headerTitle: { color: colors.text, fontSize: typography.size.title, fontWeight: typography.weight.regular, letterSpacing: 0.5 },

  intro:     { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.lg, margin: spacing.xxl, padding: spacing.xl, backgroundColor: colors.accentSoft, borderRadius: radius.xl, borderWidth: 1, borderColor: 'rgba(232,160,69,0.2)' },
  introEmoji:{ fontSize: typography.size.heading1 },
  introTxt:  { flex: 1, color: colors.textMuted, fontSize: typography.size.bodyLg, fontWeight: typography.weight.regular, lineHeight: 20 },

  sectionLabel: { color: colors.textDim, fontSize: typography.size.xs, letterSpacing: 4, paddingHorizontal: spacing.xxl, marginTop: spacing.xxl, marginBottom: spacing.lg },

  errorBox: { marginHorizontal: spacing.xxl, marginTop: spacing.md, backgroundColor: colors.redSoft, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: 'rgba(224,90,90,0.3)' },
  errorTxt:  { color: colors.red, fontSize: typography.size.body },

  submitBtn:    { marginHorizontal: spacing.xxl, marginTop: spacing.xxl, backgroundColor: colors.accent, borderRadius: radius.xl, paddingVertical: spacing.xl - 1, alignItems: 'center' },
  submitBtnTxt: { color: colors.bg, fontSize: typography.size.bodyLg, fontWeight: typography.weight.medium, letterSpacing: 1.5 },

  legalTxt: { marginHorizontal: spacing.xxl, marginTop: spacing.lg, color: colors.textDim, fontSize: typography.size.caption, textAlign: 'center', lineHeight: 16, fontStyle: 'italic' },

  successWrap:  { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.section },
  successRing:  { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: 'rgba(232,160,69,0.3)', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xxl },
  successEmoji: { fontSize: 44 },
  successTitle: { color: colors.text, fontSize: typography.size.title, fontWeight: typography.weight.regular, letterSpacing: 0.5, marginBottom: spacing.lg, textAlign: 'center' },
  successSub:   { color: colors.textMuted, fontSize: typography.size.bodyLg, textAlign: 'center', lineHeight: 22, marginBottom: spacing.section },
  successBtn:   { backgroundColor: colors.accent, borderRadius: radius.xl, paddingVertical: spacing.xl - 1, paddingHorizontal: spacing.section, alignItems: 'center' },
  successBtnTxt:{ color: colors.bg, fontSize: typography.size.bodyLg, fontWeight: typography.weight.medium, letterSpacing: 2 },
});
