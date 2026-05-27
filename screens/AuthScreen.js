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
  borderFocus: 'rgba(200,151,90,0.5)',
};

/* ─── Champ avec icône + focus ring ─── */
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

/* ─── OTP — 6 cases ─── */
function OtpInput({ value, onChange }) {
  const inputRef = useRef(null);
  return (
    <TouchableOpacity onPress={() => inputRef.current?.focus()} activeOpacity={1} style={ot.wrap}>
      <View style={ot.row} pointerEvents="none">
        {Array.from({ length: 6 }).map((_, i) => (
          <View
            key={i}
            style={[
              ot.box,
              value[i]  && ot.boxFilled,
              value.length === i && ot.boxActive,
              value.length === 6 && ot.boxDone,
            ]}
          >
            <Text style={[ot.boxTxt, value[i] && ot.boxTxtFilled]}>{value[i] || ''}</Text>
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
    </TouchableOpacity>
  );
}
const ot = StyleSheet.create({
  wrap:       { alignItems: 'center', marginVertical: 8 },
  row:        { flexDirection: 'row', gap: 9, justifyContent: 'center' },
  box:        { width: 46, height: 58, borderRadius: 14, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.bg2, alignItems: 'center', justifyContent: 'center' },
  boxFilled:  { borderColor: C.accent2, backgroundColor: 'rgba(74,127,165,0.12)' },
  boxActive:  { borderColor: C.accent, borderWidth: 2, backgroundColor: 'rgba(200,151,90,0.08)' },
  boxDone:    { borderColor: C.green, backgroundColor: 'rgba(61,153,112,0.1)' },
  boxTxt:     { color: C.dimmer, fontSize: 22, fontWeight: '200' },
  boxTxtFilled:{ color: C.text, fontWeight: '300' },
  hidden:     { position: 'absolute', width: '100%', height: '100%', opacity: 0 },
});

/* ─── Barre de progression countdown ─── */
function CountdownBar({ total, remaining }) {
  const pct = total > 0 ? remaining / total : 0;
  const color = pct > 0.5 ? C.green : pct > 0.2 ? C.accent : C.red;
  return (
    <View style={cb.track}>
      <View style={[cb.fill, { width: `${Math.round(pct * 100)}%`, backgroundColor: color }]} />
    </View>
  );
}
const cb = StyleSheet.create({
  track: { height: 3, backgroundColor: C.bg3, borderRadius: 2, overflow: 'hidden', marginBottom: 6 },
  fill:  { height: '100%', borderRadius: 2 },
});

/* ─── Écran principal ─── */
export default function AuthScreen({ onAuth }) {
  const [method,    setMethod]    = useState('email');
  const [mode,      setMode]      = useState('signin');
  const [step,      setStep]      = useState('form');

  const [phone,     setPhone]     = useState('');
  const [email,     setEmail]     = useState('');
  const [password,  setPassword]  = useState('');
  const [confirm,   setConfirm]   = useState('');
  const [otp,       setOtp]       = useState('');

  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [showPwd,   setShowPwd]   = useState(false);
  const [countdown, setCountdown] = useState(0);
  const countdownTotal = useRef(120);
  const countdownRef   = useRef(null);

  const fadeAnim   = useRef(new Animated.Value(1)).current;
  const shakeAnim  = useRef(new Animated.Value(0)).current;
  const pulseAnim  = useRef(new Animated.Value(1)).current;
  const tabAnim    = useRef(new Animated.Value(0)).current; // 0=email, 1=phone

  /* Pulse du hero au mount */
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 2400, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 2400, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  useEffect(() => () => { if (countdownRef.current) clearInterval(countdownRef.current); }, []);

  function startCountdown(sec = 120) {
    countdownTotal.current = sec;
    setCountdown(sec);
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      setCountdown(p => {
        if (p <= 1) { clearInterval(countdownRef.current); return 0; }
        return p - 1;
      });
    }, 1000);
  }

  function shake() {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 1,  duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -1, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 1,  duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,  duration: 55, useNativeDriver: true }),
    ]).start();
  }

  function transition(fn) {
    Animated.timing(fadeAnim, { toValue: 0, duration: 140, useNativeDriver: true }).start(() => {
      fn();
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    });
  }

  function switchMethod(m) {
    transition(() => { setMethod(m); setError(''); setStep('form'); });
    Animated.timing(tabAnim, { toValue: m === 'email' ? 0 : 1, duration: 220, useNativeDriver: false }).start();
  }

  function switchMode(m) {
    transition(() => { setMode(m); setError(''); });
  }

  /* ── OTP ── */
  async function sendOTP() {
    const full = phone.startsWith('+') ? phone : '+213' + phone.replace(/^0/, '');
    setLoading(true); setError('');
    const { error: err } = await supabase.auth.signInWithOtp({ phone: full });
    if (err) { setError(err.message); shake(); }
    else { setStep('otp'); startCountdown(120); }
    setLoading(false);
  }

  async function verifyOTP() {
    const full = phone.startsWith('+') ? phone : '+213' + phone.replace(/^0/, '');
    setLoading(true); setError('');
    const { data, error: err } = await supabase.auth.verifyOtp({ phone: full, token: otp, type: 'sms' });
    if (err) { setError(err.message); shake(); }
    else if (data.session) onAuth(data.session);
    setLoading(false);
  }

  /* ── Email ── */
  async function submitEmail() {
    if (!email.trim() || !password) { setError('Remplissez tous les champs.'); shake(); return; }
    if (mode === 'signup' && password !== confirm) { setError('Les mots de passe ne correspondent pas.'); shake(); return; }
    if (password.length < 6) { setError('Mot de passe : 6 caractères minimum.'); shake(); return; }

    setLoading(true); setError('');

    if (mode === 'signin') {
      const { data, error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (err) { setError(err.message); shake(); }
      else if (data.session) onAuth(data.session);
    } else {
      const { data, error: err } = await supabase.auth.signUp({ email: email.trim(), password });
      if (err) { setError(err.message); shake(); }
      else if (data.session) onAuth(data.session);
      else setError('Vérifiez votre email pour confirmer votre compte.');
    }
    setLoading(false);
  }

  const isOtpComplete = otp.length === 6;
  const shakeX = shakeAnim.interpolate({ inputRange: [-1, 1], outputRange: [-10, 10] });

  const tabLeft = tabAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '50%'] });

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

          {/* ── Onglets méthode ── */}
          <View style={s.tabRow}>
            <View style={[s.tabIndicator, { left: tabLeft }]} />
            <TouchableOpacity style={s.tabBtn} onPress={() => switchMethod('email')} activeOpacity={0.7}>
              <Text style={[s.tabTxt, method === 'email' && s.tabTxtOn]}>✉️  Email</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.tabBtn} onPress={() => switchMethod('phone')} activeOpacity={0.7}>
              <Text style={[s.tabTxt, method === 'phone' && s.tabTxtOn]}>📱  Téléphone</Text>
            </TouchableOpacity>
          </View>

          {/* ── Card ── */}
          <Animated.View style={[s.card, { opacity: fadeAnim, transform: [{ translateX: shakeX }] }]}>

            {/* Email */}
            {method === 'email' && (
              <>
                <View style={s.cardHead}>
                  <Text style={s.cardTitle}>
                    {mode === 'signin' ? 'Connexion' : 'Créer un compte'}
                  </Text>
                  <Text style={s.cardSub}>
                    {mode === 'signin' ? 'Ravi de vous revoir 👋' : 'Rejoignez MIDA en quelques secondes.'}
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
                  <TouchableOpacity onPress={() => setShowPwd(v => !v)} style={s.eyeBtn} hitSlop={{ top:8, bottom:8, left:8, right:8 }}>
                    <Text style={s.eyeTxt}>{showPwd ? 'Masquer' : 'Afficher'}</Text>
                  </TouchableOpacity>
                </Field>

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

                <TouchableOpacity style={[s.submitBtn, loading && { opacity: 0.75 }]} onPress={submitEmail} disabled={loading} activeOpacity={0.85}>
                  {loading
                    ? <ActivityIndicator color={C.bg} size="small" />
                    : <Text style={s.submitTxt}>
                        {mode === 'signin' ? 'SE CONNECTER  →' : 'CRÉER MON COMPTE  →'}
                      </Text>
                  }
                </TouchableOpacity>

                <View style={s.modeRow}>
                  <Text style={s.modeTxt}>
                    {mode === 'signin' ? 'Pas encore de compte ?' : 'Déjà un compte ?'}
                  </Text>
                  <TouchableOpacity onPress={() => switchMode(mode === 'signin' ? 'signup' : 'signin')} activeOpacity={0.7}>
                    <Text style={s.modeLink}>
                      {mode === 'signin' ? 'Créer un compte' : 'Se connecter'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* Téléphone — saisie numéro */}
            {method === 'phone' && step === 'form' && (
              <>
                <View style={s.cardHead}>
                  <Text style={s.cardTitle}>Votre numéro</Text>
                  <Text style={s.cardSub}>Un code de vérification vous sera envoyé par SMS.</Text>
                </View>

                <Text style={f.label}>NUMÉRO DE TÉLÉPHONE</Text>
                <View style={s.phoneRow}>
                  <View style={s.phonePrefixWrap}>
                    <Text style={s.phonePrefixFlag}>🇩🇿</Text>
                    <Text style={s.phonePrefixTxt}>+213</Text>
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

                {!!error && (
                  <View style={s.errorBox}>
                    <Text style={s.errorIcon}>⚠️</Text>
                    <Text style={s.errorTxt}>{error}</Text>
                  </View>
                )}

                <TouchableOpacity
                  style={[s.submitBtn, (!phone || loading) && { opacity: 0.45 }]}
                  onPress={sendOTP}
                  disabled={loading || !phone}
                  activeOpacity={0.85}
                >
                  {loading
                    ? <ActivityIndicator color={C.bg} size="small" />
                    : <Text style={s.submitTxt}>ENVOYER LE CODE SMS  →</Text>
                  }
                </TouchableOpacity>
              </>
            )}

            {/* Téléphone — OTP */}
            {method === 'phone' && step === 'otp' && (
              <>
                {/* Badge SMS envoyé */}
                <View style={s.smsBadge}>
                  <View style={s.smsIconWrap}>
                    <Text style={s.smsIcon}>💬</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.smsSent}>Code envoyé</Text>
                    <Text style={s.smsNumber}>+213 {phone.replace(/^0/, '')}</Text>
                  </View>
                  <TouchableOpacity onPress={() => { setStep('form'); setOtp(''); setError(''); setCountdown(0); }} activeOpacity={0.7}>
                    <Text style={s.smsChange}>Modifier</Text>
                  </TouchableOpacity>
                </View>

                <View style={s.otpSection}>
                  <Text style={s.otpLabel}>ENTREZ LES 6 CHIFFRES</Text>
                  <OtpInput value={otp} onChange={setOtp} />

                  {/* Countdown */}
                  <View style={s.countdownRow}>
                    <CountdownBar total={countdownTotal.current} remaining={countdown} />
                    <Text style={[s.countdownTxt, countdown === 0 && { color: C.red }]}>
                      {countdown > 0
                        ? `Code valide encore ${countdown}s`
                        : 'Code expiré'}
                    </Text>
                  </View>
                </View>

                {!!error && (
                  <View style={s.errorBox}>
                    <Text style={s.errorIcon}>⚠️</Text>
                    <Text style={s.errorTxt}>{error}</Text>
                  </View>
                )}

                <TouchableOpacity
                  style={[s.submitBtn, (!isOtpComplete || countdown === 0 || loading) && { opacity: 0.45 }]}
                  onPress={verifyOTP}
                  disabled={loading || !isOtpComplete || countdown === 0}
                  activeOpacity={0.85}
                >
                  {loading
                    ? <ActivityIndicator color={C.bg} size="small" />
                    : <Text style={s.submitTxt}>
                        {isOtpComplete ? 'VALIDER LE CODE  ✓' : 'VALIDER LE CODE'}
                      </Text>
                  }
                </TouchableOpacity>

                <TouchableOpacity
                  style={[s.resendBtn, countdown > 0 && { opacity: 0.4 }]}
                  onPress={() => { if (countdown === 0) { setOtp(''); setError(''); sendOTP(); } }}
                  disabled={countdown > 0}
                  activeOpacity={0.7}
                >
                  <Text style={s.resendTxt}>
                    {countdown > 0 ? `Renvoyer dans ${countdown}s` : '↺  Renvoyer le code'}
                  </Text>
                </TouchableOpacity>
              </>
            )}

          </Animated.View>

          {/* Legal */}
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

  /* ── Hero ── */
  hero:          { alignItems: 'center', paddingTop: 40, paddingBottom: 28 },
  heroRingOuter: { width: 88, height: 88, borderRadius: 26, backgroundColor: 'rgba(200,151,90,0.08)', borderWidth: 1.5, borderColor: 'rgba(200,151,90,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  heroRingInner: { width: 60, height: 60, borderRadius: 17, backgroundColor: 'rgba(200,151,90,0.14)', borderWidth: 1, borderColor: 'rgba(200,151,90,0.3)', alignItems: 'center', justifyContent: 'center' },
  heroStar:      { color: C.accent, fontSize: 28 },
  logo:          { color: C.accent, fontSize: 30, fontWeight: '300', letterSpacing: 10, marginBottom: 6 },
  tagline:       { color: C.dim, fontSize: 12, fontStyle: 'italic', letterSpacing: 0.5 },

  /* ── Onglets ── */
  tabRow:        { flexDirection: 'row', backgroundColor: C.bg2, borderRadius: 16, borderWidth: 1, borderColor: C.border, padding: 4, marginBottom: 14, position: 'relative' },
  tabIndicator:  { position: 'absolute', top: 4, width: '50%', bottom: 4, backgroundColor: C.bg3, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  tabBtn:        { flex: 1, paddingVertical: 11, alignItems: 'center', zIndex: 1 },
  tabTxt:        { color: C.dimmer, fontSize: 13 },
  tabTxtOn:      { color: C.text, fontWeight: '400' },

  /* ── Card ── */
  card:          { backgroundColor: C.bg2, borderRadius: 22, borderWidth: 1, borderColor: C.border, padding: 22, marginBottom: 14 },
  cardHead:      { marginBottom: 22 },
  cardTitle:     { color: C.text, fontSize: 22, fontWeight: '300', letterSpacing: 0.3, marginBottom: 5 },
  cardSub:       { color: C.dim, fontSize: 13, lineHeight: 19 },

  /* ── Input ── */
  input:         { flex: 1, color: C.text, fontSize: 15, fontWeight: '300', paddingVertical: 0 },
  eyeBtn:        { marginLeft: 8 },
  eyeTxt:        { color: C.accent2, fontSize: 12 },

  /* ── Phone ── */
  phoneRow:         { flexDirection: 'row', backgroundColor: C.bg2, borderRadius: 14, borderWidth: 1.5, borderColor: C.border, marginBottom: 14, overflow: 'hidden', minHeight: 52 },
  phonePrefixWrap:  { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 14, backgroundColor: C.bg3, borderRightWidth: 1, borderRightColor: C.border },
  phonePrefixFlag:  { fontSize: 16 },
  phonePrefixTxt:   { color: C.text, fontSize: 14, fontWeight: '300' },
  phoneInput:       { flex: 1, color: C.text, fontSize: 15, fontWeight: '300', paddingHorizontal: 14 },

  /* ── SMS badge ── */
  smsBadge:      { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(61,153,112,0.08)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(61,153,112,0.25)', padding: 14, marginBottom: 20 },
  smsIconWrap:   { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(61,153,112,0.15)', alignItems: 'center', justifyContent: 'center' },
  smsIcon:       { fontSize: 20 },
  smsSent:       { color: C.green, fontSize: 11, fontWeight: '500', marginBottom: 2 },
  smsNumber:     { color: C.text, fontSize: 14, fontWeight: '300' },
  smsChange:     { color: C.accent2, fontSize: 12 },

  /* ── OTP ── */
  otpSection:    { marginBottom: 16 },
  otpLabel:      { color: C.dimmer, fontSize: 9, letterSpacing: 3, fontWeight: '500', textAlign: 'center', marginBottom: 14 },
  countdownRow:  { marginTop: 14, paddingHorizontal: 4 },
  countdownTxt:  { color: C.dim, fontSize: 11, textAlign: 'center' },

  /* ── Erreur ── */
  errorBox:      { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: 'rgba(224,90,90,0.08)', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: 'rgba(224,90,90,0.25)', marginBottom: 14 },
  errorIcon:     { fontSize: 13 },
  errorTxt:      { color: C.red, fontSize: 12, lineHeight: 18, flex: 1 },

  /* ── Submit ── */
  submitBtn:     { backgroundColor: C.accent, borderRadius: 15, paddingVertical: 16, alignItems: 'center', marginTop: 4 },
  submitTxt:     { color: C.bg, fontSize: 13, fontWeight: '600', letterSpacing: 1.2 },

  /* ── Mode switch ── */
  modeRow:       { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 16 },
  modeTxt:       { color: C.dim, fontSize: 13 },
  modeLink:      { color: C.accent2, fontSize: 13 },

  /* ── Renvoi SMS ── */
  resendBtn:     { alignItems: 'center', marginTop: 14 },
  resendTxt:     { color: C.accent2, fontSize: 13 },

  /* ── Legal ── */
  legal:         { color: C.dimmer, fontSize: 10, textAlign: 'center', lineHeight: 16 },
  legalLink:     { color: C.dim },
});
