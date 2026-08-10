import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ScreenHeader from '../components/ScreenHeader';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import ErrorBanner from '../components/ErrorBanner';
import { API_URL } from '../api/endpoints';
import { useAuthStore } from '../store/authStore';
import { colors, spacing, typography } from '../theme';

export default function SettingsScreen({ navigation }) {
  const user = useAuthStore((s) => s.user);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const signOut = useAuthStore((s) => s.signOut);
  const changePassword = useAuthStore((s) => s.changePassword);

  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState(null);
  const [profileError, setProfileError] = useState(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState(null);
  const [passwordError, setPasswordError] = useState(null);

  const onSaveProfile = async () => {
    setSavingProfile(true);
    setProfileError(null);
    setProfileMessage(null);
    try {
      await updateProfile({
        ...(fullName.trim() ? { fullName: fullName.trim() } : {}),
        ...(phone.trim() ? { phone: phone.trim() } : {}),
      });
      setProfileMessage('Profil mis a jour.');
    } catch (err) {
      setProfileError(err.message);
    } finally {
      setSavingProfile(false);
    }
  };

  const onChangePassword = async () => {
    setSavingPassword(true);
    setPasswordError(null);
    setPasswordMessage(null);
    try {
      await changePassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setPasswordMessage('Mot de passe modifie.');
    } catch (err) {
      setPasswordError(err.message);
    } finally {
      setSavingPassword(false);
    }
  };

  const confirmSignOut = () => {
    Alert.alert('Deconnexion', 'Voulez-vous vraiment vous deconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Se deconnecter', style: 'destructive', onPress: signOut },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader
        title="Parametres"
        onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined}
      />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Card>
          <Text style={styles.cardTitle}>Informations personnelles</Text>
          <ErrorBanner message={profileError} />
          {profileMessage ? <Text style={styles.success}>{profileMessage}</Text> : null}
          <Input label="Nom complet" value={fullName} onChangeText={setFullName} icon="person-outline" />
          <Input
            label="Telephone"
            value={phone}
            onChangeText={setPhone}
            icon="call-outline"
            keyboardType="phone-pad"
          />
          <Button title="Enregistrer" onPress={onSaveProfile} loading={savingProfile} />
        </Card>

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Mot de passe</Text>
          <ErrorBanner message={passwordError} />
          {passwordMessage ? <Text style={styles.success}>{passwordMessage}</Text> : null}
          <Input
            label="Mot de passe actuel"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            icon="lock-closed-outline"
            secureTextEntry
          />
          <Input
            label="Nouveau mot de passe"
            value={newPassword}
            onChangeText={setNewPassword}
            icon="key-outline"
            secureTextEntry
          />
          <Button
            title="Changer le mot de passe"
            variant="secondary"
            onPress={onChangePassword}
            loading={savingPassword}
            disabled={!currentPassword || newPassword.length < 8}
          />
        </Card>

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>A propos</Text>
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>Version</Text>
            <Text style={styles.aboutValue}>1.0.0</Text>
          </View>
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>Serveur</Text>
            <Text style={styles.aboutValue} numberOfLines={1}>
              {API_URL}
            </Text>
          </View>
        </Card>

        <Button title="Se deconnecter" variant="danger" onPress={confirmSignOut} style={styles.signOut} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cardMuted },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  card: { marginTop: spacing.md },
  cardTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.lg },
  success: { ...typography.small, color: colors.success, marginBottom: spacing.md },
  aboutRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  aboutLabel: { ...typography.small, color: colors.textMuted },
  aboutValue: { ...typography.small, fontWeight: '600', color: colors.text, flex: 1, textAlign: 'right' },
  signOut: { marginTop: spacing.lg },
});
