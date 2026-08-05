import { useCallback, useState } from 'react';
import { View, Text } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Screen, Header, Body } from '../../components/Screen';
import { Loader, EmptyState, MCard, MBadge } from '../../components/primitives';
import { useTheme } from '../../context/ThemeContext';
import { useI18n } from '../../i18n';
import { timeAgo } from '../../lib/format';
import * as api from '../../data';

export default function ConversationsScreen({ navigation }) {
  const { colors, typography, spacing, radii } = useTheme();
  const { t, list, dir, align } = useI18n();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setRows(await api.listConversations());
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <Screen>
      <Header title={t('messages.title')} onBack={navigation.canGoBack() ? navigation.goBack : undefined} />

      <Body>
        {loading ? (
          <Loader />
        ) : rows.length === 0 ? (
          <EmptyState icon="chatbubbles-outline" title={t('messages.empty')} />
        ) : (
          rows.map((c) => (
            <MCard
              key={c.reservation_id}
              onPress={() => navigation.navigate('Chat', { reservationId: c.reservation_id, title: c.title })}
            >
              <View style={{ flexDirection: dir, gap: spacing.md, alignItems: 'center' }}>
                <View
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: radii.pill,
                    backgroundColor: colors.primaryLight,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ color: colors.primaryInk, fontWeight: '500' }}>
                    {(c.title || '?').charAt(0).toUpperCase()}
                  </Text>
                </View>

                <View style={{ flex: 1, gap: 2 }}>
                  <Text
                    style={[typography.secondary, { color: colors.dark, fontWeight: '500', textAlign: align }]}
                    numberOfLines={1}
                  >
                    {c.title}
                  </Text>
                  <Text style={[typography.caption, { color: colors.warmGray, textAlign: align }]} numberOfLines={1}>
                    {c.last_message || c.subtitle}
                  </Text>
                </View>

                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <Text style={[typography.caption, { color: colors.warmGray, opacity: 0.7 }]}>
                    {timeAgo(c.last_at, t, list('monthsShort'))}
                  </Text>
                  {c.unread > 0 ? <MBadge label={String(c.unread)} tone="danger" size="sm" /> : null}
                </View>
              </View>
            </MCard>
          ))
        )}
      </Body>
    </Screen>
  );
}
