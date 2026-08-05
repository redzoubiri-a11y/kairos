import { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Header, Body, StickyBar } from '../../components/Screen';
import MInput, { MSelect } from '../../components/MInput';
import MButton from '../../components/MButton';
import Stepper from '../../components/Stepper';
import PinPad from '../../components/PinPad';
import { MChip, MCard } from '../../components/primitives';
import { useTheme } from '../../context/ThemeContext';
import { useI18n } from '../../i18n';
import { useAuth } from '../../context/AuthContext';
import { CITIES, AMENITIES, AMENITY_ICONS, TRIAL_DAYS } from '../../lib/constants';

const STEPS = ['Salle', 'Tarifs', 'PIN'];

/** Inscription pro — création de la salle, des formules et du PIN de signature. */
export default function ProOnboardingScreen({ navigation }) {
  const { colors, typography, spacing, radii } = useTheme();
  const { t, dir } = useI18n();
  const { registerSalle } = useAuth();

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    name: '',
    city: CITIES[0],
    address: '',
    capacity_max: '',
    parking_places: '',
    description: '',
    amenities: ['clim', 'parking'],
    ccp: '',
  });

  const [tarifs, setTarifs] = useState([
    { name: 'Location salle seule', price: '' },
    { name: 'Salle + Traiteur', price: '' },
    { name: 'Tout inclus', price: '' },
  ]);

  const [pin, setPin] = useState('');

  const set = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (error) setError(null);
  };

  const toggleAmenity = (a) =>
    setForm((f) => ({
      ...f,
      amenities: f.amenities.includes(a) ? f.amenities.filter((x) => x !== a) : [...f.amenities, a],
    }));

  const validateStep = () => {
    if (step === 0) {
      if (form.name.trim().length < 3) return t('pro.hallName');
      if (!form.capacity_max) return t('pro.capacity');
      return null;
    }
    if (step === 1) {
      if (!tarifs.some((x) => Number(x.price) > 0)) return t('pro.formulaPrice');
      return null;
    }
    return null;
  };

  const next = () => {
    const problem = validateStep();
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    setStep((s) => s + 1);
  };

  const submit = async (finalPin) => {
    setSaving(true);
    setError(null);
    try {
      await registerSalle({
        ...form,
        capacity_max: Number(form.capacity_max) || 0,
        parking_places: Number(form.parking_places) || 0,
        pin: finalPin,
        tarifs: tarifs
          .filter((x) => Number(x.price) > 0)
          .map((x) => ({ name: x.name, price: Number(x.price) })),
      });
      // L'état d'authentification bascule vers l'espace pro (voir App.js).
    } catch (e) {
      setError(e.message || t('common.error'));
      setSaving(false);
    }
  };

  return (
    <Screen>
      <Header
        title={t('pro.onboardingTitle')}
        subtitle={t('pro.onboardingSubtitle')}
        onBack={step === 0 ? navigation.goBack : () => setStep((s) => s - 1)}
      />

      <View style={{ paddingVertical: spacing.lg }}>
        <Stepper steps={STEPS} current={step} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <Body>
          {step === 0 ? (
            <>
              <MInput label={t('pro.hallName')} value={form.name} onChangeText={(v) => set('name', v)} placeholder="Salle El Widad" />
              <MSelect
                label={t('pro.city')}
                value={form.city}
                onChange={(v) => set('city', v)}
                options={CITIES.map((c) => ({ value: c, label: c }))}
              />
              <MInput label={t('pro.address')} value={form.address} onChangeText={(v) => set('address', v)} />

              <View style={{ flexDirection: dir, gap: spacing.md }}>
                <MInput
                  label={t('pro.capacity')}
                  value={form.capacity_max}
                  onChangeText={(v) => set('capacity_max', v.replace(/\D/g, ''))}
                  keyboardType="number-pad"
                  direction="ltr"
                  style={{ flex: 1 }}
                />
                <MInput
                  label={t('pro.parkingPlaces')}
                  value={form.parking_places}
                  onChangeText={(v) => set('parking_places', v.replace(/\D/g, ''))}
                  keyboardType="number-pad"
                  direction="ltr"
                  style={{ flex: 1 }}
                />
              </View>

              <MInput
                label={t('pro.description')}
                value={form.description}
                onChangeText={(v) => set('description', v)}
                multiline
              />

              <View style={{ gap: spacing.sm }}>
                <Text style={[typography.caption, { color: colors.warmGray }]}>{t('salle.amenities')}</Text>
                <View style={{ flexDirection: dir, flexWrap: 'wrap', gap: spacing.sm }}>
                  {AMENITIES.map((a) => (
                    <MChip
                      key={a}
                      label={t(`amenities.${a}`)}
                      icon={AMENITY_ICONS[a]}
                      active={form.amenities.includes(a)}
                      onPress={() => toggleAmenity(a)}
                    />
                  ))}
                </View>
              </View>
            </>
          ) : null}

          {step === 1 ? (
            <>
              <Text style={[typography.secondary, { color: colors.warmGray }]}>
                {t('salle.formulas')} — {t('common.optional')} pour les formules non proposées.
              </Text>

              {tarifs.map((tarif, i) => (
                <MCard key={tarif.name} style={{ gap: spacing.md }}>
                  <MInput
                    label={t('pro.formulaName')}
                    value={tarif.name}
                    onChangeText={(v) =>
                      setTarifs((list) => list.map((x, idx) => (idx === i ? { ...x, name: v } : x)))
                    }
                  />
                  <MInput
                    label={t('pro.formulaPrice')}
                    value={tarif.price}
                    onChangeText={(v) =>
                      setTarifs((list) =>
                        list.map((x, idx) => (idx === i ? { ...x, price: v.replace(/\D/g, '') } : x))
                      )
                    }
                    keyboardType="number-pad"
                    direction="ltr"
                    suffix={t('common.currency')}
                  />
                </MCard>
              ))}

              <MInput
                label={t('pro.ccpNumber')}
                value={form.ccp}
                onChangeText={(v) => set('ccp', v)}
                direction="ltr"
                hint="Communiqué aux clients lors des demandes d'acompte"
              />
            </>
          ) : null}

          {step === 2 ? (
            <View style={{ gap: spacing.xl, alignItems: 'center' }}>
              <View
                style={{
                  backgroundColor: colors.goldLight,
                  borderWidth: 1,
                  borderColor: colors.gold,
                  borderRadius: radii.xl,
                  padding: spacing.lg,
                  flexDirection: dir,
                  gap: spacing.md,
                  alignItems: 'center',
                }}
              >
                <Ionicons name="gift-outline" size={20} color={colors.goldText} />
                <Text style={[typography.secondary, { color: colors.goldText, flex: 1 }]}>
                  {TRIAL_DAYS} jours offerts à partir d'aujourd'hui, puis 500 DA/mois sans engagement.
                </Text>
              </View>

              <PinPad
                value={pin}
                onChange={setPin}
                onComplete={submit}
                label={t('pro.pinSet')}
                error={error}
              />

              {saving ? (
                <Text style={[typography.caption, { color: colors.warmGray }]}>{t('common.loading')}</Text>
              ) : null}
            </View>
          ) : null}

          {error && step !== 2 ? (
            <Text style={[typography.caption, { color: colors.accent }]}>{error}</Text>
          ) : null}
        </Body>
      </KeyboardAvoidingView>

      {step < 2 ? (
        <StickyBar>
          <MButton label={t('common.next')} onPress={next} size="lg" full style={{ flex: 1 }} />
        </StickyBar>
      ) : null}
    </Screen>
  );
}
