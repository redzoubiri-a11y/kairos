import { useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing, radius } from '../src/theme';
import useProInscription, { CUISINE_OPTIONS } from '../src/hooks/useProInscription';
import FormField from '../src/components/FormField';
import Tag from '../src/components/Tag';
import Button from '../src/components/Button';

const STEP_LABELS = [
  'Parlez-nous de votre établissement',
  'Vos informations',
  'Vérifiez votre demande',
];

export default function ProInscriptionScreen({ navigation }) {
  const { form, step, loading, error, success, approved, rejected, set, nextStep, prevStep, soumettre } = useProInscription();

  const goBack = useCallback(() => {
    if (step > 0) { prevStep(); return; }
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate('Main', { screen: 'Accueil' });
  }, [step, prevStep, navigation]);

  const continueAsClient = useCallback(() => {
    navigation.navigate('Main', { screen: 'Accueil' });
  }, [navigation]);

  const cuisineLabel = CUISINE_OPTIONS.find(o => o.id === form.cuisine_type)?.label;

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
    <SafeAreaView style={s.root} edges={['top', 'left', 'right', 'bottom']}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={goBack}>
          <Ionicons name="chevron-back" size={14} color={colors.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Devenir partenaire MIDA</Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive" contentContainerStyle={s.scroll}>

          <Text style={s.stepLabel}>Étape {step + 1} sur 3</Text>
          <Text style={s.stepHeading}>{STEP_LABELS[step]}</Text>

          {step === 0 && (
            <>
              <FormField label="Nom du restaurant" value={form.restaurant} onChangeText={set('restaurant')} placeholder="Ex: Dar Zitoun" />

              <Text style={s.chipsLabel}>CATÉGORIE DE CUISINE</Text>
              <View style={s.chipsRow}>
                {CUISINE_OPTIONS.map((o) => (
                  <TouchableOpacity key={o.id} onPress={() => set('cuisine_type')(o.id)}>
                    <Tag variant={form.cuisine_type === o.id ? 'filterActive' : 'filterInactive'} size="choice">
                      {o.label}
                    </Tag>
                  </TouchableOpacity>
                ))}
              </View>

              <FormField label="Adresse"  value={form.adresse} onChangeText={set('adresse')} placeholder="Rue, numéro" />
              <FormField label="Ville"    value={form.ville}   onChangeText={set('ville')}   placeholder="Alger, Oran…" />
              <FormField label="Téléphone professionnel" value={form.telephone} onChangeText={set('telephone')} placeholder="+213 …" keyboardType="phone-pad" />
            </>
          )}

          {step === 1 && (
            <>
              <FormField label="Prénom" value={form.prenom} onChangeText={set('prenom')} placeholder="Votre prénom" />
              <FormField label="Nom"    value={form.nom}    onChangeText={set('nom')}    placeholder="Votre nom" />
              <FormField label="Email de contact" value={form.email} onChangeText={set('email')} placeholder="votre@email.com" keyboardType="email-address" />
            </>
          )}

          {step === 2 && (
            <>
              <View style={s.recapCard}>
                {[
                  ['Restaurant', form.restaurant],
                  ['Cuisine', cuisineLabel],
                  ['Adresse', [form.adresse, form.ville].filter(Boolean).join(', ')],
                  ['Téléphone', form.telephone],
                  ['Contact', `${form.prenom} ${form.nom}`],
                  ['Email', form.email],
                ].map(([label, val]) => (
                  <View key={label} style={s.recapRow}>
                    <Text style={s.recapLabel}>{label}</Text>
                    <Text style={s.recapVal} numberOfLines={1}>{val || '—'}</Text>
                  </View>
                ))}
              </View>

              <View style={s.infoBanner}>
                <Text style={s.infoBannerTxt}>
                  Votre demande est validée par notre équipe en 24 à 48h. Vous recevrez une confirmation par SMS.
                </Text>
              </View>
            </>
          )}

          {!!error && (
            <View style={s.errorBox}>
              <Text style={s.errorTxt}>⚠️  {error}</Text>
            </View>
          )}

          {step === 0 && (
            <TouchableOpacity style={s.clientLink} onPress={continueAsClient}>
              <Text style={s.clientLinkTxt}>Continuer comme client →</Text>
            </TouchableOpacity>
          )}

          <View style={{ height: spacing.section }} />
        </ScrollView>

        <View style={s.footer}>
          {step < 2 ? (
            <Button variant="pro" onPress={nextStep}>Continuer</Button>
          ) : (
            <Button variant="pro" onPress={soumettre} loading={loading}>Envoyer ma candidature</Button>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:      { flex: 1, backgroundColor: colors.bg },
  bgOverlay: { ...StyleSheet.absoluteFillObject, opacity: 0.06 },

  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingTop: spacing.xl, paddingHorizontal: 20 },
  backBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.tagNeutralBg, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: typography.display, fontSize: typography.size.heading2, color: colors.text, letterSpacing: -0.16 },

  scroll: { paddingTop: spacing.xxl - 2, paddingHorizontal: 0 },
  stepLabel: { fontFamily: typography.bodySemibold, color: colors.gold, fontSize: typography.size.caption - 0.5, letterSpacing: 0.84, textTransform: 'uppercase', marginHorizontal: 20, marginBottom: spacing.sm },
  stepHeading: { fontFamily: typography.display, fontSize: typography.size.heading2 + 6, color: colors.text, letterSpacing: -0.44, lineHeight: 27.5, marginHorizontal: 20, marginBottom: spacing.xxl },

  chipsLabel: { fontFamily: typography.bodySemibold, color: colors.textLabel, fontSize: typography.size.caption - 0.5, letterSpacing: 0.63, textTransform: 'uppercase', marginHorizontal: 20, marginBottom: spacing.sm },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginHorizontal: 20, marginBottom: 18 },

  recapCard: { marginHorizontal: 20, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: radius.xl, overflow: 'hidden', marginBottom: spacing.xxl },
  recapRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.lg, paddingHorizontal: 15, paddingVertical: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  recapLabel: { fontFamily: typography.body, fontSize: typography.size.body, color: colors.textMuted },
  recapVal: { flex: 1, textAlign: 'right', fontFamily: typography.bodyMedium, fontSize: typography.size.bodyLg, color: colors.text },

  infoBanner: { marginHorizontal: 20, backgroundColor: colors.cream, borderRadius: radius.lg, padding: 15 },
  infoBannerTxt: { fontFamily: typography.body, fontSize: typography.size.body, color: 'rgba(10,10,10,0.6)', lineHeight: 18 },

  errorBox: { marginHorizontal: 20, marginTop: spacing.lg, backgroundColor: colors.redSoft, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: 'rgba(224,90,90,0.3)' },
  errorTxt:  { color: colors.red, fontSize: typography.size.body },

  clientLink: { marginHorizontal: 20, marginTop: spacing.xl, paddingVertical: spacing.lg, alignItems: 'center' },
  clientLinkTxt: { fontFamily: typography.body, color: colors.textMuted, fontSize: typography.size.body, textDecorationLine: 'underline' },

  footer: { paddingHorizontal: 20, paddingTop: 14, borderTopWidth: 1, borderTopColor: colors.cardBorder, backgroundColor: colors.card },

  successWrap:  { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.section },
  successRing:  { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xxl },
  successEmoji: { fontSize: 44 },
  successTitle: { color: colors.text, fontFamily: typography.display, fontSize: typography.size.title, fontWeight: typography.weight.bold, letterSpacing: -0.3, marginBottom: spacing.lg, textAlign: 'center' },
  successSub:   { color: colors.textMuted, fontSize: typography.size.bodyLg, textAlign: 'center', lineHeight: 22, marginBottom: spacing.section },
});
