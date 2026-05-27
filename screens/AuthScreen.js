import { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  SafeAreaView, KeyboardAvoidingView, Platform, ScrollView,
  ActivityIndicator, Animated,
} from 'react-native';
import { supabase } from '../supabase';

const C = {
  bg: '#0d1628', bg2: '#111827', bg3: '#1a2332',
  accent: '#c8975a', accent2: '#4a7fa5',
  text: '#f0ece4', dim: '#8a9ab0', dimmer: '#4a5568',
  green: '#3d9970',
  border: 'rgba(255,255,255,0.07)',
  borderAccent: 'rgba(200,151,90,0.3)',
  red: '#e05a5a',
};

/* ─── Composant saisie OTP (coller / auto-remplissage SMS) ─── */
function OtpInput({ value, onChange }) {
  const inputRef = useRef(null);
  return (
    <TouchableOpacity onPress={() => inputRef.current?.focus()} activeOpacity={1} style={ot.wrap}>
      <View style={ot.row} pointerEvents="none">
        {Array.from({ length: 6 }).map((_, i) => (
          <View key={i} style={[ot.box, !!value[i] && ot.boxFilled, value.length === i && ot.boxActive]}>
            <Text style={ot.boxTxt}>{value[i] || ''}</Text>
          </View>
        ))}
      </View>
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={t => onChange(t.replace(/\D/g, '').slice(0, 6))}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        maxLength={6}
        autoFocus
        style={ot.hidden}
        caretHidden
      />
      <Text style={ot.hint}>Appuyez pour saisir  ·  Maintenez pour coller</Text>
    </TouchableOpacity>
  );
}

const ot = StyleSheet.create({
  wrap:      { alignItems: 'center', marginBottom: 16, paddingVertical: 4 },
  row:       { flexDirection: 'row', gap: 10, justifyContent: 'center', marginBottom: 10 },
  box:       { width: 48, height: 60, borderRadius: 14, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.bg2, alignItems: 'center', justifyContent: 'center' },
  boxFilled: { borderColor: C.accent2, backgroundColor: 'rgba(74,127,165,0.1)' },
  boxActive: { borderColor: C.accent, borderWidth: 2 },
  boxTxt:    { color: C.text, fontSize: 24, fontWeight: '300' },
  hidden:    { position: 'absolute', width: '100%', height: '100%', opacity: 0 },
  hint:      { color: C.dimmer, fontSize: 11 },
});

