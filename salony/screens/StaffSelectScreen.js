import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { supabase } from '../supabase';
import { colors, spacing, radius, typography } from '../src/theme';
import Avatar from '../src/components/Avatar';
import Button from '../src/components/Button';
import { useT } from '../src/i18n';

export default function StaffSelectScreen({ route, navigation }) {
  const t = useT();
  const { salonId, services } = route.params;
  const [staffList, setStaffList] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('staff')
        .select('*')
        .eq('salon_id', salonId)
        .eq('actif', true);
      setStaffList([{ id: null, nom: t('praticien.sansPreference') }, ...(data ?? [])]);
    })();
  }, [salonId, t]);

  return (
    <View style={styles.container}>
      <Text style={styles.titre}>{t('praticien.titre')}</Text>
      <FlatList
        data={staffList}
        keyExtractor={(item) => item.id ?? 'sans-preference'}
        contentContainerStyle={{ paddingBottom: spacing.xl }}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => setSelectedStaff(item)}
            style={[styles.row, selectedStaff?.id === item.id && styles.rowSelected]}
          >
            <Avatar uri={item.photo_url} nom={item.nom} />
            <Text style={styles.nom}>{item.nom}</Text>
          </Pressable>
        )}
      />
      <Button
        title={t('commun.continuer')}
        disabled={!selectedStaff}
        onPress={() => navigation.navigate('BookingForm', { salonId, services, staff: selectedStaff })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.md },
  titre: { fontSize: typography.size.xl, fontWeight: typography.weight.bold, color: colors.secondary, marginBottom: spacing.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  rowSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  nom: { fontSize: typography.size.md, fontWeight: typography.weight.medium, color: colors.textPrimary },
});
