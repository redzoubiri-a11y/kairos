import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../supabase';
import { colors, spacing, typography } from '../src/theme';
import Avatar from '../src/components/Avatar';
import Card from '../src/components/Card';
import Button from '../src/components/Button';
import EmptyState from '../src/components/EmptyState';
import { useT } from '../src/i18n';

export default function ProStaffScreen({ route, navigation }) {
  const t = useT();
  const { salonId } = route.params;
  const [staffList, setStaffList] = useState([]);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const { data } = await supabase
          .from('staff')
          .select('*')
          .eq('salon_id', salonId)
          .eq('actif', true);
        setStaffList(data ?? []);
      })();
    }, [salonId])
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.titre}>{t('equipe.titre')}</Text>
        <Button
          title={`+ ${t('commun.ajouter')}`}
          onPress={() => navigation.navigate('ProStaffForm', { salonId })}
          style={styles.ajoutBtn}
        />
      </View>

      <FlatList
        data={staffList}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.liste}
        ListEmptyComponent={
          <EmptyState titre={t('equipe.aucun')} message={t('equipe.aucunMessage')} icone="👥" />
        }
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Pressable
              style={styles.identite}
              onPress={() => navigation.navigate('ProStaffForm', { salonId, staff: item })}
            >
              <Avatar uri={item.photo_url} nom={item.nom} />
              <View style={{ flex: 1 }}>
                <Text style={styles.nom}>{item.nom}</Text>
                <Text style={styles.specialites}>
                  {(item.specialites ?? []).join(', ') || t('equipe.aucuneSpecialite')}
                </Text>
                {item.profile_id && <Text style={styles.compteLie}>{t('equipe.compteRattache')}</Text>}
              </View>
            </Pressable>
            <Pressable onPress={() => navigation.navigate('ProAvailability', { staffId: item.id, staffNom: item.nom })}>
              <Text style={styles.gererLien}>{t('equipe.horaires')}</Text>
            </Pressable>
          </Card>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md },
  titre: { fontSize: typography.size.xxl, fontWeight: typography.weight.bold, color: colors.secondary },
  ajoutBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  liste: { paddingHorizontal: spacing.md, paddingBottom: spacing.xl },
  card: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm },
  identite: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  nom: { fontSize: typography.size.md, fontWeight: typography.weight.semibold, color: colors.textPrimary },
  specialites: { fontSize: typography.size.sm, color: colors.textSecondary },
  compteLie: { fontSize: typography.size.xs, color: colors.success, marginTop: 2 },
  gererLien: { fontSize: typography.size.sm, color: colors.primary, fontWeight: typography.weight.semibold },
});
