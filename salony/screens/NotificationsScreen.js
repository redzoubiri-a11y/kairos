import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../supabase';
import { colors, spacing, radius, typography } from '../src/theme';
import EmptyState from '../src/components/EmptyState';
import { useT } from '../src/i18n';

export default function NotificationsScreen() {
  const t = useT();
  const [notifications, setNotifications] = useState([]);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const { data: { user } } = await supabase.auth.getUser();
        const { data } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        setNotifications(data ?? []);
      })();
    }, [])
  );

  const marquerLu = async (id) => {
    await supabase.from('notifications').update({ lu: true }).eq('id', id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, lu: true } : n)));
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.liste}
        ListEmptyComponent={<EmptyState titre={t('notifications.aucune')} icone="🔔" />}
        renderItem={({ item }) => (
          <Pressable onPress={() => marquerLu(item.id)} style={[styles.item, !item.lu && styles.itemNonLu]}>
            <Text style={styles.titreNotif}>{item.titre}</Text>
            <Text style={styles.message}>{item.message}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  liste: { padding: spacing.md },
  item: {
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  itemNonLu: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  titreNotif: { fontSize: typography.size.md, fontWeight: typography.weight.semibold, color: colors.textPrimary },
  message: { fontSize: typography.size.sm, color: colors.textSecondary, marginTop: spacing.xs },
});
