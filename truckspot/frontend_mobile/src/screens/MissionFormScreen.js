import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ScreenHeader from '../components/ScreenHeader';
import Input from '../components/Input';
import Button from '../components/Button';
import OptionPicker from '../components/OptionPicker';
import VolumeSlider from '../components/VolumeSlider';
import ErrorBanner from '../components/ErrorBanner';
import EmptyState from '../components/EmptyState';
import { missionApi } from '../api/endpoints';
import { useMissionStore } from '../store/missionStore';
import { ALGERIAN_CITIES, GOODS_TYPES } from '../utils/constants';
import { formatVolume, formatWeight } from '../utils/format';
import { colors, radii, spacing, typography } from '../theme';

const CITY_OPTIONS = ALGERIAN_CITIES.map((c) => ({ value: c.name, label: c.name }));
const GOODS_OPTIONS = GOODS_TYPES.map((g) => ({ value: g, label: g }));
const HOUR_OPTIONS = Array.from({ length: 24 }, (_, h) => ({
  value: h,
  label: `${String(h).padStart(2, '0')}:00`,
}));

function dayOptions() {
  return Array.from({ length: 14 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    date.setHours(0, 0, 0, 0);
    return {
      value: date.toISOString(),
      label:
        i === 0
          ? "Aujourd'hui"
          : i === 1
            ? 'Demain'
            : date.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' }),
    };
  });
}

function cityCoords(name) {
  return ALGERIAN_CITIES.find((c) => c.name === name);
}

