import { useEffect, useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { Screen, Header } from '../../components/Screen';
import MInput from '../../components/MInput';
import MButton from '../../components/MButton';
import { useTheme } from '../../context/ThemeContext';
import { useI18n } from '../../i18n';
import { useAuth } from '../../context/AuthContext';
import { displayPhone } from '../../lib/format';
import * as api from '../../data';

export default function OtpScreen({ route, navigation }) {
  const { phone, demoCode } = route.params || {};
  const { colors, typography, spacing } = useTheme();
  const { t } = useI18n();
  const { login } = useAuth();

  const [code, setCode] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(30);

  useEffect(() => {
    if (countdown <= 0) return undefined;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const submit = async (value = code) => {
    if (value.length < 6) {
      setError(t('auth.invalidOtp'));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // La navigation post-connexion est pilotée par App.js via l'état d'auth.
      await login(phone, value);
    } catch (e) {
      setError(e.code === 'INVALID_OTP' ? t('auth.invalidOtp') : e.message || t('common.error'));
      setLoading(false);
    }
  };

  const resend = async () => {
    await api.sendOtp(phone);
    setCountdown(30);
  };

  return (
    <Screen>
      <Header title={t('auth.otpTitle')} onBack={navigation.goBack} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, padding: spacing.xl, gap: spacing.xxl }}
      >
        <Text style={[typography.body, { color: colors.warmGray }]}>
          {t('auth.otpSubtitle')} <Text style={{ color: colors.dark }}>{displayPhone(phone)}</Text>
        </Text>

        <View style={{ gap: spacing.lg }}>
          <MInput
            value={code}
            onChangeText={(v) => {
              const digits = v.replace(/\D/g, '').slice(0, 6);
              setCode(digits);
              if (error) setError(null);
              if (digits.length === 6) submit(digits);
            }}
            placeholder="— — — — — —"
            keyboardType="number-pad"
            direction="ltr"
            maxLength={6}
            error={error}
          />

          <MButton label={t('auth.verify')} onPress={() => submit()} loading={loading} size="lg" full />

          {countdown > 0 ? (
            <Text style={[typography.caption, { color: colors.warmGray, textAlign: 'center' }]}>
              {t('auth.resendIn', { s: countdown })}
            </Text>
          ) : (
            <Pressable onPress={resend} accessibilityRole="button">
              <Text style={[typography.secondary, { color: colors.primaryInk, textAlign: 'center' }]}>
                {t('auth.resend')}
              </Text>
            </Pressable>
          )}
        </View>

        {demoCode ? (
          <View
            style={{
              backgroundColor: colors.goldLight,
              borderWidth: 1,
              borderColor: colors.gold,
              borderRadius: 10,
              padding: spacing.md,
            }}
          >
            <Text style={[typography.caption, { color: colors.goldText, textAlign: 'center' }]}>
              {t('auth.demoHint', { code: demoCode })}
            </Text>
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </Screen>
  );
}
