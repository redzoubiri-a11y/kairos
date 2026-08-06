import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Header, Body } from '../../components/Screen';
import { MCard, Divider } from '../../components/primitives';
import { useTheme } from '../../context/ThemeContext';
import { useI18n } from '../../i18n';
import { useAuth } from '../../context/AuthContext';

function Row({ icon, label, onPress }) {
  const { colors, typography, spacing } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md }}
    >
      <Ionicons name={icon} size={18} color={colors.warmGray} />
      <Text style={[typography.secondary, { color: colors.dark, flex: 1, textAlign: 'left' }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={16} color={colors.warmGray} />
    </Pressable>
  );
}

/** Regroupe les entrées de la sidebar pro qui ne tiennent pas dans la barre d'onglets (§5.1). */
export default function ProMoreScreen({ navigation }) {
  const { t } = useI18n();
  const { logout } = useAuth();

  return (
    <Screen>
      <Header title={t('nav.more')} bordered={false} />

      <Body>
        <MCard style={{ paddingVertical: 0 }}>
          <Row icon="bar-chart-outline" label={t('pro.statsTitle')} onPress={() => navigation.navigate('ProStats')} />
          <Divider />
          <Row
            icon="star-outline"
            label={t('pro.reviewsToModerate')}
            onPress={() => navigation.navigate('ProReviews')}
          />
          <Divider />
          <Row
            icon="card-outline"
            label={t('pro.subscriptionTitle')}
            onPress={() => navigation.navigate('ProSubscription')}
          />
        </MCard>

        <MCard style={{ paddingVertical: 0 }}>
          <Row
            icon="chatbubbles-outline"
            label={t('messages.title')}
            onPress={() => navigation.navigate('Conversations')}
          />
          <Divider />
          <Row
            icon="notifications-outline"
            label={t('notifications.title')}
            onPress={() => navigation.navigate('Notifications')}
          />
          <Divider />
          <Row icon="person-outline" label={t('profile.title')} onPress={() => navigation.navigate('Profil')} />
        </MCard>

        <MCard style={{ paddingVertical: 0 }}>
          <Row icon="log-out-outline" label={t('auth.logout')} onPress={logout} />
        </MCard>
      </Body>
    </Screen>
  );
}
