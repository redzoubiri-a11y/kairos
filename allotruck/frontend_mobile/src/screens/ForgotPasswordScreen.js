import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Button from '../components/Button';
import Input from '../components/Input';
import ErrorBanner from '../components/ErrorBanner';
import { authApi } from '../api/endpoints';
import { colors, radii, spacing, typography } from '../theme';

// Deux etapes dans un seul ecran : l'email saisi a l'etape 1 reste disponible a
// l'etape 2 sans passer par la navigation, et un retour en arriere permet de
// redemander un code sans tout ressaisir.
const ETAPE_EMAIL = 'email';
const ETAPE_CODE = 'code';

export default function ForgotPasswordScreen({ navigation }) {
  const [etape, setEtape] = useState(ETAPE_EMAIL);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const demanderCode = async () => {
    const cleanEmail = email.trim();
    if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) {
      setFieldErrors({ email: 'Email invalide' });
      return;
    }
    setFieldErrors({});
    setLoading(true);
    setError(null);
    try {
      await authApi.forgotPassword(cleanEmail);
      // Le serveur repond pareil que le compte existe ou non : on ne peut donc
      // pas dire « email envoye », seulement « si ce compte existe ».
      setEtape(ETAPE_CODE);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const reinitialiser = async () => {
    const errors = {};
    if (!/^\d{6}$/.test(code.trim())) errors.code = 'Code a six chiffres';
    if (password.length < 8) errors.password = 'Au moins 8 caracteres';
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    setError(null);
    try {
      await authApi.resetPassword({ email: email.trim(), code: code.trim(), password });
      navigation.navigate('Login', { passwordReset: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.logo}>
            <Ionicons name="key-outline" size={28} color="#FFFFFF" />
          </View>

          {etape === ETAPE_EMAIL ? (
            <>
              <Text style={styles.title}>Mot de passe oublie</Text>
              <Text style={styles.subtitle}>
                Indiquez l adresse de votre compte : nous vous envoyons un code a six chiffres.
              </Text>

              <ErrorBanner message={error} />

              <Input
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="vous@exemple.dz"
                icon="mail-outline"
                keyboardType="email-address"
                autoCapitalize="none"
                error={fieldErrors.email}
              />

              <Button title="Recevoir un code" onPress={demanderCode} loading={loading} />
            </>
          ) : (
            <>
              <Text style={styles.title}>Votre nouveau mot de passe</Text>
              <View style={styles.notice}>
                <Ionicons name="mail-unread-outline" size={16} color={colors.primaryDark} />
                <Text style={styles.noticeText}>
                  Si un compte existe pour {email.trim()}, un code a six chiffres vient d y etre
                  envoye. Il expire dans 30 minutes.
                </Text>
              </View>

              <ErrorBanner message={error} />

              <Input
                label="Code recu"
                value={code}
                onChangeText={setCode}
                placeholder="123456"
                icon="keypad-outline"
                keyboardType="number-pad"
                maxLength={6}
                error={fieldErrors.code}
              />
              <Input
                label="Nouveau mot de passe"
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                icon="lock-closed-outline"
                secureTextEntry
                error={fieldErrors.password}
              />

              <Button title="Reinitialiser" onPress={reinitialiser} loading={loading} />
              <Button
                title="Changer d adresse ou renvoyer un code"
                variant="ghost"
                onPress={() => {
                  setEtape(ETAPE_EMAIL);
                  setCode('');
                  setError(null);
                }}
              />
            </>
          )}

          <View style={styles.footer}>
            <Button
              title="Retour a la connexion"
              variant="ghost"
              fullWidth={false}
              onPress={() => navigation.navigate('Login')}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.card },
  flex: { flex: 1 },
  scroll: { padding: spacing.xl, flexGrow: 1, justifyContent: 'center' },
  logo: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  title: { ...typography.h1, color: colors.text },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.primarySoft,
    borderRadius: radii.md,
    padding: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  noticeText: {
    ...typography.small,
    color: colors.text,
    flex: 1,
    marginLeft: spacing.sm,
    lineHeight: 19,
  },
  footer: { alignItems: 'center', marginTop: spacing.md },
});
