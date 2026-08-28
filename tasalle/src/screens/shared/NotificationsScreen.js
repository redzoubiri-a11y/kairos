import { useCallback, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Screen, Header, Body } from '../../components/Screen';
import { MChip, Loader, EmptyState, MCard } from '../../components/primitives';
import { useTheme } from '../../context/ThemeContext';
import { useI18n } from '../../i18n';
import { timeAgo } from '../../lib/format';
import * as api from '../../data';

const TYPE_ICON = {
  reservation_new: 'mail-unread-outline',
  reservation_sent: 'paper-plane-outline',
  reservation_confirmed: 'checkmark-circle-outline',
  reservation_cancelled: 'close-circle-outline',
  deposit_requested: 'cash-outline',
  deposit_declared: 'cash-outline',
  deposit_verified: 'checkmark-done-outline',
  review_pending: 'star-outline',
  review_request: 'star-outline',
  review_approved: 'star',
  message_new: 'chatbubble-ellipses-outline',
  subscription_reminder: 'card-outline',
};

const RESERVATION_TYPES = [
  'reservation_new',
  'reservation_sent',
  'reservation_confirmed',
  'reservation_cancelled',
  'deposit_requested',
  'deposit_declared',
  'deposit_verified',
];

export default function NotificationsScreen({ navigation }) {
  const { colors, typography, spacing, radii } = useTheme();
  const { t, list } = useI18n();

  const [rows, setRows] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setRows(await api.listNotifications());
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const markAll = async () => {
    await api.markAllNotificationsRead();
    load();
  };

  const open = async (notif) => {
    await api.markNotificationRead(notif.id);
    const resaId = notif.data?.reservation_id;
    if (resaId) navigation.navigate('ReservationDetail', { id: resaId });
    else load();
  };

  const filtered = rows.filter((n) => {
    if (filter === 'reservations') return RESERVATION_TYPES.includes(n.type);
    if (filter === 'promos') return !RESERVATION_TYPES.includes(n.type);
    return true;
  });

  const unread = rows.filter((n) => !n.is_read).length;

  return (
    <Screen>
      <Header
        title={t('notifications.title')}
        subtitle={unread ? `${unread} non lue${unread > 1 ? 's' : ''}` : undefined}
        onBack={navigation.canGoBack() ? navigation.goBack : undefined}
        right={
          unread > 0 ? (
            <Pressable onPress={markAll} hitSlop={8} accessibilityRole="button">
              <Text style={[typography.caption, { color: colors.primaryInk }]}>{t('notifications.markAllRead')}</Text>
            </Pressable>
          ) : null
        }
      />

      <View style={{ flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingTop: spacing.md }}>
        <MChip label={t('notifications.filterAll')} active={filter === 'all'} onPress={() => setFilter('all')} />
        <MChip
          label={t('notifications.filterReservations')}
          active={filter === 'reservations'}
          onPress={() => setFilter('reservations')}
        />
        <MChip label={t('notifications.filterPromos')} active={filter === 'promos'} onPress={() => setFilter('promos')} />
      </View>

      <Body>
        {loading ? (
          <Loader />
        ) : filtered.length === 0 ? (
          <EmptyState icon="notifications-outline" title={t('notifications.empty')} />
        ) : (
          filtered.map((n) => (
            <MCard key={n.id} onPress={() => open(n)}>
              <View style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' }}>
                <View
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: radii.lg,
                    backgroundColor: n.is_read ? colors.surfaceElevated : colors.primaryLight,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons
                    name={TYPE_ICON[n.type] || 'notifications-outline'}
                    size={16}
                    color={n.is_read ? colors.warmGray : colors.primaryInk}
                  />
                </View>

                <View style={{ flex: 1, gap: 3 }}>
                  <Text
                    style={[
                      typography.secondary,
                      { color: colors.dark, fontWeight: n.is_read ? '400' : '500', textAlign: 'left' },
                    ]}
                  >
                    {n.title}
                  </Text>
                  <Text style={[typography.caption, { color: colors.warmGray, textAlign: 'left' }]}>{n.body}</Text>
                  <Text style={[typography.caption, { color: colors.warmGray, opacity: 0.7, textAlign: 'left' }]}>
                    {timeAgo(n.created_at, t, list('monthsShort'))}
                  </Text>
                </View>

                {!n.is_read ? (
                  <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: colors.accentInk, marginTop: 5 }} />
                ) : null}
              </View>
            </MCard>
          ))
        )}
      </Body>
    </Screen>
  );
}