export default function MissionFormScreen({ navigation, route }) {
  const { truck, trip } = route.params ?? {};
  const upsert = useMissionStore((s) => s.upsert);
  const days = useMemo(dayOptions, []);

  const maxVolume = trip?.freeVolumeM3 ?? truck?.volumeM3 ?? 100;
  const maxWeight = trip?.freeWeightKg ?? truck?.capacityKg ?? 20000;
  // La recherche ecarte deja les trajets epuises (voir /trips/list), mais la
  // liste affichee peut avoir vieilli de quelques secondes entre son
  // chargement et l'ouverture de cet ecran — une mission acceptee entre
  // temps peut avoir consomme la derniere place. Sans ce garde-fou, le
  // curseur de volume s'ouvrait avec un minimum superieur a son maximum : un
  // formulaire qui refuse systematiquement, sans jamais dire pourquoi.
  const capacityExhausted = trip != null && (maxVolume <= 0 || maxWeight <= 0);

  const [form, setForm] = useState({
    goodsType: trip?.goodsTypes?.[0] ?? GOODS_TYPES[0],
    volumeM3: Math.min(5, Math.floor(maxVolume)),
    weightKg: '',
    pickupCity: trip?.originCity ?? truck?.transporter?.city ?? 'Alger',
    dropoffCity: trip?.destinationCity ?? '',
    day: days[1].value,
    hour: 8,
    budgetDzd: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  const validate = () => {
    const errors = {};
    if (!form.goodsType) errors.goodsType = 'Type de marchandise requis';
    if (!form.volumeM3 || form.volumeM3 <= 0) errors.volumeM3 = 'Volume requis';
    else if (form.volumeM3 > maxVolume) errors.volumeM3 = `Maximum ${formatVolume(maxVolume)}`;
    const weight = Number(form.weightKg);
    if (!form.weightKg || Number.isNaN(weight) || weight < 1) errors.weightKg = 'Poids requis';
    else if (weight > maxWeight) errors.weightKg = `Maximum ${formatWeight(maxWeight)}`;
    if (!form.pickupCity) errors.pickupCity = 'Ville de chargement requise';
    if (!form.dropoffCity) errors.dropoffCity = 'Ville de livraison requise';
    else if (form.dropoffCity === form.pickupCity) errors.dropoffCity = 'Choisissez une ville differente';
    if (form.budgetDzd && Number.isNaN(Number(form.budgetDzd))) errors.budgetDzd = 'Montant invalide';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const onSubmit = async () => {
    if (!validate()) return;

    const pickup = cityCoords(form.pickupCity);
    const dropoff = cityCoords(form.dropoffCity);
    const pickupAt = new Date(form.day);
    pickupAt.setHours(form.hour, 0, 0, 0);

    setLoading(true);
    setError(null);
    try {
      const mission = await missionApi.create({
        transporterId: truck.transporter.id,
        truckId: truck.id,
        ...(trip ? { tripId: trip.id } : {}),
        goodsType: form.goodsType,
        volumeM3: form.volumeM3,
        weightKg: Number(form.weightKg),
        pickupCity: form.pickupCity,
        pickupLat: pickup.latitude,
        pickupLng: pickup.longitude,
        pickupAt: pickupAt.toISOString(),
        dropoffCity: form.dropoffCity,
        dropoffLat: dropoff.latitude,
        dropoffLng: dropoff.longitude,
        ...(form.budgetDzd ? { budgetDzd: Number(form.budgetDzd) } : {}),
        ...(form.description.trim() ? { description: form.description.trim() } : {}),
      });

      upsert(mission);
      navigation.replace('MissionDetail', { missionId: mission.id });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (capacityExhausted) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ScreenHeader title="Nouvelle mission" onBack={() => navigation.goBack()} />
        <EmptyState
          icon="cube-outline"
          title="Ce trajet est complet"
          message="Un autre client vient de reserver la place restante. Revenez a la carte pour trouver un autre trajet, ou envoyez une demande directe au transporteur."
          actionLabel="Retour"
          onAction={() => navigation.goBack()}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScreenHeader
        title="Nouvelle mission"
        subtitle={truck?.transporter?.companyName}
        onBack={() => navigation.goBack()}
      />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {trip ? (
            <View style={styles.tripBanner}>
              <Ionicons name="git-branch-outline" size={17} color={colors.info} />
              <Text style={styles.tripBannerText}>
                Rattachee au trajet {trip.originCity} → {trip.destinationCity} — reste{' '}
                {formatVolume(trip.freeVolumeM3)} et {formatWeight(trip.freeWeightKg)}.
              </Text>
            </View>
          ) : null}

          <ErrorBanner message={error} />

          <Text style={styles.section}>Marchandise</Text>
          <OptionPicker
            label="Type de marchandise"
            value={form.goodsType}
            options={GOODS_OPTIONS}
            onChange={set('goodsType')}
            error={fieldErrors.goodsType}
          />
          <VolumeSlider
            label="Volume a charger"
            value={form.volumeM3}
            onChange={set('volumeM3')}
            min={1}
            max={Math.max(1, Math.floor(maxVolume))}
            step={1}
          />
          {fieldErrors.volumeM3 ? <Text style={styles.error}>{fieldErrors.volumeM3}</Text> : null}
          <Input
            label="Poids total"
            value={form.weightKg}
            onChangeText={set('weightKg')}
            placeholder="2400"
            icon="barbell-outline"
            keyboardType="number-pad"
            suffix="kg"
            error={fieldErrors.weightKg}
          />

          <Text style={styles.section}>Trajet</Text>
          <OptionPicker
            label="Ville de chargement"
            value={form.pickupCity}
            options={CITY_OPTIONS}
            onChange={set('pickupCity')}
            error={fieldErrors.pickupCity}
          />
          <OptionPicker
            label="Ville de livraison"
            value={form.dropoffCity}
            options={CITY_OPTIONS}
            onChange={set('dropoffCity')}
            placeholder="Choisir une ville"
            error={fieldErrors.dropoffCity}
          />

          <View style={styles.row}>
            <View style={styles.rowItem}>
              <OptionPicker label="Date" value={form.day} options={days} onChange={set('day')} />
            </View>
            <View style={styles.rowItem}>
              <OptionPicker label="Heure" value={form.hour} options={HOUR_OPTIONS} onChange={set('hour')} />
            </View>
          </View>

          <Text style={styles.section}>Complements</Text>
          <Input
            label="Budget propose (optionnel)"
            value={form.budgetDzd}
            onChangeText={set('budgetDzd')}
            placeholder="25000"
            icon="cash-outline"
            keyboardType="number-pad"
            suffix="DA"
            error={fieldErrors.budgetDzd}
          />
          <Input
            label="Precisions (optionnel)"
            value={form.description}
            onChangeText={set('description')}
            placeholder="Manutention prevue sur place, 20 cartons..."
            multiline
          />

          <Button title="Envoyer la mission" icon="send" onPress={onSubmit} loading={loading} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.card },
  flex: { flex: 1 },
  scroll: { padding: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.xxxl },
  section: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  tripBanner: {
    flexDirection: 'row',
    backgroundColor: colors.infoSoft,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  tripBannerText: { ...typography.small, color: colors.info, flex: 1, marginLeft: spacing.sm, lineHeight: 19 },
  row: { flexDirection: 'row' },
  rowItem: { flex: 1, marginRight: spacing.md },
  error: { ...typography.small, color: colors.danger, marginTop: -spacing.md, marginBottom: spacing.md },
});
