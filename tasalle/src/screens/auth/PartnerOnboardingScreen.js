import { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Header, Body } from '../../components/Screen';
import MInput, { MSelect } from '../../components/MInput';
import MButton from '../../components/MButton';
import { MChip } from '../../components/primitives';
import { useTheme } from '../../context/ThemeContext';
import { useI18n } from '../../i18n';
import { useAuth } from '../../context/AuthContext';
import {
  CITIES,
  SPECIALITES_TRAITEUR,
  SPECIALITES_HALOUADJI,
  TRIAL_DAYS,
  PARTNER_SUBSCRIPTION_PRICES,
} from '../../lib/constants';

const SPECIALITES_BY_TYPE = { traiteur: SPECIALITES_TRAITEUR, halouadji: SPECIALITES_HALOUADJI };

/**
 * Inscription traiteur/halouadji (§13) — un seul écran, pas de Stepper :
 * contrairement à `ProOnboardingScreen` (salle), ni tarifs par formule ni
 * PIN de signature (aucune réservation à date bloquée à confirmer).
 * `route.params.type` vaut 'traiteur' ou 'halouadji'.
 */
export default function PartnerOnboardingScreen({ route, navigation }) {
  const { type } = route.params;
  const { colors, typography, spacing } = useTheme();
  const { t } = useI18n();
  const { registerPartner } = useAuth();

  const specialitesOptions = SPECIALITES_BY_TYPE[type];

  const [form, setForm] = useState({
    name: '',
    city: CITIES[0],
    description: '',
    specialites: [],
    prix_min: '',
    prix_max: '',
  });
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const toggleSpecialite = (s) =>
    setForm((f) => ({
      ...f,
      specialites: f.specialites.includes(s) ? f.specialites.filter((x) => x !== s) : [...f.specialites, s],
    }));

  const submit = async () => {
    if (form.name.trim().length < 3) {
      setError(t('partnerOnboarding.errorName'));
      return;
    }
    if (!form.city) {
      setError(t('partnerOnboarding.errorCity'));
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await registerPartner(type, form);
      // L'état d'authentification bascule vers l'espace pro (voir App.js).
    } catch (e) {
      setError(e.message || t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <Header title={t('partnerOnboarding.title')} bordered={false} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <Body>
          <MInput
            label={t('partnerOnboarding.name')}
            value={form.name}
            onChangeText={(v) => set('name', v)}
            placeholder={t('partnerOnboarding.namePlaceholder')}
          />
          <MSelect
            label={t('partnerOnboarding.city')}
            value={form.city}
            onChange={(v) => set('city', v)}
            options={CITIES.map((c) => ({ value: c, label: c }))}
          />
          <MInput
            label={t('partnerOnboarding.description')}
            value={form.description}
            onChangeText={(v) => set('description', v)}
            placeholder={t('partnerOnboarding.descriptionPlaceholder')}
            multiline
          />

          <View style={{ gap: spacing.sm }}>
            <Text style={[typography.caption, { color: colors.warmGray }]}>{t('partnerOnboarding.specialites')}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
              {specialitesOptions.map((s) => (
                <MChip
                  key={s}
                  label={t(`specialites.${s}`)}
                  active={form.specialites.includes(s)}
                  onPress={() => toggleSpecialite(s)}
                />
              ))}
            </View>
          </View>

          <View style={{ gap: spacing.sm }}>
            <Text style={[typography.caption, { color: colors.warmGray }]}>{t('partnerOnboarding.priceRange')}</Text>
            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <MInput
                label={t('partnerOnboarding.priceMin')}
                value={form.prix_min}
                onChangeText={(v) => set('prix_min', v.replace(/\D/g, ''))}
                keyboardType="number-pad"
                textContentType="none"
                direction="ltr"
                style={{ flex: 1 }}
              />
              <MInput
                label={t('partnerOnboarding.priceMax')}
                value={form.prix_max}
                onChangeText={(v) => set('prix_max', v.replace(/\D/g, ''))}
                keyboardType="number-pad"
                textContentType="none"
                direction="ltr"
                style={{ flex: 1 }}
              />
            </View>
          </View>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.sm,
              backgroundColor: colors.goldLight,
              borderWidth: 1,
              borderColor: colors.gold,
              borderRadius: 10,
              padding: spacing.md,
            }}
          >
            <Ionicons name="gift-outline" size={20} color={colors.goldText} />
            <Text style={[typography.secondary, { color: colors.goldText, flex: 1 }]}>
              {t('partnerOnboarding.trialBanner', { days: TRIAL_DAYS, price: PARTNER_SUBSCRIPTION_PRICES[type] })}
            </Text>
          </View>

          {error ? <Text style={[typography.caption, { color: colors.accentInk }]}>{error}</Text> : null}

          <MButton label={t('partnerOnboarding.submit')} onPress={submit} loading={saving} size="lg" full />
        </Body>
      </KeyboardAvoidingView>
    </Screen>
  );
}
