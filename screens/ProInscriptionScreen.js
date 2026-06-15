import { useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing, radius } from '../src/theme';
import useProInscription from '../src/hooks/useProInscription';
import FormField from '../src/components/FormField';

export default function ProInscriptionScreen({ navigation }) {
  const { form, loading, error, success, approved, rejected, set, soumettre } = useProInscription();
  const goBack = useCallback(() => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate('Main', { screen: 'Accueil' });
  }, [navigation]);

  const continueAsClient = useCallback(() => {
    navigation.navigate('Main', { screen: 'Accueil' });
  }, [navigation]);

  useEffect(() => {
    if (approved) navigation.navigate('Main', { screen: 'Manager' });
  }, [approved, navigation]);

  if (success && rejected) {
    return (
      <SafeAreaView style={s.root}>
        <LinearGradient colors={['#C4B8C8', '#8B9BB4', '#6B7F9E']} start={{ x: 0.2, y: 0 }} end={{ x: 0, y: 1 }} style={s.bgOverlay} pointerEvents="none" />
        <View style={s.successWrap}>
          <View style={s.successRing}>
            <Text style={s.successEmoji}>❌</Text>
          </View>
          <Text style={s.successTitle}>Demande non retenue</Text>
          <Text style={s.successSub}>
            Nous n'avons pas pu vérifier votre établissement.{'\n'}Contactez-nous à contact@mida-food.com{'\n'}avec des justificatifs.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (success) {
    return (
      <SafeAreaView style={s.root}>
        <LinearGradient colors={['#C4B8C8', '#8B9BB4', '#6B7F9E']} start={{ x: 0.2, y: 0 }} end={{ x: 0, y: 1 }} style={s.bgOverlay} pointerEvents="none" />
        <View style={s.successWrap}>
          <View style={s.successRing}>
            <Text style={s.successEmoji}>🍽️</Text>
          </View>
          <Text style={s.successTitle}>Vérification en cours…</Text>
          <Text style={s.successSub}>
            Nous vérifions votre établissement.{'\n'}Vous serez redirigé automatiquement{'\n'}dès la validation de votre compte.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.root}>
      <LinearGradient colors={['#C4B8C8', '#8B9BB4', '#6B7F9E']} start={{ x: 0.2, y: 0 }} end={{ x: 0, y: 1 }} style={s.bgOverlay} pointerEvents="none" />
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={goBack}>
          <Text style={s.backBtnTxt}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerSub}>ESPACE PRO</Text>
        </View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive">

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
        <FormField label="Email de contact" value={form.email} onChangeText={set('email')} placeholder="votre@email.com" keyboardType="email-address" autoCapitalize="none" />

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
          Activation immédiate et gratuite pendant 3 mois.
        </Text>

        <TouchableOpacity style={s.clientLink} onPress={continueAsClient}>
          <Text style={s.clientLinkTxt}>Continuer comme client →</Text>
        </TouchableOpacity>

        <View style={{ height: spacing.section * 2 }} />
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:      { flex: 1, backgroundColor: colors.bg },
  bgOverlay: { ...StyleSheet.absoluteFillObject, opacity: 0.06 },

  header:      { flexDirection: 'row', alignItems: 'center', gap: spacing.xl - 2, paddingHorizontal: spacing.xxl, paddingTop: spacing.xl, paddingBottom: spacing.xl, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  backBtn:     { width: 38, height: 38, borderRadius: 0, backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center' },
  backBtnTxt:  { color: '#1A1A1A', fontSize: typography.size.heading1 },
  headerSub:   { color: '#C87860', fontSize: typography.size.xs, letterSpacing: 3, marginBottom: spacing.xxs },
  headerTitle: { color: colors.text, fontSize: typography.size.title, fontWeight: typography.weight.regular, letterSpacing: 0.5 },

  intro:     { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.lg, margin: spacing.xxl, padding: spacing.xl, backgroundColor: colors.navy, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.navyBorder },
  introEmoji:{ fontSize: typography.size.heading1 },
  introTxt:  { flex: 1, color: colors.textMuted, fontSize: typography.size.bodyLg, fontWeight: typography.weight.regular, lineHeight: 20 },

  sectionLabel: { color: colors.textMuted, fontSize: typography.size.xs, letterSpacing: 4, paddingHorizontal: spacing.xxl, marginTop: spacing.xxl, marginBottom: spacing.lg },

  errorBox: { marginHorizontal: spacing.xxl, marginTop: spacing.md, backgroundColor: colors.redSoft, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: 'rgba(224,90,90,0.3)' },
  errorTxt:  { color: colors.red, fontSize: typography.size.body },

  submitBtn:    { marginHorizontal: spacing.xxl, marginTop: spacing.xxl, backgroundColor: '#C87860', borderRadius: radius.xl, paddingVertical: spacing.xl - 1, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,220,150,0.5)', shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 14, shadowOffset: { width: 0, height: 0 }, elevation: 7 },
  submitBtnTxt: { color: '#FFFFFF', fontSize: typography.size.bodyLg, fontWeight: typography.weight.medium, letterSpacing: 1.5 },

  legalTxt:   { marginHorizontal: spacing.xxl, marginTop: spacing.lg, color: colors.textDim, fontSize: typography.size.caption, textAlign: 'center', lineHeight: 16, fontStyle: 'italic' },
  clientLink: { marginHorizontal: spacing.xxl, marginTop: spacing.xl, paddingVertical: spacing.lg, alignItems: 'center' },
  clientLinkTxt: { color: colors.textMuted, fontSize: typography.size.body, textDecorationLine: 'underline' },

  successWrap:  { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.section },
  successRing:  { width: 100, height: 100, borderRadius: 0, backgroundColor: colors.navy, borderWidth: 1, borderColor: colors.navyBorder, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xxl },
  successEmoji: { fontSize: 44 },
  successTitle: { color: colors.text, fontSize: typography.size.title, fontWeight: typography.weight.regular, letterSpacing: 0.5, marginBottom: spacing.lg, textAlign: 'center' },
  successSub:   { color: colors.textMuted, fontSize: typography.size.bodyLg, textAlign: 'center', lineHeight: 22, marginBottom: spacing.section },
  successBtn:   { backgroundColor: '#C87860', borderRadius: radius.xl, paddingVertical: spacing.xl - 1, paddingHorizontal: spacing.section, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,220,150,0.5)', shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 14, shadowOffset: { width: 0, height: 0 }, elevation: 7 },
  successBtnTxt:{ color: '#FFFFFF', fontSize: typography.size.bodyLg, fontWeight: typography.weight.medium, letterSpacing: 2 },
});
