import React, { useCallback, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import ScreenHeader from '../components/ScreenHeader';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import OptionPicker from '../components/OptionPicker';
import BottomSheet from '../components/BottomSheet';
import EmptyState from '../components/EmptyState';
import Loader from '../components/Loader';
import ErrorBanner from '../components/ErrorBanner';
import { truckApi } from '../api/endpoints';
import { emit } from '../api/socket';
import { useLocationWatcher } from '../hooks/useLocation';
import { useAuthStore } from '../store/authStore';
import { TRUCK_TYPES, TRUCK_TYPE_LABELS } from '../utils/constants';
import { formatVolume, formatWeight, formatRelative } from '../utils/format';
import { colors, radii, spacing, typography } from '../theme';

const TYPE_OPTIONS = TRUCK_TYPES.map((t) => ({ value: t.value, label: t.label }));

const EMPTY_FORM = { plateNumber: '', brand: '', model: '', type: 'FOURGON', capacityKg: '', volumeM3: '' };

export default function MyTrucksScreen({ navigation }) {
  const [trucks, setTrucks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [trackingTruckId, setTrackingTruckId] = useState(null);

  const isVerified = useAuthStore((s) => s.user?.transporter?.verificationStatus === 'VERIFIED');

  // Streams the driver position to the clients' map while tracking is on.
  const publishPosition = useCallback(
    ({ latitude, longitude }) => {
      if (!trackingTruckId) return;
      emit('truck:position', { truckId: trackingTruckId, latitude, longitude }, (ack) => {
        if (ack?.ok) {
          setTrucks((current) =>
            current.map((t) => (t.id === trackingTruckId ? { ...t, ...ack.truck } : t))
          );
        } else {
          setError(ack?.error ?? 'Position non transmise');
          setTrackingTruckId(null);
        }
      });
    },
    [trackingTruckId]
  );

  useLocationWatcher(!!trackingTruckId, publishPosition);

  const toggleTracking = (truck) => {
    if (trackingTruckId === truck.id) {
      setTrackingTruckId(null);
      return;
    }
    if (!isVerified) {
      setError('Votre compte doit etre verifie pour diffuser votre position.');
      return;
    }
    setError(null);
    setTrackingTruckId(truck.id);
  };

  const load = useCallback(async () => {
    setError(null);
    try {
      setTrucks(await truckApi.mine());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  const validate = () => {
    const errors = {};
    if (form.plateNumber.trim().length < 4) errors.plateNumber = "Numero d'immatriculation requis";
    const capacity = Number(form.capacityKg);
    if (!capacity || capacity < 100) errors.capacityKg = 'Charge utile en kg (min 100)';
    const volume = Number(form.volumeM3);
    if (!volume || volume < 1) errors.volumeM3 = 'Volume en m³ (min 1)';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const onSave = async () => {
    if (!validate()) return;
    setSaving(true);
    setError(null);
    try {
      await truckApi.create({
        plateNumber: form.plateNumber.trim(),
        ...(form.brand.trim() ? { brand: form.brand.trim() } : {}),
        ...(form.model.trim() ? { model: form.model.trim() } : {}),
        type: form.type,
        capacityKg: Number(form.capacityKg),
        volumeM3: Number(form.volumeM3),
      });
      setForm(EMPTY_FORM);
      setSheetOpen(false);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleAvailability = async (truck) => {
    try {
      await truckApi.update(truck.id, { isAvailable: !truck.isAvailable });
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const confirmDelete = (truck) => {
    Alert.alert('Supprimer le camion', `${truck.plateNumber} sera retire de votre flotte.`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            await truckApi.remove(truck.id);
            await load();
          } catch (err) {
            setError(err.message);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader
        title="Ma flotte"
        subtitle={`${trucks.length} camion(s)`}
        onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined}
      />

      {loading ? (
        <Loader />
      ) : (
        <FlatList
          data={trucks}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={error ? <ErrorBanner message={error} onRetry={load} /> : null}
          renderItem={({ item }) => (
            <Card style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.iconBox}>
                  <Ionicons name="bus" size={20} color={colors.primaryDark} />
                </View>
                <View style={styles.cardTitles}>
                  <Text style={styles.plate}>{item.plateNumber}</Text>
                  <Text style={styles.meta}>
                    {TRUCK_TYPE_LABELS[item.type]} • {[item.brand, item.model].filter(Boolean).join(' ') || '—'}
                  </Text>
                </View>
                <View style={[styles.status, item.isAvailable ? styles.statusOn : styles.statusOff]}>
                  <Text style={[styles.statusText, item.isAvailable ? styles.statusTextOn : styles.statusTextOff]}>
                    {item.isAvailable ? 'Disponible' : 'Indisponible'}
                  </Text>
                </View>
              </View>

              <View style={styles.specs}>
                <Text style={styles.spec}>{formatVolume(item.volumeM3)}</Text>
                <Text style={styles.specDot}>•</Text>
                <Text style={styles.spec}>{formatWeight(item.capacityKg)}</Text>
                {item.lastPositionAt ? (
                  <>
                    <Text style={styles.specDot}>•</Text>
                    <Text style={styles.spec}>Position {formatRelative(item.lastPositionAt)}</Text>
                  </>
                ) : null}
              </View>

              {trackingTruckId === item.id ? (
                <View style={styles.tracking}>
                  <View style={styles.trackingDot} />
                  <Text style={styles.trackingText}>
                    Position diffusee en direct aux clients
                  </Text>
                </View>
              ) : null}

              {/* Le serveur ecarte de la carte les positions trop anciennes.
                  Sans ce rappel, le transporteur se croirait visible. */}
              {item.isAvailable && item.visibleOnMap === false ? (
                <View style={styles.warning}>
                  <Ionicons name="eye-off-outline" size={15} color={colors.warning} />
                  <Text style={styles.warningText}>
                    {item.lastPositionAt
                      ? 'Position trop ancienne : votre camion n apparait plus sur la carte des clients. Diffusez votre position pour y revenir.'
                      : 'Aucune position transmise : votre camion n apparait pas sur la carte des clients.'}
                  </Text>
                </View>
              ) : null}

              <View style={styles.cardActions}>
                <Button
                  title={item.isAvailable ? 'Rendre indisponible' : 'Rendre disponible'}
                  variant="secondary"
                  size="sm"
                  onPress={() => toggleAvailability(item)}
                  style={styles.cardAction}
                />
                <Button
                  title="Supprimer"
                  variant="ghost"
                  size="sm"
                  onPress={() => confirmDelete(item)}
                  fullWidth={false}
                />
              </View>

              <Button
                title={trackingTruckId === item.id ? 'Arreter la diffusion' : 'Diffuser ma position'}
                variant={trackingTruckId === item.id ? 'danger' : 'dark'}
                size="sm"
                icon={trackingTruckId === item.id ? 'stop-circle-outline' : 'navigate-outline'}
                onPress={() => toggleTracking(item)}
                style={styles.trackingButton}
              />
            </Card>
          )}
          ListEmptyComponent={
            <EmptyState
              icon="bus-outline"
              title="Aucun camion"
              message="Ajoutez votre premier camion pour commencer a declarer des trajets."
            />
          }
        />
      )}

      <View style={styles.footer}>
        <Button title="Ajouter un camion" icon="add" onPress={() => setSheetOpen(true)} />
      </View>

      <BottomSheet visible={sheetOpen} onClose={() => setSheetOpen(false)} height={560}>
        <FlatList
          data={[1]}
          keyExtractor={() => 'form'}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.sheet}
          renderItem={() => (
            <View>
              <Text style={styles.sheetTitle}>Nouveau camion</Text>
              <Input
                label="Immatriculation"
                value={form.plateNumber}
                onChangeText={set('plateNumber')}
                placeholder="16-12345-24"
                icon="pricetag-outline"
                autoCapitalize="characters"
                error={fieldErrors.plateNumber}
              />
              <OptionPicker label="Type" value={form.type} options={TYPE_OPTIONS} onChange={set('type')} />
              <Input label="Marque (optionnel)" value={form.brand} onChangeText={set('brand')} placeholder="Mercedes" />
              <Input label="Modele (optionnel)" value={form.model} onChangeText={set('model')} placeholder="Actros" />
              <Input
                label="Volume"
                value={form.volumeM3}
                onChangeText={set('volumeM3')}
                placeholder="20"
                keyboardType="number-pad"
                suffix="m³"
                error={fieldErrors.volumeM3}
              />
              <Input
                label="Charge utile"
                value={form.capacityKg}
                onChangeText={set('capacityKg')}
                placeholder="3500"
                keyboardType="number-pad"
                suffix="kg"
                error={fieldErrors.capacityKg}
              />
              <Button title="Enregistrer" onPress={onSave} loading={saving} />
            </View>
          )}
        />
      </BottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cardMuted },
  list: { padding: spacing.lg, flexGrow: 1 },
  card: { marginBottom: spacing.md },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitles: { flex: 1, marginLeft: spacing.md },
  plate: { ...typography.bodyStrong, color: colors.text },
  meta: { ...typography.caption, color: colors.textMuted, fontWeight: '400', marginTop: 2 },
  status: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: 8 },
  statusOn: { backgroundColor: colors.successSoft },
  statusOff: { backgroundColor: colors.cardMuted },
  statusText: { ...typography.caption, fontSize: 10 },
  statusTextOn: { color: colors.success },
  statusTextOff: { color: colors.textMuted },
  specs: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.md, flexWrap: 'wrap' },
  spec: { ...typography.small, color: colors.textMuted },
  specDot: { ...typography.small, color: colors.border, marginHorizontal: spacing.sm },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  cardAction: { flex: 1, marginRight: spacing.sm },
  tracking: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successSoft,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.md,
  },
  trackingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success, marginRight: spacing.sm },
  trackingText: { ...typography.caption, color: colors.success, fontWeight: '600' },
  trackingButton: { marginTop: spacing.sm },
  warning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.warningSoft,
  },
  warningText: {
    ...typography.caption,
    color: colors.warning,
    flex: 1,
    marginLeft: spacing.sm,
    lineHeight: 17,
  },
  footer: {
    padding: spacing.lg,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  sheet: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  sheetTitle: { ...typography.h2, color: colors.text, marginBottom: spacing.lg },
});
