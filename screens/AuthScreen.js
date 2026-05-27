import { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  SafeAreaView, KeyboardAvoidingView, Platform, ScrollView,
  ActivityIndicator, Animated,
} from 'react-native';
import { supabase } from '../supabase';

const C = {
  bg: '#080d18', bg2: '#0f1828', bg3: '#162035',
  accent: '#c8975a', accent2: '#4a7fa5',
  text: '#f0ece4', dim: '#8a9ab0', dimmer: '#3a4a5e',
  green: '#3d9970', red: '#e05a5a',
  border: 'rgba(255,255,255,0.07)',
};

function Field({ icon, label, children }) {
  return (
    <View style={f.wrap}>
      <Text style={f.label}>{label}</Text>
      <View style={f.inner}>
        <Text style={f.icon}>{icon}</Text>
        {children}
      </View>
    </View>
  );
}
const f = StyleSheet.create({
  wrap:  { marginBottom: 14 },
  label: { color: C.dimmer, fontSize: 9, letterSpacing: 3, fontWeight: '500', marginBottom: 7 },
  inner: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.bg2, borderRadius: 14, borderWidth: 1.5, borderColor: C.border, paddingHorizontal: 14, minHeight: 52 },
  icon:  { fontSize: 15, marginRight: 10, opacity: 0.6 },
});

