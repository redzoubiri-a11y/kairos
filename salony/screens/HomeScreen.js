import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../supabase';
import { colors, spacing, typography } from '../src/theme';
import SalonCard from '../src/components/SalonCard';
import EmptyState from '../src/components/EmptyState';
import { useT } from '../src/i18n';

export default function HomeScreen({ navigation }) {
  const t = useT();
  const [salons, setSalons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [nbNonLues, setNbNonLues] = useState(0);

  const chargerSalons = useCallback(async () => {
    const { data, error } = await supabase
      .from('salons')
      .select('*')
      .eq('statut', 'valide')
      .order('note_moyenne', { ascending: false })
      .limit(20);

    if (!error) setSalons(data ?? []);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { chargerSalons(); }, [chargerSalons]);

  // compteur de notifications non lues, rafraîchi à chaque retour sur l'écran
  useFocusEffect(
    useCallback(() => {
      (async () => {
        const { data: { user } } = await supabase.auth.getUser();
        const { count } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('lu', false);
        setNbNonLues(count ?? 0);
      })();
    }, [])
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTexte}>
          <Text style={styles.titre}>{t('accueil.bonjour')}</Text>
          <Text style={styles.sousTitre}>{t('accueil.sousTitre')}</Text>
        </View>
        <Pressable onPress={() => navigation.navigate('Notifications')} hitSlop={8}>
          <Text style={styles.cloche}>🔔</Text>
          {nbNonLues > 0 && (
            <View style={styles.pastille}>
              <Text style={styles.pastilleTexte}>{nbNonLues > 9 ? '9+' : nbNonLues}</Text>
            </View>
          )}
        </Pressable>
      </View>

      <FlatList
        data={salons}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.liste}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); chargerSalons(); }} />
        }
        renderItem={({ item }) => (
          <SalonCard salon={item} onPress={() => navigation.navigate('Salon', { salonId: item.id })} />
        )}
        ListEmptyComponent={
          !loading && <EmptyState titre={t('accueil.aucunSalon')} message={t('accueil.aucunSalonMessage')} />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerTexte: { flex: 1 },
  cloche: { fontSize: 24 },
  pastille: {
    position: 'absolute',
    top: -4,
    end: -6,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pastilleTexte: { color: colors.textInverse, fontSize: 10, fontWeight: typography.weight.bold },
  titre: { fontSize: typography.size.xxl, fontWeight: typography.weight.bold, color: colors.secondary },
  sousTitre: { fontSize: typography.size.md, color: colors.textSecondary, marginTop: spacing.xs },
  liste: { paddingHorizontal: spacing.md, paddingBottom: spacing.xl },
});
