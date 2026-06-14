import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Animated } from 'react-native';
import { supabase } from '../../supabase';

export default function useAuth({ onAuth, userType, onSwitchType }) {
  const isPro = useMemo(() => userType === 'pro', [userType]);

  const [mode,         setMode]         = useState('signin');
  const [email,        setEmail]        = useState('');
  const [password,     setPassword]     = useState('');
  const [confirm,      setConfirm]      = useState('');
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState('');
  const [showPwd,      setShowPwd]      = useState(false);
  const [success,      setSuccess]      = useState('');
  const [resetSent,    setResetSent]    = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim  = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 2400, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 2400, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  const shakeX = useMemo(
    () => shakeAnim.interpolate({ inputRange: [-1, 1], outputRange: [-10, 10] }),
    [],
  );

  const shake = useCallback(() => {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 1,  duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -1, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 1,  duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,  duration: 55, useNativeDriver: true }),
    ]).start();
  }, []);

  const switchMode = useCallback((m) => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 140, useNativeDriver: true }).start(() => {
      setMode(m); setError(''); setSuccess(''); setResetSent(false);
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    });
  }, []);

  const sendReset = useCallback(async () => {
    if (!email.trim()) { setError("Entrez votre email d'abord."); shake(); return; }
    setResetLoading(true);
    try {
      await supabase.auth.resetPasswordForEmail(email.trim());
      setResetSent(true);
    } finally {
      setResetLoading(false);
    }
  }, [email, shake]);

  const submit = useCallback(async () => {
    if (!email.trim() || !password) { setError('Remplissez tous les champs.'); shake(); return; }
    if (mode === 'signup' && password !== confirm) { setError('Les mots de passe ne correspondent pas.'); shake(); return; }
    if (password.length < 6) { setError('Mot de passe : 6 caractères minimum.'); shake(); return; }
    setLoading(true); setError(''); setSuccess('');
    try {
      if (mode === 'signin') {
        const { data, error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (err) { setError(err.message); shake(); }
        else if (data?.session) onAuth(data.session);
        else setError('Connexion échouée. Vérifiez vos identifiants.');
      } else {
        const { data, error: err } = await supabase.auth.signUp({ email: email.trim(), password });
        if (err) {
          if (err.message.toLowerCase().includes('already registered') || err.message.toLowerCase().includes('already been registered')) {
            setError('Cet email est déjà utilisé. Connectez-vous avec votre mot de passe.');
            switchMode('signin');
          } else { setError(err.message); shake(); }
        } else if (data?.session) {
          onAuth(data.session);
        } else {
          const { data: d2 } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
          if (d2?.session) { onAuth(d2.session); }
          else { setSuccess('Compte créé ! Connectez-vous avec vos identifiants.'); switchMode('signin'); }
        }
      }
    } catch {
      setError('Erreur réseau. Vérifiez votre connexion.');
      shake();
    } finally {
      setLoading(false);
    }
  }, [email, password, confirm, mode, shake, switchMode, onAuth]);

  const switchToSignin = useCallback(() => switchMode('signin'), [switchMode]);
  const switchToSignup = useCallback(() => switchMode('signup'), [switchMode]);
  const toggleShowPwd  = useCallback(() => setShowPwd(v => !v), []);
  const clearSuccess   = useCallback(() => { setSuccess(''); switchMode('signin'); }, [switchMode]);
  const switchType     = useCallback(() => onSwitchType && onSwitchType(isPro ? 'client' : 'pro'), [onSwitchType, isPro]);

  return {
    isPro, mode, email, setEmail, password, setPassword, confirm, setConfirm,
    loading, error, showPwd, success, resetSent, resetLoading,
    pulseAnim, fadeAnim, shakeX,
    switchToSignin, switchToSignup, toggleShowPwd, clearSuccess, switchType,
    sendReset, submit,
  };
}