export default function AuthScreen({ onAuth }) {
  const [mode,     setMode]     = useState('signin');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState('');
  const [showPwd,       setShowPwd]       = useState(false);
  const [success,       setSuccess]       = useState('');
  const [resetSent,     setResetSent]     = useState(false);
  const [resetLoading,  setResetLoading]  = useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim  = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 2400, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 2400, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  function shake() {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 1,  duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -1, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 1,  duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,  duration: 55, useNativeDriver: true }),
    ]).start();
  }

  function switchMode(m) {
    Animated.timing(fadeAnim, { toValue: 0, duration: 140, useNativeDriver: true }).start(() => {
      setMode(m); setError(''); setSuccess(''); setResetSent(false);
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    });
  }

  async function sendReset() {
    if (!email.trim()) { setError('Entrez votre email d\'abord.'); shake(); return; }
    setResetLoading(true);
    await supabase.auth.resetPasswordForEmail(email.trim());
    setResetSent(true);
    setResetLoading(false);
  }

  async function submit() {
    if (!email.trim() || !password) { setError('Remplissez tous les champs.'); shake(); return; }
    if (mode === 'signup' && password !== confirm) { setError('Les mots de passe ne correspondent pas.'); shake(); return; }
    if (password.length < 6) { setError('Mot de passe : 6 caractères minimum.'); shake(); return; }

    setLoading(true); setError(''); setSuccess('');

    if (mode === 'signin') {
      const { data, error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (err) { setError(err.message); shake(); }
      else if (data.session) onAuth(data.session);
    } else {
      const { data, error: err } = await supabase.auth.signUp({ email: email.trim(), password });
      if (err) {
        if (err.message.toLowerCase().includes('already registered') || err.message.toLowerCase().includes('already been registered')) {
          setError('Cet email est déjà utilisé. Connectez-vous avec votre mot de passe.');
          switchMode('signin');
        } else { setError(err.message); shake(); }
      }
      else if (data.session) { onAuth(data.session); }
      else {
        const { data: d2 } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (d2?.session) { onAuth(d2.session); }
        else { setSuccess('Compte créé ! Connectez-vous avec vos identifiants.'); switchMode('signin'); }
      }
    }
    setLoading(false);
  }

  const shakeX = shakeAnim.interpolate({ inputRange: [-1, 1], outputRange: [-10, 10] });

  return (
    <SafeAreaView style={s.root}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* ── Hero ── */}
          <View style={s.hero}>
            <Animated.View style={[s.heroRingOuter, { transform: [{ scale: pulseAnim }] }]}>
              <View style={s.heroRingInner}>
                <Text style={s.heroStar}>✦</Text>
              </View>
            </Animated.View>
            <Text style={s.logo}>MIDA</Text>
            <Text style={s.tagline}>La bonne table, au bon moment.</Text>
          </View>

          {/* ── Onglets Connexion / Inscription ── */}
          <View style={s.tabRow}>
            <TouchableOpacity
              style={[s.tabBtn, mode === 'signin' && s.tabBtnOn]}
              onPress={() => switchMode('signin')}
              activeOpacity={0.8}
            >
              <Text style={[s.tabTxt, mode === 'signin' && s.tabTxtOn]}>Connexion</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.tabBtn, mode === 'signup' && s.tabBtnOn]}
              onPress={() => switchMode('signup')}
              activeOpacity={0.8}
            >
              <Text style={[s.tabTxt, mode === 'signup' && s.tabTxtOn]}>Inscription</Text>
            </TouchableOpacity>
          </View>

          {/* ── Card ── */}
          <Animated.View style={[s.card, { opacity: fadeAnim, transform: [{ translateX: shakeX }] }]}>
            <View style={s.cardHead}>
              <Text style={s.cardTitle}>
                {mode === 'signin' ? 'Ravi de vous revoir 👋' : 'Créer un compte'}
              </Text>
              <Text style={s.cardSub}>
                {mode === 'signin'
                  ? 'Connectez-vous pour accéder à vos réservations.'
                  : 'Rejoignez MIDA en quelques secondes.'}
              </Text>
            </View>

            <Field icon="✉️" label="ADRESSE EMAIL">
              <TextInput
                style={s.input}
                placeholder="votre@email.com"
                placeholderTextColor={C.dimmer}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={setEmail}
              />
            </Field>

            <Field icon="🔒" label="MOT DE PASSE">
              <TextInput
                style={[s.input, { flex: 1 }]}
                placeholder="••••••••"
                placeholderTextColor={C.dimmer}
                secureTextEntry={!showPwd}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setShowPwd(v => !v)} style={s.eyeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={s.eyeTxt}>{showPwd ? 'Masquer' : 'Afficher'}</Text>
              </TouchableOpacity>
            </Field>

            {mode === 'signin' && (
              <TouchableOpacity onPress={sendReset} disabled={resetLoading} style={s.forgotBtn}>
                {resetSent
                  ? <Text style={s.forgotSent}>✓ Email de réinitialisation envoyé</Text>
                  : <Text style={s.forgotTxt}>{resetLoading ? '...' : 'Mot de passe oublié ?'}</Text>
                }
              </TouchableOpacity>
            )}

            {mode === 'signup' && (
              <Field icon="✅" label="CONFIRMER LE MOT DE PASSE">
                <TextInput
                  style={s.input}
                  placeholder="••••••••"
                  placeholderTextColor={C.dimmer}
                  secureTextEntry={!showPwd}
                  value={confirm}
                  onChangeText={setConfirm}
                />
              </Field>
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
                  <Text style={s.successIcon}>✉️</Text>
                  <Text style={s.successTxt}>{success}</Text>
                </View>
                <TouchableOpacity onPress={() => { setSuccess(''); switchMode('signin'); }} style={s.successLink}>
                  <Text style={s.successLinkTxt}>→ Se connecter</Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              style={[s.submitBtn, loading && { opacity: 0.75 }]}
              onPress={submit}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color={C.bg} size="small" />
                : <Text style={s.submitTxt}>
                    {mode === 'signin' ? 'SE CONNECTER  →' : 'CRÉER MON COMPTE  →'}
                  </Text>
              }
            </TouchableOpacity>
          </Animated.View>

          <Text style={s.legal}>
            En continuant, vous acceptez nos{' '}
            <Text style={s.legalLink}>Conditions</Text>
            {' '}et notre{' '}
            <Text style={s.legalLink}>Politique de confidentialité</Text>.
          </Text>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: C.bg },
  scroll: { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 36 },

  /* Hero */
  hero:          { alignItems: 'center', paddingTop: 50, paddingBottom: 32 },
  heroRingOuter: { width: 88, height: 88, borderRadius: 26, backgroundColor: 'rgba(200,151,90,0.08)', borderWidth: 1.5, borderColor: 'rgba(200,151,90,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  heroRingInner: { width: 60, height: 60, borderRadius: 17, backgroundColor: 'rgba(200,151,90,0.14)', borderWidth: 1, borderColor: 'rgba(200,151,90,0.3)', alignItems: 'center', justifyContent: 'center' },
  heroStar:      { color: C.accent, fontSize: 28 },
  logo:          { color: C.accent, fontSize: 30, fontWeight: '300', letterSpacing: 10, marginBottom: 6 },
  tagline:       { color: C.dim, fontSize: 12, fontStyle: 'italic', letterSpacing: 0.5 },

  /* Tabs */
  tabRow:    { flexDirection: 'row', backgroundColor: C.bg2, borderRadius: 16, borderWidth: 1, borderColor: C.border, padding: 4, marginBottom: 14 },
  tabBtn:    { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12 },
  tabBtnOn:  { backgroundColor: C.bg3, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  tabTxt:    { color: C.dimmer, fontSize: 14 },
  tabTxtOn:  { color: C.text, fontWeight: '500' },

  /* Card */
  card:      { backgroundColor: C.bg2, borderRadius: 22, borderWidth: 1, borderColor: C.border, padding: 22, marginBottom: 14 },
  cardHead:  { marginBottom: 22 },
  cardTitle: { color: C.text, fontSize: 22, fontWeight: '300', letterSpacing: 0.3, marginBottom: 5 },
  cardSub:   { color: C.dim, fontSize: 13, lineHeight: 19 },

  /* Input */
  input:   { flex: 1, color: C.text, fontSize: 15, fontWeight: '300', paddingVertical: 0 },
  eyeBtn:  { marginLeft: 8 },
  eyeTxt:  { color: C.accent2, fontSize: 12 },

  /* Feedback */
  errorBox:   { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: 'rgba(224,90,90,0.08)', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: 'rgba(224,90,90,0.25)', marginBottom: 14 },
  errorIcon:  { fontSize: 13 },
  errorTxt:   { color: C.red, fontSize: 12, lineHeight: 18, flex: 1 },
  successBox:     { gap: 10, backgroundColor: 'rgba(61,153,112,0.08)', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: 'rgba(61,153,112,0.25)', marginBottom: 14 },
  successRow:     { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  successIcon:    { fontSize: 13 },
  successTxt:     { color: C.green, fontSize: 12, lineHeight: 18, flex: 1 },
  successLink:    { alignSelf: 'flex-start' },
  successLinkTxt: { color: C.accent2, fontSize: 13, fontWeight: '500' },

  /* Submit */
  submitBtn: { backgroundColor: C.accent, borderRadius: 15, paddingVertical: 16, alignItems: 'center', marginTop: 4 },
  submitTxt: { color: C.bg, fontSize: 13, fontWeight: '600', letterSpacing: 1.2 },

  /* Forgot */
  forgotBtn:  { alignSelf: 'flex-end', marginTop: -6, marginBottom: 10 },
  forgotTxt:  { color: C.accent2, fontSize: 12 },
  forgotSent: { color: C.green, fontSize: 12 },

  /* Legal */
  legal:     { color: C.dimmer, fontSize: 10, textAlign: 'center', lineHeight: 16 },
  legalLink: { color: C.dim },
});
