import React, { useCallback } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import ScreenHeader from '../components/ScreenHeader';
import EmptyState from '../components/EmptyState';
import Loader from '../components/Loader';
import ErrorBanner from '../components/ErrorBanner';
import { useNotificationStore } from '../store/notificationStore';
import { formatRelative } from '../utils/format';
import { colors, spacing, typography } from '../theme';

const ICONS = {
  MISSION_CREATED: 'add-circle-outline',
  MISSION_ACCEPTED: 'checkmark-circle-outline',
  MISSION_REJECTED: 'close-circle-outline',
  MISSION_STATUS: 'sync-outline',
  CHAT_MESSAGE: 'chatbubble-outline',
  ACCOUNT_VERIFIED: 'shield-checkmark-outline',
  ACCOUNT_REJECTED: 'shield-outline',
};

export default function NotificationsScreen({ navigation }) {
  const items = useNotificationStore((s) => s.items);
  const loading = useNotificationStore((s) => s.loading);
  const error = useNotificationStore((s) => s.error);
  const loadingMore = useNotificationStore((s) => s.loadingMore);
  const load = useNotificationStore((s) => s.load);
  const loadMore = useNotificationStore((s) => s.loadMore);
  const markAllRead = useNotificationStore((s) => s.markAllRead);
  const unreadCount = useNotificationStore((s) => s.items.filter((n) => !n.readAt).length);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const openTarget = (notification) => {
    const missionId = notification.data?.missionId;
    if (missionId) navigation.navigate('MissionDetail', { missionId });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader
        title="Notifications"
        subtitle={unreadCount ? `${unreadCount} non lue(s)` : 'Tout est lu'}
        onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined}
        right={
          unreadCount ? (
            <Pressable onPress={markAllRead} hitSlop={10}>
              <Text style={styles.markAll}>Tout lire</Text>
            </Pressable>
          ) : null
        }
      />

      {loading && items.length === 0 ? (
        <Loader />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={error ? <ErrorBanner message={error} onRetry={load} /> : null}
          renderItem={({ item }) => (
            <Pressable
              style={[styles.row, !item.readAt && styles.rowUnread]}
              onPress={() => openTarget(item)}
            >
              <View style={styles.iconBox}>
                <Ionicons
                  name={ICONS[item.type] ?? 'notifications-outline'}
                  size={19}
                  color={colors.primaryDark}
                />
              </View>
              <View style={styles.content}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.body} numberOfLines={2}>
                  {item.body}
                </Text>
                <Text style={styles.time}>{formatRelative(item.createdAt)}</Text>
              </View>
              {!item.readAt ? <View style={styles.dot} /> : null}
            </Pressable>
          )}
          ListEmptyComponent={
            <EmptyState
              icon="notifications-off-outline"
              title="Aucune notification"
              message="Vous serez prevenu des qu'une mission ou un message arrive."
            />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            loadingMore ? <ActivityIndicator style={styles.footer} color={colors.primary} /> : null
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.card },
  list: { flexGrow: 1 },
  footer: { paddingVertical: spacing.lg },
  markAll: { ...typography.small, fontWeight: '700', color: colors.primaryDark },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowUnread: { backgroundColor: colors.primarySoft },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  content: { flex: 1, marginLeft: spacing.md },
  title: { ...typography.bodyStrong, color: colors.text },
  body: { ...typography.small, color: colors.textMuted, marginTop: 2, lineHeight: 19 },
  time: { ...typography.caption, color: colors.textMuted, fontWeight: '400', marginTop: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginTop: 6 },
});