/* ─── Écran principal ─── */
export default function AuthScreen({ onAuth }) {
  const [method, setMethod] = useState('email');   // 'phone' | 'email'
  const [mode,   setMode]   = useState('signin');  // 'signin' | 'signup'
  const [step,   setStep]   = useState('form');    // 'form' | 'otp'

  // Champs
  const [phone,    setPhone]    = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [otp,      setOtp]      = useState('');

  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [showPwd,  setShowPwd]  = useState(false);
  const [countdown, setCountdown] = useState(0);
  const countdownRef = useRef(null);

  const fadeAnim = useRef(new Animated.Value(1)).current;

  function startCountdown(seconds = 120) {
    setCountdown(seconds);
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(countdownRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
  }

  useEffect(() => () => { if (countdownRef.current) clearInterval(countdownRef.current); }, []);

  function switchMethod(m) {
    Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
      setMethod(m); setError(''); setStep('form');
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    });
  }

  function switchMode(m) {
    Animated.timing(fadeAnim, { toValue: 0, duration: 120, useNativeDriver: true }).start(() => {
      setMode(m); setError('');
      Animated.timing(fadeAnim, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    });
  }

  /* ── OTP téléphone ── */
  async function sendOTP() {
    const full = phone.startsWith('+') ? phone : '+213' + phone.replace(/^0/, '');
    setLoading(true); setError('');
    const { error: err } = await supabase.auth.signInWithOtp({ phone: full });
    if (err) setError(err.message);
    else { setStep('otp'); startCountdown(120); }
    setLoading(false);
  }

  async function verifyOTP() {
    const full = phone.startsWith('+') ? phone : '+213' + phone.replace(/^0/, '');
    setLoading(true); setError('');
    const { data, error: err } = await supabase.auth.verifyOtp({ phone: full, token: otp, type: 'sms' });
    if (err) setError(err.message);
    else if (data.session) onAuth(data.session);
    setLoading(false);
  }

  /* ── Email ── */
  async function submitEmail() {
    if (!email.trim() || !password) { setError('Remplissez tous les champs.'); return; }
    if (mode === 'signup' && password !== confirm) { setError('Les mots de passe ne correspondent pas.'); return; }
    if (password.length < 6) { setError('Mot de passe trop court (6 caractères min).'); return; }

    setLoading(true); setError('');

    if (mode === 'signin') {
      const { data, error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (err) setError(err.message);
      else if (data.session) onAuth(data.session);
    } else {
      const { data, error: err } = await supabase.auth.signUp({ email: email.trim(), password });
      if (err) { setError(err.message); }
      else if (data.session) { onAuth(data.session); }
      else { setError('Vérifiez votre email pour confirmer votre compte.'); }
    }
    setLoading(false);
  }

  const isOtpComplete = otp.replace(/\s/g, '').length === 6;

  return (
    <SafeAreaView style={s.root}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* ── Hero ── */}
          <View style={s.hero}>
            <View style={s.heroDeco}>
              <Text style={s.heroDecoTxt}>✦</Text>
            </View>
            <Text style={s.logo}>MIDA</Text>
            <Text style={s.tagline}>La bonne table, au bon moment.</Text>
          </View>

          {/* ── Sélecteur de méthode ── */}
          <View style={s.methodRow}>
            <TouchableOpacity
              style={[s.methodBtn, method === 'email' && s.methodBtnOn]}
              onPress={() => switchMethod('email')}
            >
              <Text style={[s.methodTxt, method === 'email' && s.methodTxtOn]}>✉️  Email</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.methodBtn, method === 'phone' && s.methodBtnOn]}
              onPress={() => switchMethod('phone')}
            >
              <Text style={[s.methodTxt, method === 'phone' && s.methodTxtOn]}>📱  Téléphone</Text>
            </TouchableOpacity>
          </View>

          {/* ── Formulaire ── */}
          <Animated.View style={[s.card, { opacity: fadeAnim }]}>

            {/* Email */}
            {method === 'email' && (
              <>
                <Text style={s.cardTitle}>
                  {mode === 'signin' ? 'Connexion' : 'Créer un compte'}
                </Text>
                <Text style={s.cardSub}>
                  {mode === 'signin'
                    ? 'Ravi de vous revoir.'
                    : 'Rejoignez MIDA en quelques secondes.'}
                </Text>

                <Text style={s.fieldLabel}>ADRESSE EMAIL</Text>
                <View style={s.inputWrap}>
                  <TextInput
                    style={s.input}
                    placeholder="votre@email.com"
                    placeholderTextColor={C.dimmer}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                  />
                </View>

                <Text style={s.fieldLabel}>MOT DE PASSE</Text>
                <View style={s.inputWrap}>
                  <TextInput
                    style={[s.input, { flex: 1 }]}
                    placeholder="••••••••"
                    placeholderTextColor={C.dimmer}
                    secureTextEntry={!showPwd}
                    value={password}
                    onChangeText={setPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPwd(v => !v)} style={s.eyeBtn}>
                    <Text style={s.eyeTxt}>{showPwd ? '🙈' : '👁️'}</Text>
                  </TouchableOpacity>
                </View>

                {mode === 'signup' && (
                  <>
                    <Text style={s.fieldLabel}>CONFIRMER LE MOT DE PASSE</Text>
                    <View style={s.inputWrap}>
                      <TextInput
                        style={s.input}
                        placeholder="••••••••"
                        placeholderTextColor={C.dimmer}
                        secureTextEntry={!showPwd}
                        value={confirm}
                        onChangeText={setConfirm}
                      />
                    </View>
                  </>
                )}

                {!!error && <View style={s.errorBox}><Text style={s.errorTxt}>⚠️  {error}</Text></View>}

                <TouchableOpacity style={s.submitBtn} onPress={submitEmail} disabled={loading}>
                  {loading
                    ? <ActivityIndicator color={C.bg} />
                    : <Text style={s.submitTxt}>
                        {mode === 'signin' ? 'SE CONNECTER' : 'CRÉER MON COMPTE'}
                      </Text>
                  }
                </TouchableOpacity>

                <View style={s.modeSwitch}>
                  <Text style={s.modeSwitchTxt}>
                    {mode === 'signin' ? 'Pas encore de compte ?' : 'Déjà un compte ?'}
                  </Text>
                  <TouchableOpacity onPress={() => switchMode(mode === 'signin' ? 'signup' : 'signin')}>
                    <Text style={s.modeSwitchLink}>
                      {mode === 'signin' ? 'Créer un compte' : 'Se connecter'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* Téléphone — étape saisie */}
            {method === 'phone' && step === 'form' && (
              <>
                <Text style={s.cardTitle}>Votre numéro</Text>
                <Text style={s.cardSub}>Nous vous enverrons un code par SMS.</Text>

                <Text style={s.fieldLabel}>NUMÉRO DE TÉLÉPHONE</Text>
                <View style={s.phoneRow}>
                  <View style={s.prefix}>
                    <Text style={s.prefixFlag}>🇩🇿</Text>
                    <Text style={s.prefixTxt}>+213</Text>
                  </View>
                  <TextInput
                    style={s.phoneInput}
                    placeholder="6XX XX XX XX"
                    placeholderTextColor={C.dimmer}
                    keyboardType="phone-pad"
                    value={phone}
                    onChangeText={setPhone}
                  />
                </View>

                {!!error && <View style={s.errorBox}><Text style={s.errorTxt}>⚠️  {error}</Text></View>}

                <TouchableOpacity
                  style={[s.submitBtn, !phone && s.submitBtnDim]}
                  onPress={sendOTP}
                  disabled={loading || !phone}
                >
                  {loading
                    ? <ActivityIndicator color={C.bg} />
                    : <Text style={s.submitTxt}>ENVOYER LE CODE SMS</Text>
                  }
                </TouchableOpacity>
              </>
            )}

            {/* Téléphone — étape OTP */}
            {method === 'phone' && step === 'otp' && (
              <>
                <Text style={s.cardTitle}>Code de vérification</Text>
                <Text style={s.cardSub}>
                  Code envoyé au{'\n'}
                  <Text style={s.phoneHighlight}>+213 {phone.replace(/^0/, '')}</Text>
                </Text>

                <OtpInput value={otp} onChange={setOtp} />

                {/* Countdown */}
                <View style={s.countdownWrap}>
                  {countdown > 0
                    ? <Text style={s.countdownTxt}>Code valide encore <Text style={s.countdownNum}>{countdown}s</Text></Text>
                    : <Text style={[s.countdownTxt, { color: C.red }]}>Code expiré — renvoie un nouveau code</Text>
                  }
                </View>

                {!!error && <View style={s.errorBox}><Text style={s.errorTxt}>⚠️  {error}</Text></View>}

                <TouchableOpacity
                  style={[s.submitBtn, (!isOtpComplete || countdown === 0) && s.submitBtnDim]}
                  onPress={verifyOTP}
                  disabled={loading || !isOtpComplete || countdown === 0}
                >
                  {loading
                    ? <ActivityIndicator color={C.bg} />
                    : <Text style={s.submitTxt}>VALIDER</Text>
                  }
                </TouchableOpacity>

                <TouchableOpacity style={s.backLink} onPress={() => { setStep('form'); setOtp(''); setError(''); setCountdown(0); }}>
                  <Text style={s.backLinkTxt}>← Changer de numéro</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[s.resendLink, countdown > 0 && { opacity: 0.4 }]}
                  onPress={() => { if (countdown === 0) { setOtp(''); setError(''); sendOTP(); } }}
                  disabled={countdown > 0}
                >
                  <Text style={s.resendTxt}>
                    {countdown > 0 ? `Renvoyer dans ${countdown}s` : 'Renvoyer le code'}
                  </Text>
                </TouchableOpacity>
              </>
            )}

          </Animated.View>

          {/* Legal */}
          <Text style={s.legal}>
            En continuant, vous acceptez nos{' '}
            <Text style={s.legalLink}>Conditions d'utilisation</Text>
            {' '}et notre{' '}
            <Text style={s.legalLink}>Politique de confidentialité</Text>
          </Text>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:          { flex: 1, backgroundColor: C.bg },
  scroll:        { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 32 },

  /* Hero */
  hero:          { alignItems: 'center', paddingTop: 48, paddingBottom: 32 },
  heroDeco:      { width: 80, height: 80, borderRadius: 24, backgroundColor: 'rgba(200,151,90,0.1)', borderWidth: 1, borderColor: C.borderAccent, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  heroDecoTxt:   { color: C.accent, fontSize: 32 },
  logo:          { color: C.accent, fontSize: 32, fontWeight: '300', letterSpacing: 10, marginBottom: 6 },
  tagline:       { color: C.dim, fontSize: 12, fontStyle: 'italic', letterSpacing: 1 },

  /* Method selector */
  methodRow:     { flexDirection: 'row', backgroundColor: C.bg2, borderRadius: 16, borderWidth: 1, borderColor: C.border, padding: 4, marginBottom: 16, gap: 4 },
  methodBtn:     { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  methodBtnOn:   { backgroundColor: C.bg3, borderWidth: 1, borderColor: C.border },
  methodTxt:     { color: C.dimmer, fontSize: 13 },
  methodTxtOn:   { color: C.text },

  /* Card */
  card:          { backgroundColor: C.bg2, borderRadius: 20, borderWidth: 1, borderColor: C.border, padding: 24, marginBottom: 16 },
  cardTitle:     { color: C.text, fontSize: 22, fontWeight: '300', letterSpacing: 0.5, marginBottom: 6 },
  cardSub:       { color: C.dim, fontSize: 13, marginBottom: 24, lineHeight: 20 },

  /* Labels */
  fieldLabel:    { color: C.dimmer, fontSize: 10, letterSpacing: 3, marginBottom: 8 },

  /* Inputs */
  inputWrap:     { flexDirection: 'row', alignItems: 'center', backgroundColor: C.bg, borderRadius: 13, borderWidth: 1, borderColor: C.border, paddingHorizontal: 14, marginBottom: 16, minHeight: 50 },
  input:         { flex: 1, color: C.text, fontSize: 15, fontWeight: '300', paddingVertical: 13 },
  eyeBtn:        { paddingLeft: 8 },
  eyeTxt:        { fontSize: 16 },

  /* Phone */
  phoneRow:      { flexDirection: 'row', backgroundColor: C.bg, borderRadius: 13, borderWidth: 1, borderColor: C.border, marginBottom: 16, overflow: 'hidden', minHeight: 50 },
  prefix:        { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, backgroundColor: C.bg3, borderRightWidth: 1, borderRightColor: C.border },
  prefixFlag:    { fontSize: 16 },
  prefixTxt:     { color: C.text, fontSize: 13 },
  phoneInput:    { flex: 1, color: C.text, fontSize: 15, fontWeight: '300', paddingHorizontal: 14 },
  phoneHighlight:{ color: C.accent },

  /* Erreur */
  errorBox:      { backgroundColor: 'rgba(224,90,90,0.1)', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: 'rgba(224,90,90,0.3)', marginBottom: 14 },
  errorTxt:      { color: C.red, fontSize: 12, lineHeight: 18 },

  /* Bouton submit */
  submitBtn:     { backgroundColor: C.accent, borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginBottom: 4 },
  submitBtnDim:  { opacity: 0.45 },
  submitTxt:     { color: C.bg, fontSize: 13, fontWeight: '600', letterSpacing: 1.5 },

  /* Switch mode */
  modeSwitch:    { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 14 },
  modeSwitchTxt: { color: C.dim, fontSize: 13 },
  modeSwitchLink:{ color: C.accent2, fontSize: 13, fontWeight: '400' },

  /* Countdown OTP */
  countdownWrap: { alignItems: 'center', marginBottom: 12 },
  countdownTxt:  { color: C.dim, fontSize: 12 },
  countdownNum:  { color: C.accent, fontWeight: '600' },

  /* Liens retour / renvoi */
  backLink:      { alignItems: 'center', marginTop: 14 },
  backLinkTxt:   { color: C.dim, fontSize: 13 },
  resendLink:    { alignItems: 'center', marginTop: 10 },
  resendTxt:     { color: C.accent2, fontSize: 13 },

  /* Legal */
  legal:         { color: C.dimmer, fontSize: 10, textAlign: 'center', lineHeight: 16 },
  legalLink:     { color: C.dim },
});
