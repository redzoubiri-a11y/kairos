import React, { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ScreenHeader from '../components/ScreenHeader';
import Input from '../components/Input';
import Button from '../components/Button';
import OptionPicker from '../components/OptionPicker';
import VolumeSlider from '../components/VolumeSlider';
import ErrorBanner from '../components/ErrorBanner';
import EmptyState from '../components/EmptyState';
import Loader from '../components/Loader';
import { truckApi, tripApi } from '../api/endpoints';
import { useAuthStore } from '../store/authStore';
import { ALGERIAN_CITIES, GOODS_TYPES } from '../utils/constants';
import { formatVolume, formatWeight } from '../utils/format';
import { colors, radii, spacing, typography } from '../theme';

const CITY_OPTIONS = ALGERIAN_CITIES.map((c) => ({ value: c.name, label: c.name }));
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

export default function DeclareRouteScreen({ navigation }) {
  const days = useMemo(dayOptions, []);
  const isVerified = useAuthStore((s) => s.user?.transporter?.verificationStatus === 'VERIFIED');

  const [trucks, setTrucks] = useState([]);
  const [loadingTrucks, setLoadingTrucks] = useState(true);
  const [form, setForm] = useState({
    truckId: null,
    originCity: 'Alger',
    destinationCity: '',
    day: days[1].value,
    hour: 6,
    freeVolumeM3: 10,
    freeWeightKg: '',
    pricePerM3: '',
    goodsTypes: [],
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const selectedTruck = trucks.find((t) => t.id === form.truckId) ?? null;
  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  useEffect(() => {
    (async () => {
      try {
        const items = await truckApi.mine();
        setTrucks(items);
        if (items.length) setForm((f) => ({ ...f, truckId: items[0].id }));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoadingTrucks(false);
      }
    })();
  }, []);

  const toggleGoods = (goods) =>
    setForm((f) => ({
      ...f,
      goodsTypes: f.goodsTypes.includes(goods)
        ? f.goodsTypes.filter((g) => g !== goods)
        : [...f.goodsTypes, goods],
    }));

  const validate = () => {
    const errors = {};
    if (!form.truckId) errors.truckId = 'Selectionnez un camion';
    if (!form.originCity) errors.originCity = 'Ville de depart requise';
    if (!form.destinationCity) errors.destinationCity = 'Ville de destination requise';
    else if (form.destinationCity === form.originCity) errors.destinationCity = 'Choisissez une ville differente';
    if (selectedTruck && form.freeVolumeM3 > selectedTruck.volumeM3) {
      errors.freeVolumeM3 = `Maximum ${formatVolume(selectedTruck.volumeM3)}`;
    }
    const weight = Number(form.freeWeightKg);
    if (!form.freeWeightKg || Number.isNaN(weight) || weight < 0) errors.freeWeightKg = 'Charge libre requise';
    else if (selectedTruck && weight > selectedTruck.capacityKg) {
      errors.freeWeightKg = `Maximum ${formatWeight(selectedTruck.capacityKg)}`;
    }
    if (form.pricePerM3 && Number.isNaN(Number(form.pricePerM3))) errors.pricePerM3 = 'Montant invalide';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const onSubmit = async () => {
    if (!validate()) return;

    const origin = cityCoords(form.originCity);
    const destination = cityCoords(form.destinationCity);
    const departureAt = new Date(form.day);
    departureAt.setHours(form.hour, 0, 0, 0);

    setLoading(true);
    setError(null);
    try {
      await tripApi.create({
        truckId: form.truckId,
        originCity: form.originCity,
        originLat: origin.latitude,
        originLng: origin.longitude,
        destinationCity: form.destinationCity,
        destinationLat: destination.latitude,
        destinationLng: destination.longitude,
        departureAt: departureAt.toISOString(),
        freeVolumeM3: form.freeVolumeM3,
        freeWeightKg: Number(form.freeWeightKg),
        ...(form.pricePerM3 ? { pricePerM3: Number(form.pricePerM3) } : {}),
        goodsTypes: form.goodsTypes,
        ...(form.notes.trim() ? { notes: form.notes.trim() } : {}),
      });
      navigation.navigate('MyTrips');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loadingTrucks) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScreenHeader title="Declarer un trajet" />
        <Loader />
      </SafeAreaView>
    );
  }

  if (!isVerified) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScreenHeader title="Declarer un trajet" />
        <EmptyState
          icon="shield-checkmark-outline"
          title="Compte en cours de verification"
          message="Envoyez vos documents (RC, patente, carte grise) pour pouvoir publier vos trajets."
          actionLabel="Envoyer mes documents"
          onAction={() => navigation.navigate('Documents')}
        />
      </SafeAreaView>
    );
  }

  if (!trucks.length) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScreenHeader title="Declarer un trajet" />
        <EmptyState
          icon="bus-outline"
          title="Aucun camion enregistre"
          message="Ajoutez au moins un camion avant de declarer un trajet."
          actionLabel="Ajouter un camion"
          onAction={() => navigation.navigate('MyTrucks')}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title="Declarer un trajet" subtitle="Publiez votre volume libre" />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <ErrorBanner message={error} />

          <OptionPicker
            label="Camion"
            value={form.truckId}
            options={trucks.map((t) => ({
              value: t.id,
              label: `${t.plateNumber} — ${formatVolume(t.volumeM3)} / ${formatWeight(t.capacityKg)}`,
            }))}
            onChange={set('truckId')}
            error={fieldErrors.truckId}
          />

          <Text style={styles.section}>Itineraire</Text>
          <OptionPicker
            label="Depart"
            value={form.originCity}
            options={CITY_OPTIONS}
            onChange={set('originCity')}
            error={fieldErrors.originCity}
          />
          <OptionPicker
            label="Destination"
            value={form.destinationCity}
            options={CITY_OPTIONS}
            onChange={set('destinationCity')}
            placeholder="Choisir une ville"
            error={fieldErrors.destinationCity}
          />
          <View style={styles.row}>
            <View style={styles.rowItem}>
              <OptionPicker label="Date" value={form.day} options={days} onChange={set('day')} />
            </View>
            <View style={[styles.rowItem, styles.rowItemLast]}>
              <OptionPicker label="Heure" value={form.hour} options={HOUR_OPTIONS} onChange={set('hour')} />
            </View>
          </View>

          <Text style={styles.section}>Capacite disponible</Text>
          <VolumeSlider
            label="Volume libre"
            value={form.freeVolumeM3}
            onChange={set('freeVolumeM3')}
            min={0}
            max={selectedTruck ? Math.floor(selectedTruck.volumeM3) : 100}
            step={1}
          />
          {fieldErrors.freeVolumeM3 ? <Text style={styles.error}>{fieldErrors.freeVolumeM3}</Text> : null}
          <Input
            label="Charge libre"
            value={form.freeWeightKg}
            onChangeText={set('freeWeightKg')}
            placeholder={selectedTruck ? String(selectedTruck.capacityKg) : '5000'}
            icon="barbell-outline"
            keyboardType="number-pad"
            suffix="kg"
            error={fieldErrors.freeWeightKg}
          />
          <Input
            label="Prix indicatif (optionnel)"
            value={form.pricePerM3}
            onChangeText={set('pricePerM3')}
            placeholder="2500"
            icon="cash-outline"
            keyboardType="number-pad"
            suffix="DA / m³"
            error={fieldErrors.pricePerM3}
          />

          <Text style={styles.section}>Marchandises acceptees</Text>
          <View style={styles.chips}>
            {GOODS_TYPES.map((goods) => {
              const active = form.goodsTypes.includes(goods);
              return (
                <Pressable
                  key={goods}
                  onPress={() => toggleGoods(goods)}
                  style={[styles.chip, active && styles.chipActive]}
                >
                  {active ? <Ionicons name="checkmark" size={13} color="#1A1206" /> : null}
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{goods}</Text>
                </Pressable>
              );
            })}
          </View>

          <Input
            label="Remarques (optionnel)"
            value={form.notes}
            onChangeText={set('notes')}
            placeholder="Depart matinal, chargement possible a Blida..."
            multiline
          />

          <Button title="Publier le trajet" icon="megaphone-outline" onPress={onSubmit} loading={loading} />
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
  row: { flexDirection: 'row' },
  rowItem: { flex: 1, marginRight: spacing.md },
  rowItemLast: { marginRight: 0 },
  error: { ...typography.small, color: colors.danger, marginTop: -spacing.md, marginBottom: spacing.md },
  chips: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.lg },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { ...typography.small, color: colors.textMuted, marginLeft: 3 },
  chipTextActive: { color: '#1A1206', fontWeight: '600' },
});
