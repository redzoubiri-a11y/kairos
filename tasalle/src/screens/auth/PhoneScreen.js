import { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform } from 'react-native';
import { Screen, Header } from '../../components/Screen';
import MInput from '../../components/MInput';
import MButton from '../../components/MButton';
import TasalleLogo from '../../components/TasalleLogo';
import { useTheme } from '../../context/ThemeContext';
import { useI18n } from '../../i18n';
import { isValidPhone } from '../../lib/format';
import * as api from '../../data';

export default function PhoneScreen({ navigation }) {
  const { colors, typography, spacing } = useTheme();
  const { t } = useI18n();

  const [phone, setPhone] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!isValidPhone(phone)) {
      setError(t('auth.invalidPhone'));
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const { demoCode } = await api.sendOtp(phone);
      navigation.navigate('Otp', { phone, demoCode });
    } catch (e) {
      setError(e.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <Header title="" bordered={false} onBack={navigation.canGoBack() ? navigation.goBack : undefined} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, padding: spacing.xl, gap: spacing.xxl }}
      >
        {/* Première page de l'application : la marque y est donnée en entier,
            dans la composition du document de référence. Ailleurs, l'en-tête
            se contente du monogramme. */}
        <View style={{ gap: spacing.xxl, alignItems: 'center' }}>
          <TasalleLogo size={72} stacked />
          <View style={{ gap: spacing.xs }}>
            <Text style={[typography.h2, { color: colors.dark, textAlign: 'center' }]}>
              {t('auth.welcome')}
            </Text>
            <Text style={[typography.body, { color: colors.warmGray, textAlign: 'center' }]}>
              {t('auth.subtitle')}
            </Text>
          </View>
        </View>

        <View style={{ gap: spacing.lg }}>
          <MInput
            label={t('auth.phone')}
            value={phone}
            onChangeText={(v) => {
              setPhone(v);
              if (error) setError(null);
            }}
            placeholder="0555 12 34 56"
            keyboardType="phone-pad"
            direction="ltr"
            icon="call-outline"
            error={error}
            hint={t('auth.phoneHint')}
            onSubmitEditing={submit}
            returnKeyType="go"
          />

          <MButton label={t('auth.sendCode')} onPress={submit} loading={loading} size="lg" full />
        </View>

        {api.isDemoMode ? (
          <Text style={[typography.caption, { color: colors.warmGray, textAlign: 'center' }]}>
            Mode démo — essayez 0555 10 00 01 (pro) ou 0661 23 45 67 (client)
          </Text>
        ) : null}
      </KeyboardAvoidingView>
    </Screen>
  );
}
