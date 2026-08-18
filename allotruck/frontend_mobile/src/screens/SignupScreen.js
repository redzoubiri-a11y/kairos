import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Button from '../components/Button';
import Input from '../components/Input';
import ErrorBanner from '../components/ErrorBanner';
import ScreenHeader from '../components/ScreenHeader';
import OptionPicker from '../components/OptionPicker';
import { useAuthStore } from '../store/authStore';
import { ALGERIAN_CITIES } from '../utils/constants';
import { colors, radii, spacing, typography } from '../theme';

const CITY_OPTIONS = ALGERIAN_CITIES.map((c) => ({ value: c.name, label: c.name }));

export default function SignupScreen({ navigation }) {
  const signup = useAuthStore((s) => s.signup);
  const [role, setRole] = useState('CLIENT');
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    companyName: '',
    city: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  const validate = () => {
    const errors = {};
    if (form.fullName.trim().length < 2) errors.fullName = 'Nom complet requis';
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) errors.email = 'Email invalide';
    if (form.password.length < 8) errors.password = 'Au moins 8 caracteres';
    if (form.phone && !/^[0-9+\s-]{8,20}$/.test(form.phone.trim())) errors.phone = 'Numero invalide';
    if (role === 'TRANSPORTER') {
      if (form.companyName.trim().length < 2) errors.companyName = "Nom de l'entreprise requis";
      if (!form.city) errors.city = 'Ville requise';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const onSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    setError(null);
    try {
      await signup({
        email: form.email.trim(),
        password: form.password,
        fullName: form.fullName.trim(),
        ...(form.phone.trim() ? { phone: form.phone.trim() } : {}),
        role,
        ...(role === 'TRANSPORTER'
          ? { company: { companyName: form.companyName.trim(), city: form.city } }
          : {}),
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScreenHeader title="Creer un compte" onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.sectionLabel}>Je suis</Text>
          <View style={styles.roles}>
            <RoleOption
              icon="cube-outline"
              title="Client"
              description="J'ai de la marchandise a transporter"
              selected={role === 'CLIENT'}
              onPress={() => setRole('CLIENT')}
            />
            <RoleOption
              icon="bus-outline"
              title="Transporteur"
              description="Je dispose d'un ou plusieurs camions"
              selected={role === 'TRANSPORTER'}
              onPress={() => setRole('TRANSPORTER')}
            />
          </View>

          <ErrorBanner message={error} />

          <Input
            label="Nom complet"
            value={form.fullName}
            onChangeText={set('fullName')}
            placeholder="Karim Belkacem"
            icon="person-outline"
            error={fieldErrors.fullName}
          />
          <Input
            label="Email"
            value={form.email}
            onChangeText={set('email')}
            placeholder="vous@exemple.dz"
            icon="mail-outline"
            keyboardType="email-address"
            autoCapitalize="none"
            error={fieldErrors.email}
          />
          <Input
            label="Telephone (optionnel)"
            value={form.phone}
            onChangeText={set('phone')}
            placeholder="+213 6 61 11 11 11"
            icon="call-outline"
            keyboardType="phone-pad"
            error={fieldErrors.phone}
          />
          <Input
            label="Mot de passe"
            value={form.password}
            onChangeText={set('password')}
            placeholder="Au moins 8 caracteres"
            icon="lock-closed-outline"
            secureTextEntry
            error={fieldErrors.password}
          />

          {role === 'TRANSPORTER' ? (
            <>
              <Text style={styles.sectionLabel}>Votre entreprise</Text>
              <Input
                label="Raison sociale"
                value={form.companyName}
                onChangeText={set('companyName')}
                placeholder="Meddah Transport"
                icon="business-outline"
                error={fieldErrors.companyName}
              />
              <OptionPicker
                label="Ville de rattachement"
                value={form.city}
                options={CITY_OPTIONS}
                onChange={set('city')}
                placeholder="Choisir une ville"
                error={fieldErrors.city}
              />
              <View style={styles.notice}>
                <Ionicons name="information-circle-outline" size={17} color={colors.info} />
                <Text style={styles.noticeText}>
                  Votre compte sera verifie par notre equipe apres l'envoi de vos documents (RC, patente,
                  carte grise).
                </Text>
              </View>
            </>
          ) : null}

          <Button title="Creer mon compte" onPress={onSubmit} loading={loading} style={styles.submit} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function RoleOption({ icon, title, description, selected, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      style={[styles.role, selected && styles.roleSelected]}
    >
      <Ionicons name={icon} size={22} color={selected ? colors.primaryDark : colors.textMuted} />
      <Text style={[styles.roleTitle, selected && styles.roleTitleSelected]}>{title}</Text>
      <Text style={styles.roleDescription}>{description}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.card },
  flex: { flex: 1 },
  scroll: { padding: spacing.xl, paddingTop: spacing.lg },
  sectionLabel: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  roles: { flexDirection: 'row', marginBottom: spacing.xl },
  role: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginRight: spacing.md,
  },
  roleSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  roleTitle: { ...typography.bodyStrong, color: colors.text, marginTop: spacing.sm },
  roleTitleSelected: { color: colors.primaryDark },
  roleDescription: { ...typography.caption, color: colors.textMuted, fontWeight: '400', marginTop: 2 },
  notice: {
    flexDirection: 'row',
    backgroundColor: colors.infoSoft,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  noticeText: { ...typography.small, color: colors.info, flex: 1, marginLeft: spacing.sm, lineHeight: 19 },
  submit: { marginTop: spacing.sm },
});
