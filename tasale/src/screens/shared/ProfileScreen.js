import { useState } from 'react';
import { View, Text, Pressable, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { Screen, Header, Body } from '../../components/Screen';
import MButton from '../../components/MButton';
import { MCard, MChip, Divider, MBadge } from '../../components/primitives';
import { useTheme } from '../../context/ThemeContext';
import { useI18n } from '../../i18n';
import { useAuth } from '../../context/AuthContext';
import { displayPhone } from '../../lib/format';
import { ROLES } from '../../lib/constants';
import * as api from '../../data';

function Row({ icon, label, value, onPress, danger }) {
  const { colors, typography, spacing } = useTheme();
  const { dir, align } = useI18n();

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      style={{ flexDirection: dir, alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md }}
    >
      <Ionicons name={icon} size={18} color={danger ? colors.accent : colors.warmGray} />
      <Text style={[typography.secondary, { color: danger ? colors.accent : colors.dark, flex: 1, textAlign: align }]}>
        {label}
      </Text>
      {value ? <Text style={[typography.caption, { color: colors.warmGray }]}>{value}</Text> : null}
      {onPress && !danger ? <Ionicons name="chevron-forward" size={16} color={colors.warmGray} /> : null}
    </Pressable>
  );
}

export default function ProfileScreen({ navigation }) {
  const { colors, typography, spacing, radii, mode, setThemeMode } = useTheme();
  const { t, lang, setLang, dir } = useI18n();
  const { user, logout, isPro } = useAuth();
  const [resetting, setResetting] = useState(false);

  const version = Constants.expoConfig?.version || '1.0.0';

  const resetDemo = async () => {
    setResetting(true);
    try {
      await api.resetDemoData();
      await logout();
    } finally {
      setResetting(false);
    }
  };

  return (
    <Screen>
      <Header
        title={t('profile.title')}
        bordered={false}
        onBack={navigation.canGoBack() ? navigation.goBack : undefined}
      />

      <Body>
        {/* Identité */}
        <MCard>
          <View style={{ flexDirection: dir, alignItems: 'center', gap: spacing.lg }}>
            <View
              style={{
                width: 54,
                height: 54,
                borderRadius: radii.pill,
                backgroundColor: colors.primaryLight,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={[typography.h3, { color: colors.primaryInk }]}>
                {(user?.full_name || '?').charAt(0).toUpperCase()}
              </Text>
            </View>

            <View style={{ flex: 1, gap: 3 }}>
              <Text style={[typography.title, { color: colors.dark }]}>{user?.full_name || '—'}</Text>
              <Text style={[typography.caption, { color: colors.warmGray }]}>{displayPhone(user?.phone)}</Text>
            </View>

            {isPro ? <MBadge label={`⭐ ${t('pro.proBadge')}`} tone="gold" /> : null}
          </View>
        </MCard>

        {/* Préférences */}
        <MCard style={{ gap: spacing.md }}>
          <Text style={[typography.caption, { color: colors.warmGray }]}>{t('profile.language')}</Text>
          <View style={{ flexDirection: dir, gap: spacing.sm }}>
            <MChip label="Français" active={lang === 'fr'} onPress={() => setLang('fr')} />
            <MChip label="العربية" active={lang === 'ar'} onPress={() => setLang('ar')} />
          </View>

          <Divider />

          <Text style={[typography.caption, { color: colors.warmGray }]}>{t('profile.theme')}</Text>
          <View style={{ flexDirection: dir, gap: spacing.sm }}>
            <MChip label={t('profile.themeSystem')} active={mode === 'system'} onPress={() => setThemeMode('system')} />
            <MChip label={t('profile.themeLight')} active={mode === 'light'} onPress={() => setThemeMode('light')} />
            <MChip label={t('profile.themeDark')} active={mode === 'dark'} onPress={() => setThemeMode('dark')} />
          </View>
        </MCard>

        {/* Accès rapides */}
        <MCard style={{ paddingVertical: 0 }}>
          <Row
            icon="notifications-outline"
            label={t('notifications.title')}
            onPress={() => navigation.navigate('Notifications')}
          />
          <Divider />
          <Row
            icon="chatbubbles-outline"
            label={t('messages.title')}
            onPress={() => navigation.navigate('Conversations')}
          />
          <Divider />
          <Row icon="moon-outline" label={t('notifications.quietHours')} />
        </MCard>

        {/* Devenir pro */}
        {user?.role === ROLES.CLIENT ? (
          <MCard style={{ gap: spacing.md }}>
            <View style={{ flexDirection: dir, alignItems: 'center', gap: spacing.md }}>
              <Ionicons name="business-outline" size={20} color={colors.gold} />
              <Text style={[typography.title, { fontSize: 15, color: colors.dark, flex: 1 }]}>
                {t('profile.becomePro')}
              </Text>
            </View>
            <MButton
              label={t('profile.becomeProCta')}
              variant="gold"
              onPress={() => navigation.navigate('ProOnboarding')}
              full
            />
          </MCard>
        ) : null}

        {/* Support & légal */}
        <MCard style={{ paddingVertical: 0 }}>
          <Row
            icon="help-circle-outline"
            label={t('profile.support')}
            value={t('profile.supportHours')}
            onPress={() => Linking.openURL('https://wa.me/213555000000').catch(() => {})}
          />
          <Divider />
          <Row icon="document-text-outline" label={t('profile.cgu')} onPress={() => {}} />
          <Divider />
          <Row icon="lock-closed-outline" label={t('profile.privacy')} onPress={() => {}} />
          <Divider />
          <Row icon="information-circle-outline" label={t('profile.version')} value={version} />
        </MCard>

        {api.isDemoMode ? (
          <MButton
            label="Réinitialiser les données de démo"
            variant="ghost"
            onPress={resetDemo}
            loading={resetting}
            full
          />
        ) : null}

        <MButton label={t('auth.logout')} variant="ghost" icon="log-out-outline" onPress={logout} full />
      </Body>
    </Screen>
  );
}
