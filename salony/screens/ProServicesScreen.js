import React, { useCallback, useState } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, Modal } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../supabase';
import { colors, spacing, radius, typography } from '../src/theme';
import Card from '../src/components/Card';
import Button from '../src/components/Button';
import EmptyState from '../src/components/EmptyState';
import { useT } from '../src/i18n';

export default function ProServicesScreen({ route }) {
  const t = useT();
  const { salonId } = route.params;
  const [services, setServices] = useState([]);
  const [modalOuvert, setModalOuvert] = useState(false);
  const [nom, setNom] = useState('');
  const [duree, setDuree] = useState('');
  const [prix, setPrix] = useState('');

  const charger = useCallback(async () => {
    const { data } = await supabase.from('services').select('*').eq('salon_id', salonId).order('categorie');
    setServices(data ?? []);
  }, [salonId]);

  useFocusEffect(useCallback(() => { charger(); }, [charger]));

  const ajouterService = async () => {
    if (!nom || !duree || !prix) return;
    await supabase.from('services').insert({
      salon_id: salonId,
      nom,
      duree_min: Number(duree),
      prix: Number(prix),
    });
    setNom(''); setDuree(''); setPrix('');
    setModalOuvert(false);
    charger();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.titre}>{t('prestations.titre')}</Text>
        <Button title={`+ ${t('commun.ajouter')}`} onPress={() => setModalOuvert(true)} style={styles.ajoutBtn} />
      </View>

      <FlatList
        data={services}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.liste}
        ListEmptyComponent={
          <EmptyState titre={t('prestations.aucune')} message={t('prestations.aucuneMessage')} icone="✂️" />
        }
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Text style={styles.nom}>{item.nom}</Text>
            <Text style={styles.details}>
              {t('commun.minutes', { n: item.duree_min })} · {t('commun.devise', { n: item.prix })}
            </Text>
          </Card>
        )}
      />

      <Modal visible={modalOuvert} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitre}>{t('prestations.nouvelle')}</Text>
            <TextInput style={styles.input} placeholder={t('prestations.nom')} value={nom} onChangeText={setNom} />
            <TextInput style={styles.input} placeholder={t('prestations.duree')} keyboardType="numeric" value={duree} onChangeText={setDuree} />
            <TextInput style={styles.input} placeholder={t('prestations.prix')} keyboardType="numeric" value={prix} onChangeText={setPrix} />
            <View style={styles.modalActions}>
              <Button title={t('commun.annuler')} variant="ghost" onPress={() => setModalOuvert(false)} style={{ flex: 1 }} />
              <Button title={t('commun.enregistrer')} onPress={ajouterService} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md },
  titre: { fontSize: typography.size.xxl, fontWeight: typography.weight.bold, color: colors.secondary },
  ajoutBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  liste: { paddingHorizontal: spacing.md, paddingBottom: spacing.xl },
  card: { marginBottom: spacing.sm, gap: spacing.xs },
  nom: { fontSize: typography.size.md, fontWeight: typography.weight.semibold, color: colors.textPrimary },
  details: { fontSize: typography.size.sm, color: colors.textSecondary },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.surface, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: spacing.lg, gap: spacing.md },
  modalTitre: { fontSize: typography.size.lg, fontWeight: typography.weight.bold, color: colors.textPrimary },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: typography.size.md,
    color: colors.textPrimary,
  },
  modalActions: { flexDirection: 'row', gap: spacing.sm },
});
