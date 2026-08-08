import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Button from '../components/Button';
import Input from '../components/Input';
import ErrorBanner from '../components/ErrorBanner';
import { useAuthStore } from '../store/authStore';
import { colors, spacing, typography } from '../theme';

export default function LoginScreen({ navigation }) {
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const validate = () => {
    const errors = {};
    if (!email.trim()) errors.email = 'Email requis';
    else if (!/^\S+@\S+\.\S+$/.test(email.trim())) errors.email = 'Email invalide';
    if (!password) errors.password = 'Mot de passe requis';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const onSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    setError(null);
    try {
      await login({ email: email.trim(), password });
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
            <Ionicons name="bus" size={30} color="#1A1206" />
          </View>
          <Text style={styles.title}>Bon retour</Text>
          <Text style={styles.subtitle}>Connectez-vous pour retrouver vos missions.</Text>

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
          <Input
            label="Mot de passe"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            icon="lock-closed-outline"
            secureTextEntry
            error={fieldErrors.password}
          />

          <Button title="Se connecter" onPress={onSubmit} loading={loading} />

          <View style={styles.footer}>
            <Text style={styles.footerText}>Pas encore de compte ?</Text>
            <Button
              title="Creer un compte"
              variant="ghost"
              fullWidth={false}
              onPress={() => navigation.navigate('Signup')}
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
  subtitle: { ...typography.body, color: colors.textMuted, marginTop: spacing.xs, marginBottom: spacing.xl },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: spacing.lg },
  footerText: { ...typography.small, color: colors.textMuted },
});
