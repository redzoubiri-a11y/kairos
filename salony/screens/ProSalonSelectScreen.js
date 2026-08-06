import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../supabase';
import { colors, spacing, radius, typography } from '../src/theme';
import Card from '../src/components/Card';
import Button from '../src/components/Button';
import { Badge } from '../src/components/Badge';
import { useSalon } from '../src/SalonContext';
import { useT } from '../src/i18n';

const STATUT_META = {
  en_attente: { color: colors.warning, bg: colors.warningLight },
  valide: { color: colors.success, bg: colors.successLight },
  suspendu: { color: colors.error, bg: colors.errorLight },
  rejete: { color: colors.error, bg: colors.errorLight },
};

export default function ProSalonSelectScreen({ navigation }) {
  const t = useT();
  const { choisirSalon, rechargerSalons } = useSalon();
  const [salons, setSalons] = useState([]);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const { data: { user } } = await supabase.auth.getUser();
        const { data } = await supabase
          .from('salons')
          .select('id, nom, ville, quartier, statut')
          .eq('owner_id', user.id)
          .order('created_at');
        setSalons(data ?? []);
        rechargerSalons?.();
      })();
    }, [rechargerSalons])
  );

  const selectionner = (id) => {
    choisirSalon(id);
    if (navigation.canGoBack()) navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titre}>{t('inscription.vosSalons')}</Text>
      <FlatList
        data={salons}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.liste}
        renderItem={({ item }) => {
          const cleStatut = STATUT_META[item.statut] ? item.statut : 'en_attente';
          const meta = STATUT_META[cleStatut];
          const actif = item.statut === 'valide';
          return (
            <Pressable onPress={() => actif && selectionner(item.id)} disabled={!actif}>
              <Card style={[styles.card, !actif && styles.cardInactive]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.nom}>{item.nom}</Text>
                  <Text style={styles.lieu}>
                    {item.quartier ? `${item.quartier}, ` : ''}{item.ville}
                  </Text>
                </View>
                <Badge label={t(`statutsSalon.${cleStatut}`)} color={meta.color} backgroundColor={meta.bg} />
              </Card>
            </Pressable>
          );
        }}
      />
      <Button
        title={t('inscription.autreSalon')}
        variant="outline"
        onPress={() => navigation.navigate('ProInscription')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.md },
  titre: { fontSize: typography.size.xxl, fontWeight: typography.weight.bold, color: colors.secondary, marginBottom: spacing.md },
  liste: { paddingBottom: spacing.md },
  card: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm },
  cardInactive: { opacity: 0.6 },
  nom: { fontSize: typography.size.md, fontWeight: typography.weight.semibold, color: colors.textPrimary },
  lieu: { fontSize: typography.size.sm, color: colors.textSecondary },
});
