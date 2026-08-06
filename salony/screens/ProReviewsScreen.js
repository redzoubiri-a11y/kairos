import React, { useCallback, useState } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../supabase';
import { colors, spacing, radius, typography } from '../src/theme';
import Card from '../src/components/Card';
import Button from '../src/components/Button';
import EmptyState from '../src/components/EmptyState';
import { useT } from '../src/i18n';

export default function ProReviewsScreen({ route }) {
  const t = useT();
  const { salonId } = route.params;
  const [reviews, setReviews] = useState([]);
  const [brouillons, setBrouillons] = useState({});
  const [envoi, setEnvoi] = useState(null);

  const charger = useCallback(async () => {
    const { data } = await supabase
      .from('reviews')
      .select('*, profiles(prenom, nom)')
      .eq('salon_id', salonId)
      .order('created_at', { ascending: false });
    setReviews(data ?? []);
  }, [salonId]);

  useFocusEffect(useCallback(() => { charger(); }, [charger]));

  const repondre = async (review) => {
    const texte = (brouillons[review.id] ?? '').trim();
    if (!texte) return;

    setEnvoi(review.id);
    const { error } = await supabase
      .from('reviews')
      .update({ reponse_pro: texte, reponse_pro_date: new Date().toISOString() })
      .eq('id', review.id);
    setEnvoi(null);

    if (error) {
      Alert.alert(t('commun.erreur'), error.message);
      return;
    }
    setBrouillons((prev) => ({ ...prev, [review.id]: '' }));
    charger();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titre}>{t('salon.avisClients')}</Text>
      <FlatList
        data={reviews}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.liste}
        ListEmptyComponent={
          <EmptyState titre={t('avis.aucun')} message={t('avis.aucunMessage')} icone="⭐" />
        }
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <View style={styles.header}>
              <Text style={styles.auteur}>{item.profiles?.prenom} {item.profiles?.nom}</Text>
              <Text style={styles.note}>{'★'.repeat(item.note)}{'☆'.repeat(5 - item.note)}</Text>
            </View>
            {item.commentaire && <Text style={styles.commentaire}>{item.commentaire}</Text>}

            {item.reponse_pro ? (
              <View style={styles.reponseBloc}>
                <Text style={styles.reponseLabel}>{t('avis.votreReponse')}</Text>
                <Text style={styles.reponseTexte}>{item.reponse_pro}</Text>
              </View>
            ) : (
              <View style={styles.repondreBloc}>
                <TextInput
                  style={styles.input}
                  placeholder={t('avis.repondrePlaceholder')}
                  placeholderTextColor={colors.textSecondary}
                  value={brouillons[item.id] ?? ''}
                  onChangeText={(v) => setBrouillons((prev) => ({ ...prev, [item.id]: v }))}
                  multiline
                />
                <Button
                  title={t('avis.publierReponse')}
                  variant="outline"
                  onPress={() => repondre(item)}
                  loading={envoi === item.id}
                />
              </View>
            )}
          </Card>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing.md },
  titre: { fontSize: typography.size.xxl, fontWeight: typography.weight.bold, color: colors.secondary, marginVertical: spacing.md },
  liste: { paddingBottom: spacing.xl },
  card: { marginBottom: spacing.md, gap: spacing.sm },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  auteur: { fontSize: typography.size.md, fontWeight: typography.weight.semibold, color: colors.textPrimary },
  note: { fontSize: typography.size.sm, color: colors.accent },
  commentaire: { fontSize: typography.size.sm, color: colors.textSecondary },
  reponseBloc: {
    paddingStart: spacing.sm,
    borderStartWidth: 2,
    borderStartColor: colors.primary,
    gap: spacing.xs,
  },
  reponseLabel: { fontSize: typography.size.xs, fontWeight: typography.weight.semibold, color: colors.primary },
  reponseTexte: { fontSize: typography.size.sm, color: colors.textSecondary },
  repondreBloc: { gap: spacing.sm },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    minHeight: 70,
    fontSize: typography.size.sm,
    color: colors.textPrimary,
    textAlignVertical: 'top',
  },
});
