import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, Alert } from 'react-native';
import { supabase } from '../supabase';
import { colors, spacing, radius, typography } from '../src/theme';
import Button from '../src/components/Button';
import { useSalon } from '../src/SalonContext';
import { useT } from '../src/i18n';

const CHAMPS = [
  { key: 'nom', cle: 'reglages.nomSalon' },
  { key: 'telephone', cle: 'reglages.telephone' },
  { key: 'adresse', cle: 'reglages.adresse' },
  { key: 'quartier', cle: 'reglages.quartier' },
  { key: 'ville', cle: 'reglages.ville' },
  { key: 'wilaya', cle: 'reglages.wilaya' },
  { key: 'registre_commerce', cle: 'inscription.registreCommerce' },
];

export default function ProInscriptionScreen({ navigation }) {
  const t = useT();
  const [form, setForm] = useState({});
  const [envoi, setEnvoi] = useState(false);
  const { rechargerSalons } = useSalon();

  const soumettre = async () => {
    if (!form.nom || !form.telephone || !form.adresse || !form.ville) {
      Alert.alert(t('inscription.champsManquants'), t('inscription.champsManquantsMessage'));
      return;
    }
    setEnvoi(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('salons').insert({ ...form, owner_id: user.id, statut: 'en_attente' });
    setEnvoi(false);

    if (error) {
      Alert.alert(t('commun.erreur'), error.message);
      return;
    }
    await rechargerSalons?.();
    Alert.alert(t('inscription.envoyee'), t('inscription.envoyeeMessage'));
    if (navigation.canGoBack()) navigation.goBack();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.md, gap: spacing.md }}>
      <Text style={styles.titre}>{t('inscription.titre')}</Text>
      <Text style={styles.sousTitre}>{t('inscription.sousTitre')}</Text>

      {CHAMPS.map((champ) => (
        <TextInput
          key={champ.key}
          style={styles.input}
          placeholder={t(champ.cle)}
          placeholderTextColor={colors.textSecondary}
          value={form[champ.key] ?? ''}
          onChangeText={(v) => setForm((prev) => ({ ...prev, [champ.key]: v }))}
        />
      ))}

      <Button title={t('inscription.envoyer')} onPress={soumettre} loading={envoi} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  titre: { fontSize: typography.size.xl, fontWeight: typography.weight.bold, color: colors.secondary },
  sousTitre: { fontSize: typography.size.sm, color: colors.textSecondary, marginBottom: spacing.sm },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: typography.size.md,
    color: colors.textPrimary,
  },
});
