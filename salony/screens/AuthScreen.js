import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { supabase } from '../supabase';
import { colors, spacing, radius, typography } from '../src/theme';
import Button from '../src/components/Button';
import { useT } from '../src/i18n';

export default function AuthScreen({ navigation }) {
  const t = useT();
  const [mode, setMode] = useState('connexion'); // connexion | inscription
  const [telephone, setTelephone] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState(null);

  const handleSubmit = async () => {
    setLoading(true);
    setErreur(null);

    const action = mode === 'connexion'
      ? supabase.auth.signInWithPassword({ phone: telephone, password: motDePasse })
      : supabase.auth.signUp({ phone: telephone, password: motDePasse });

    const { error } = await action;
    setLoading(false);
    if (error) setErreur(error.message);
    // navigation gérée par le listener onAuthStateChange dans App.js
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.titre}>Salony</Text>
      <Text style={styles.sousTitre}>
        {t(mode === 'connexion' ? 'auth.bienvenue' : 'auth.creerCompte')}
      </Text>

      <TextInput
        style={styles.input}
        placeholder={t('auth.telephone')}
        placeholderTextColor={colors.textSecondary}
        keyboardType="phone-pad"
        value={telephone}
        onChangeText={setTelephone}
      />
      <TextInput
        style={styles.input}
        placeholder={t('auth.motDePasse')}
        placeholderTextColor={colors.textSecondary}
        secureTextEntry
        value={motDePasse}
        onChangeText={setMotDePasse}
      />

      {erreur && <Text style={styles.erreur}>{erreur}</Text>}

      <Button
        title={t(mode === 'connexion' ? 'auth.seConnecter' : 'auth.sInscrire')}
        onPress={handleSubmit}
        loading={loading}
        style={styles.submit}
      />

      <Button
        title={t(mode === 'connexion' ? 'auth.versInscription' : 'auth.versConnexion')}
        variant="ghost"
        onPress={() => setMode(mode === 'connexion' ? 'inscription' : 'connexion')}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', padding: spacing.lg },
  titre: { fontSize: typography.size.display, fontWeight: typography.weight.bold, color: colors.secondary, textAlign: 'center' },
  sousTitre: { fontSize: typography.size.md, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xs, marginBottom: spacing.xl },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
    fontSize: typography.size.md,
    color: colors.textPrimary,
  },
  erreur: { color: colors.error, marginBottom: spacing.md, fontSize: typography.size.sm },
  submit: { marginTop: spacing.sm, marginBottom: spacing.sm },
});
