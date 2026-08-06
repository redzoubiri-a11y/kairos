import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, Image, ScrollView, Pressable, StyleSheet, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../supabase';
import { colors, spacing, radius, typography } from '../src/theme';
import Card from '../src/components/Card';
import Button from '../src/components/Button';
import EmptyState from '../src/components/EmptyState';
import { useT } from '../src/i18n';

const ONGLETS = [
  { statut: 'en_attente', cle: 'aValider' },
  { statut: 'valide', cle: 'actifs' },
  { statut: 'suspendu', cle: 'suspendus' },
  { statut: 'rejete', cle: 'refuses' },
];

export default function AdminScreen() {
  const t = useT();
  const [statut, setStatut] = useState('en_attente');
  const [salons, setSalons] = useState([]);
  const [traitement, setTraitement] = useState(null);

  const charger = useCallback(async () => {
    const { data } = await supabase.rpc('salons_a_moderer', { p_statut: statut });
    setSalons(data ?? []);
  }, [statut]);

  useFocusEffect(useCallback(() => { charger(); }, [charger]));

  const moderer = async (salon, nouveauStatut) => {
    setTraitement(salon.id);
    const { data, error } = await supabase.rpc('moderer_salon', {
      p_salon_id: salon.id,
      p_statut: nouveauStatut,
    });
    setTraitement(null);

    if (error) {
      Alert.alert(t('commun.erreur'), error.message);
      return;
    }
    const resultat = Array.isArray(data) ? data[0] : data;
    if (!resultat?.ok) {
      Alert.alert(t('moderation.actionRefusee'), resultat?.message ?? '');
      return;
    }
    charger();
  };

  const confirmerRejet = (salon) => {
    Alert.alert(
      t('moderation.refuserTitre'),
      t('moderation.refuserMessage', { nom: salon.nom }),
      [
        { text: t('commun.retour'), style: 'cancel' },
        { text: t('commun.refuser'), style: 'destructive', onPress: () => moderer(salon, 'rejete') },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titre}>{t('moderation.titre')}</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.onglets}
        contentContainerStyle={{ gap: spacing.sm }}
      >
        {ONGLETS.map((o) => (
          <Pressable
            key={o.statut}
            onPress={() => setStatut(o.statut)}
            style={[styles.chip, statut === o.statut && styles.chipActif]}
          >
            <Text style={[styles.chipTexte, statut === o.statut && styles.chipTexteActif]}>
              {t(`moderation.${o.cle}`)}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <FlatList
        data={salons}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.liste}
        ListEmptyComponent={<EmptyState titre={t('moderation.rienATraiter')} icone="✅" />}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            {item.photos?.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
                {item.photos.map((url) => (
                  <Image key={url} source={{ uri: url }} style={styles.photo} />
                ))}
              </ScrollView>
            )}

            <Text style={styles.nom}>{item.nom}</Text>
            <Text style={styles.ligne}>
              {t(`types.${item.type}`)} · {item.quartier ? `${item.quartier}, ` : ''}{item.ville}
            </Text>
            <Text style={styles.ligne}>{item.adresse}</Text>
            <Text style={styles.ligne}>{t('moderation.tel', { numero: item.telephone })}</Text>
            <Text style={styles.ligne}>
              {item.registre_commerce
                ? t('moderation.registre', { valeur: item.registre_commerce })
                : <Text style={styles.manquant}>{t('moderation.registre', { valeur: t('moderation.nonFourni') })}</Text>}
            </Text>
            <Text style={styles.proprietaire}>{t('moderation.demandeDe', { nom: item.proprietaire })}</Text>

            <View style={styles.actions}>
              {item.statut !== 'valide' && (
                <Button
                  title={t('commun.valider')}
                  onPress={() => moderer(item, 'valide')}
                  loading={traitement === item.id}
                  style={styles.actionBtn}
                />
              )}
              {item.statut === 'valide' && (
                <Button
                  title={t('moderation.suspendre')}
                  variant="outline"
                  onPress={() => moderer(item, 'suspendu')}
                  style={styles.actionBtn}
                />
              )}
              {item.statut === 'en_attente' && (
                <Button title={t('commun.refuser')} variant="ghost" onPress={() => confirmerRejet(item)} style={styles.actionBtn} />
              )}
            </View>
          </Card>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing.md },
  titre: { fontSize: typography.size.xxl, fontWeight: typography.weight.bold, color: colors.secondary, marginTop: spacing.md },
  onglets: { marginVertical: spacing.md, flexGrow: 0 },
  chip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActif: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipTexte: { color: colors.textPrimary, fontSize: typography.size.sm, fontWeight: typography.weight.medium },
  chipTexteActif: { color: colors.textInverse },
  liste: { paddingBottom: spacing.xl },
  card: { marginBottom: spacing.md, gap: spacing.xs },
  photo: { width: 100, height: 70, borderRadius: radius.sm, backgroundColor: colors.surfaceAlt },
  nom: { fontSize: typography.size.lg, fontWeight: typography.weight.bold, color: colors.textPrimary, marginTop: spacing.xs },
  ligne: { fontSize: typography.size.sm, color: colors.textSecondary },
  manquant: { color: colors.warning },
  proprietaire: { fontSize: typography.size.xs, color: colors.textSecondary, marginTop: spacing.xs },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  actionBtn: { flex: 1 },
});
