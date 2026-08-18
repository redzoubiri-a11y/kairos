import { useState } from 'react';
import { View, Text, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Header, Body } from '../../components/Screen';
import MInput from '../../components/MInput';
import MButton from '../../components/MButton';
import { MBadge } from '../../components/primitives';
import { useTheme } from '../../context/ThemeContext';
import { useI18n } from '../../i18n';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../lib/constants';

function RoleOption({ icon, title, body, badge, selected, onPress }) {
  const { colors, typography, spacing, radii } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      style={{
        flexDirection: 'row',
        gap: spacing.md,
        alignItems: 'flex-start',
        backgroundColor: selected ? colors.primaryLight : colors.surface,
        borderWidth: 1,
        borderColor: selected ? colors.primaryInk : colors.border,
        borderRadius: radii.xl,
        padding: spacing.lg,
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: radii.lg,
          backgroundColor: selected ? colors.surface : colors.primaryLight,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={icon} size={20} color={colors.primaryInk} />
      </View>

      <View style={{ flex: 1, gap: 3 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' }}>
          <Text style={[typography.title, { fontSize: 15, color: colors.dark }]}>{title}</Text>
          {badge ? <MBadge label={badge} tone="gold" size="sm" /> : null}
        </View>
        <Text style={[typography.caption, { color: colors.warmGray, textAlign: 'left' }]}>{body}</Text>
      </View>

      <Ionicons
        name={selected ? 'radio-button-on' : 'radio-button-off'}
        size={19}
        color={selected ? colors.primaryInk : colors.border}
      />
    </Pressable>
  );
}

export default function RoleScreen({ navigation }) {
  const { colors, typography, spacing } = useTheme();
  const { t } = useI18n();
  const { user, updateProfile } = useAuth();

  // §13 — 'salle' | 'traiteur' | 'halouadji' partagent le même geste (le
  // rôle DB reste 'client' tant que la fiche n'est pas créée), seul l'écran
  // d'inscription qui suit diffère.
  const [role, setRole] = useState(user?.role === ROLES.PRO ? 'salle' : ROLES.CLIENT);
  const [name, setName] = useState(user?.full_name || '');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (name.trim().length < 3) {
      setError(t('booking.errorName'));
      return;
    }
    setLoading(true);
    try {
      if (role === ROLES.CLIENT) {
        await updateProfile({ full_name: name.trim(), role: ROLES.CLIENT });
      } else {
        // Le rôle pro n'est attribué qu'une fois la fiche enregistrée.
        await updateProfile({ full_name: name.trim() });
        if (role === 'salle') navigation.navigate('ProOnboarding');
        else navigation.navigate('PartnerOnboarding', { type: role });
      }
    } catch (e) {
      setError(e.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <Header title={t('auth.roleTitle')} bordered={false} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <Body>
          <MInput
            label={t('auth.fullName')}
            value={name}
            onChangeText={(v) => {
              setName(v);
              if (error) setError(null);
            }}
            placeholder={t('auth.nameTitle')}
            icon="person-outline"
            autoCapitalize="words"
            error={error}
          />

          <View style={{ gap: spacing.md }}>
            <Text style={[typography.caption, { color: colors.warmGray }]}>{t('auth.roleTitle')}</Text>

            <RoleOption
              icon="home-outline"
              title={t('auth.roleClient')}
              body={t('auth.roleClientDesc')}
              selected={role === ROLES.CLIENT}
              onPress={() => setRole(ROLES.CLIENT)}
            />
            <RoleOption
              icon="business-outline"
              title={t('auth.rolePro')}
              body={t('auth.roleProDesc')}
              badge="90 j"
              selected={role === 'salle'}
              onPress={() => setRole('salle')}
            />
            <RoleOption
              icon="restaurant-outline"
              title={t('auth.roleTraiteur')}
              body={t('auth.roleTraiteurDesc')}
              badge="90 j"
              selected={role === 'traiteur'}
              onPress={() => setRole('traiteur')}
            />
            <RoleOption
              icon="gift-outline"
              title={t('auth.roleHalouadji')}
              body={t('auth.roleHalouadjiDesc')}
              badge="90 j"
              selected={role === 'halouadji'}
              onPress={() => setRole('halouadji')}
            />
          </View>

          <MButton label={t('common.next')} onPress={submit} loading={loading} size="lg" full />
        </Body>
      </KeyboardAvoidingView>
    </Screen>
  );
}
