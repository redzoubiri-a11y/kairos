import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert } from 'react-native';
import { supabase } from '../supabase';
import { colors, spacing, radius, typography } from '../src/theme';
import Button from '../src/components/Button';
import { useT } from '../src/i18n';

export default function ReviewFormScreen({ route, navigation }) {
  const t = useT();
  const { bookingId, salonId, salonNom } = route.params;
  const [note, setNote] = useState(0);
  const [commentaire, setCommentaire] = useState('');
  const [envoi, setEnvoi] = useState(false);

  const envoyer = async () => {
    if (note === 0) {
      Alert.alert(t('avis.noteRequise'), t('avis.noteRequiseMessage'));
      return;
    }

    setEnvoi(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('reviews').insert({
      booking_id: bookingId,
      client_id: user.id,
      salon_id: salonId,
      note,
      commentaire: commentaire.trim() || null,
    });
    setEnvoi(false);

    if (error) {
      Alert.alert(t('commun.erreur'), error.message);
      return;
    }
    Alert.alert(t('avis.merci'), t('avis.merciMessage'));
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titre}>{t('avis.titre', { salon: salonNom })}</Text>

      <View style={styles.etoiles}>
        {[1, 2, 3, 4, 5].map((valeur) => (
          <Pressable key={valeur} onPress={() => setNote(valeur)} hitSlop={8}>
            <Text style={[styles.etoile, valeur <= note && styles.etoilePleine]}>★</Text>
          </Pressable>
        ))}
      </View>

      <TextInput
        style={styles.input}
        placeholder={t('avis.placeholder')}
        placeholderTextColor={colors.textSecondary}
        value={commentaire}
        onChangeText={setCommentaire}
        multiline
        numberOfLines={5}
        textAlignVertical="top"
      />

      <Button title={t('avis.publier')} onPress={envoyer} loading={envoi} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.md, gap: spacing.md },
  titre: { fontSize: typography.size.xl, fontWeight: typography.weight.bold, color: colors.secondary },
  etoiles: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm, marginVertical: spacing.md },
  etoile: { fontSize: 40, color: colors.border },
  etoilePleine: { color: colors.accent },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    minHeight: 120,
    fontSize: typography.size.md,
    color: colors.textPrimary,
  },
});
