import { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView,
  Animated, Linking,
} from 'react-native';
import CGUModal from '../src/components/CGUModal';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, radius } from '../src/theme';
import useAuth from '../src/hooks/useAuth';

function Field({ icon, label, children }) {
  return (
    <View style={f.wrap}>
      {label ? <Text style={f.label}>{label}</Text> : null}
      <View style={f.inner}>
        {icon ? <Text style={f.icon}>{icon}</Text> : null}
        {children}
      </View>
    </View>
  );
}
const f = StyleSheet.create({
  wrap:  { marginBottom: spacing.xl },
  label: { color: colors.textMuted, fontSize: typography.size.xs, letterSpacing: 2, fontWeight: typography.weight.semibold, marginBottom: spacing.sm, textTransform: 'uppercase' },
  inner: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1.5, borderColor: colors.cardBorder, paddingHorizontal: spacing.xl, minHeight: 52 },
  icon:  { fontSize: typography.size.subheading, marginRight: spacing.md, opacity: 0.7 },
});

export default function AuthScreen({ onAuth, userType, onSwitchType, onGuest }) {
  const [showCGU, setShowCGU] = useState(false);
  const {
    isPro, mode, email, setEmail, password, setPassword, confirm, setConfirm,
    loading, error, showPwd, success, resetSent, resetLoading,
    pulseAnim, fadeAnim, shakeX,
    switchToSignin, switchToSignup, toggleShowPwd, clearSuccess, switchType,
    sendReset, submit,
  } = useAuth({ onAuth, userType, onSwitchType });

  const passwordRef = useRef(null);

  return (
    <SafeAreaView style={s.root}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          <View style={s.hero}>
            <Animated.View style={[s.heroRingOuter, { transform: [{ scale: pulseAnim }] }]}>
              <View style={s.heroRingInner}>
                <Text style={s.heroStar}>✦</Text>
              </View>
            </Animated.View>
          </View>

          {isPro && (
            <View style={s.roleBadge}>
              <Text style={s.roleBadgeTxt}>📊  Espace Restaurateur</Text>
            </View>
          )}

          <View style={s.tabRow}>
            <TouchableOpacity style={[s.tabBtn, mode === 'signin' && s.tabBtnOn]} onPress={switchToSignin} activeOpacity={0.8}>
              <Text style={[s.tabTxt, mode === 'signin' && s.tabTxtOn]}>Connexion</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.tabBtn, mode === 'signup' && s.tabBtnOn]} onPress={switchToSignup} activeOpacity={0.8}>
              <Text style={[s.tabTxt, mode === 'signup' && s.tabTxtOn]}>Inscription</Text>
            </TouchableOpacity>
          </View>

          <Animated.View style={[s.card, { opacity: fadeAnim, transform: [{ translateX: shakeX }] }]}>
            <View style={s.cardHead}>
              <Text style={s.cardTitle}>
                {mode === 'signin' ? 'Bon retour 👋' : isPro ? 'Créer un compte Pro' : 'Créer un compte'}
              </Text>
              <Text style={s.cardSub}>
                {mode === 'signin'
                  ? 'Connecte-toi à ton compte Mida.'
                  : isPro
                    ? 'Crée ton compte, puis complète ton dossier restaurateur.'
                    : 'Rejoins Mida en quelques secondes.'}
              </Text>
            </View>

            <Field icon="✉️" label="Adresse email">
              <TextInput
                style={s.input}
                placeholder="ton@email.com"
                placeholderTextColor={colors.textDim}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
                blurOnSubmit={false}
                value={email}
                onChangeText={setEmail}
              />
            </Field>

            <Field icon="🔒" label="Mot de passe">
              <TextInput
                ref={passwordRef}
                style={[s.input, { flex: 1 }]}
                placeholder="••••••••"
                placeholderTextColor={colors.textDim}
                secureTextEntry={!showPwd}
                returnKeyType="done"
                onSubmitEditing={submit}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={toggleShowPwd} style={s.eyeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={s.eyeTxt}>{showPwd ? 'Masquer' : 'Afficher'}</Text>
              </TouchableOpacity>
            </Field>

            {mode === 'signup' && (
              <Field icon="✅" label="Confirmer le mot de passe">
                <TextInput
                  style={s.input}
                  placeholder="••••••••"
                  placeholderTextColor={colors.textDim}
                  secureTextEntry={!showPwd}
                  value={confirm}
                  onChangeText={setConfirm}
                />
              </Field>
            )}

            {mode === 'signin' && (
              <TouchableOpacity style={s.forgotBtn} onPress={sendReset} disabled={resetLoading}>
                <Text style={resetSent ? s.forgotSent : s.forgotTxt}>
                  {resetSent ? '✅ Email envoyé — vérifie ta boîte' : resetLoading ? 'Envoi…' : 'Mot de passe oublié ?'}
                </Text>
              </TouchableOpacity>
            )}

            {!!error && (
              <View style={s.errorBox}>
                <Text style={s.errorIcon}>⚠️</Text>
                <Text style={s.errorTxt}>{error}</Text>
              </View>
            )}

            {!!success && (
              <View style={s.successBox}>
                <View style={s.successRow}>
                  <Text style={s.successIcon}>{isPro ? '📊' : '✉️'}</Text>
                  <Text style={s.successTxt}>{success}</Text>
                </View>
                {isPro && (
                  <Text style={s.proHint}>Une fois connecté → Profil → "Devenir restaurateur" pour soumettre ton dossier.</Text>
                )}
                <TouchableOpacity onPress={clearSuccess} style={s.successLink}>
                  <Text style={s.successLinkTxt}>→ Se connecter</Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity style={[s.submitBtn, loading && { opacity: 0.75 }]} onPress={submit} disabled={loading} activeOpacity={0.85}>
              <Text style={s.submitTxt}>
                {loading ? '···' : mode === 'signin' ? 'Se connecter  →' : 'Créer mon compte  →'}
              </Text>
            </TouchableOpacity>
          </Animated.View>

          <Text style={s.legal}>
            En continuant, vous acceptez nos{' '}
            <Text style={s.legalLink} onPress={() => setShowCGU(true)}>Conditions</Text>
            {' '}et notre{' '}
            <Text style={s.legalLink} onPress={() => Linking.openURL('https://mida-food.com/confidentialite')}>Politique de confidentialité</Text>.
          </Text>
          <CGUModal visible={showCGU} onClose={() => setShowCGU(false)} />

          {onSwitchType && (
            <TouchableOpacity style={s.switchTypeBtn} onPress={switchType}>
              <Text style={s.switchTypeTxt}>
                {isPro ? '← Retour espace client' : '🧑‍🍳 Espace Pro / Restaurateur →'}
              </Text>
            </TouchableOpacity>
          )}

          {onGuest && !isPro && (
            <TouchableOpacity style={s.guestBtn} onPress={onGuest} activeOpacity={0.6}>
              <Text style={s.guestTxt}>Explorer sans compte →</Text>
            </TouchableOpacity>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: colors.bg },
  scroll: { flexGrow: 1, paddingHorizontal: spacing.xl, paddingBottom: spacing.section + 4 },

  hero:          { alignItems: 'center', paddingTop: 50, paddingBottom: spacing.section },
  heroRingOuter: { width: 88, height: 88, borderRadius: radius.xxl, backgroundColor: colors.primarySoft, borderWidth: 1.5, borderColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xxl },
  heroRingInner: { width: 60, height: 60, borderRadius: radius.xl, backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  heroStar:      { color: colors.primary, fontSize: 28 },

  tabRow:   { flexDirection: 'row', backgroundColor: colors.card, borderRadius: radius.xxl, borderWidth: 1, borderColor: colors.cardBorder, padding: 4, marginBottom: spacing.xl },
  tabBtn:   { flex: 1, paddingVertical: spacing.lg, alignItems: 'center', borderRadius: radius.xl },
  tabBtnOn: { backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.primary, shadowColor: colors.primary, shadowOpacity: 0.25, shadowRadius: 10, shadowOffset: { width: 0, height: 0 }, elevation: 5 },
  tabTxt:   { color: colors.textDim, fontSize: typography.size.subheading },
  tabTxtOn: { color: colors.primary, fontWeight: typography.weight.semibold },

  card:      { backgroundColor: colors.card, borderRadius: radius.xxl, borderWidth: 1, borderColor: colors.cardBorder, padding: spacing.xxl, marginBottom: spacing.xl },
  cardHead:  { marginBottom: spacing.xxl },
  cardTitle: { color: colors.text, fontSize: typography.size.title, fontWeight: typography.weight.regular, letterSpacing: 0.3, marginBottom: spacing.xs },
  cardSub:   { color: colors.textMuted, fontSize: typography.size.bodyLg, lineHeight: 19 },

  input:   { flex: 1, color: colors.text, fontSize: typography.size.heading3, fontWeight: typography.weight.regular, paddingVertical: 0 },
  eyeBtn:  { marginLeft: spacing.md },
  eyeTxt:  { color: colors.blue, fontSize: typography.size.body },

  forgotBtn:  { alignSelf: 'flex-end', marginTop: spacing.sm, marginBottom: spacing.lg },
  forgotTxt:  { color: colors.accent, fontSize: typography.size.caption, fontWeight: typography.weight.medium },
  forgotSent: { color: colors.green, fontSize: typography.size.caption, fontWeight: typography.weight.medium },

  errorBox:       { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, backgroundColor: colors.redSoft, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: 'rgba(224,90,90,0.25)', marginBottom: spacing.xl },
  errorIcon:      { fontSize: typography.size.bodyLg },
  errorTxt:       { color: colors.red, fontSize: typography.size.body, lineHeight: 18, flex: 1 },
  successBox:     { gap: spacing.md, backgroundColor: colors.greenSoft, borderRadius: radius.lg, padding: spacing.xl, borderWidth: 1, borderColor: 'rgba(76,175,130,0.25)', marginBottom: spacing.xl },
  successRow:     { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  successIcon:    { fontSize: typography.size.bodyLg },
  successTxt:     { color: colors.green, fontSize: typography.size.body, lineHeight: 18, flex: 1 },
  successLink:    { alignSelf: 'flex-start' },
  successLinkTxt: { color: colors.blue, fontSize: typography.size.bodyLg, fontWeight: typography.weight.medium },

  submitBtn: { backgroundColor: colors.primary, borderRadius: radius.xl, paddingVertical: spacing.xl - 2, alignItems: 'center', marginTop: spacing.xs, shadowColor: colors.primary, shadowOpacity: 0.4, shadowRadius: 14, shadowOffset: { width: 0, height: 0 }, elevation: 7 },
  submitTxt: { color: colors.bg, fontSize: typography.size.bodyLg, fontWeight: typography.weight.bold, letterSpacing: 0.5 },

  roleBadge:    { alignSelf: 'center', flexDirection: 'row', alignItems: 'center', backgroundColor: colors.blueSoft, borderRadius: radius.pill, borderWidth: 1, borderColor: 'rgba(90,155,224,0.3)', paddingHorizontal: spacing.xl, paddingVertical: spacing.md, marginBottom: spacing.xl },
  roleBadgeTxt: { color: colors.blue, fontSize: typography.size.body, fontWeight: typography.weight.medium, letterSpacing: 0.5 },

  proHint: { color: colors.textMuted, fontSize: typography.size.caption, lineHeight: 17, fontStyle: 'italic' },

  legal:     { color: colors.textDim, fontSize: typography.size.sm, textAlign: 'center', lineHeight: 16 },
  legalLink: { color: colors.textMuted },

  switchTypeBtn: { alignSelf: 'center', marginTop: spacing.xxl, paddingVertical: spacing.md, paddingHorizontal: spacing.xxl - 2, borderRadius: radius.lg, borderWidth: 1, borderColor: 'rgba(90,155,224,0.3)', backgroundColor: colors.blueSoft },
  switchTypeTxt: { color: colors.blue, fontSize: typography.size.body, fontWeight: typography.weight.medium, letterSpacing: 0.3 },
  guestBtn:      { alignSelf: 'center', marginTop: spacing.xl, paddingVertical: spacing.md, paddingHorizontal: spacing.xxl },
  guestTxt:      { color: colors.textMuted, fontSize: typography.size.bodyLg },
});
