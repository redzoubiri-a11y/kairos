import React, { useCallback, useState } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../supabase';
import { colors, spacing } from '../src/theme';
import SalonCard from '../src/components/SalonCard';
import EmptyState from '../src/components/EmptyState';
import { useT } from '../src/i18n';

export default function FavorisScreen({ navigation }) {
  const t = useT();
  const [favoris, setFavoris] = useState([]);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const { data: { user } } = await supabase.auth.getUser();
        const { data } = await supabase
          .from('favoris')
          .select('salons(*)')
          .eq('client_id', user.id);
        setFavoris((data ?? []).map((f) => f.salons));
      })();
    }, [])
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={favoris}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.liste}
        renderItem={({ item }) => (
          <SalonCard salon={item} onPress={() => navigation.navigate('Salon', { salonId: item.id })} />
        )}
        ListEmptyComponent={
          <EmptyState titre={t('favoris.aucun')} message={t('favoris.aucunMessage')} icone="♥" />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  liste: { padding: spacing.md },
});
