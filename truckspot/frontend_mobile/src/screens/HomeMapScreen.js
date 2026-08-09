import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import TruckMap from '../components/TruckMap';
import BottomSheet from '../components/BottomSheet';
import Button from '../components/Button';
import Badge from '../components/Badge';
import VolumeSlider from '../components/VolumeSlider';
import SegmentedControl from '../components/SegmentedControl';
import TripCard from '../components/TripCard';
import ErrorBanner from '../components/ErrorBanner';
import { useMapStore } from '../store/mapStore';
import { useLocation } from '../hooks/useLocation';
import { ALGERIAN_CITIES, DEFAULT_REGION, GOODS_TYPES, TRUCK_TYPES, TRUCK_TYPE_LABELS } from '../utils/constants';
import { formatDistance, formatVolume, formatWeight } from '../utils/format';
import { colors, radii, shadows, spacing, typography } from '../theme';

const TYPE_OPTIONS = [{ value: undefined, label: 'Tous' }, ...TRUCK_TYPES.map((t) => ({ value: t.value, label: t.label }))];
const GOODS_OPTIONS = [{ value: undefined, label: 'Toutes' }, ...GOODS_TYPES.map((g) => ({ value: g, label: g }))];
const CITY_OPTIONS = [{ value: undefined, label: 'Toutes' }, ...ALGERIAN_CITIES.map((c) => ({ value: c.name, label: c.name }))];

export default function HomeMapScreen({ navigation }) {
  const mapRef = useRef(null);
  const { coords, request: requestLocation } = useLocation();

  const trucks = useMapStore((s) => s.trucks);
  const filters = useMapStore((s) => s.filters);
  const loading = useMapStore((s) => s.loading);
  const error = useMapStore((s) => s.error);
  const selectedTruckId = useMapStore((s) => s.selectedTruckId);
  const setCenter = useMapStore((s) => s.setCenter);
  const setFilters = useMapStore((s) => s.setFilters);
  const resetFilters = useMapStore((s) => s.resetFilters);
  const selectTruck = useMapStore((s) => s.selectTruck);
  const clearSelection = useMapStore((s) => s.clearSelection);
  const refresh = useMapStore((s) => s.refresh);

  const [filtersOpen, setFiltersOpen] = useState(false);

  const selectedTruck = trucks.find((t) => t.id === selectedTruckId) ?? null;
  const trips = useMapStore((s) => s.trips);
  const truckTrips = selectedTruck ? trips.filter((trip) => trip.truck?.id === selectedTruck.id) : [];

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!coords) return;
    setCenter(coords);
    refresh();
    mapRef.current?.animateToRegion({ ...coords, latitudeDelta: 0.35, longitudeDelta: 0.35 }, 600);
  }, [coords, setCenter, refresh]);

  const recenter = useCallback(async () => {
    const next = coords ?? (await requestLocation());
    if (next) {
      mapRef.current?.animateToRegion({ ...next, latitudeDelta: 0.35, longitudeDelta: 0.35 }, 600);
    }
  }, [coords, requestLocation]);

  const activeFilterCount = [filters.minVolumeM3, filters.type, filters.city, filters.goodsType].filter(
    Boolean
  ).length;

  return (
    <View style={styles.container}>
      <TruckMap
        ref={mapRef}
        trucks={trucks}
        selectedTruckId={selectedTruckId}
        onSelectTruck={selectTruck}
        initialRegion={coords ? { ...coords, latitudeDelta: 0.35, longitudeDelta: 0.35 } : DEFAULT_REGION}
      />

      <SafeAreaView style={styles.topBar} edges={['top']} pointerEvents="box-none">
        <View style={styles.topRow}>
          <View style={styles.counter}>
            <View style={styles.counterDot} />
            <Text style={styles.counterText}>
              {loading ? 'Recherche...' : `${trucks.length} camion${trucks.length > 1 ? 's' : ''} disponible${trucks.length > 1 ? 's' : ''}`}
            </Text>
          </View>
          <Pressable style={styles.filterButton} onPress={() => setFiltersOpen(true)} accessibilityLabel="Filtres">
            <Ionicons name="options-outline" size={20} color={colors.text} />
            {activeFilterCount > 0 ? (
              <View style={styles.filterCount}>
                <Text style={styles.filterCountText}>{activeFilterCount}</Text>
              </View>
            ) : null}
          </Pressable>
        </View>

        {error ? (
          <View style={styles.errorWrap}>
            <ErrorBanner message={error} onRetry={refresh} />
          </View>
        ) : null}
      </SafeAreaView>

      <View style={styles.mapActions}>
        <Pressable style={styles.mapButton} onPress={recenter} accessibilityLabel="Recentrer">
          <Ionicons name="locate" size={20} color={colors.text} />
        </Pressable>
        <Pressable style={styles.mapButton} onPress={refresh} accessibilityLabel="Actualiser">
          <Ionicons name="refresh" size={20} color={colors.text} />
        </Pressable>
      </View>

      <BottomSheet visible={!!selectedTruck} onClose={clearSelection} height={480}>
        {selectedTruck ? (
          <ScrollView contentContainerStyle={styles.sheetContent}>
            <View style={styles.sheetHeader}>
              <View style={styles.sheetIcon}>
                <Ionicons name="bus" size={24} color={colors.primaryDark} />
              </View>
              <View style={styles.sheetTitles}>
                <Text style={styles.sheetTitle} numberOfLines={1}>
                  {selectedTruck.transporter?.companyName}
                </Text>
                <Text style={styles.sheetSubtitle}>
                  {TRUCK_TYPE_LABELS[selectedTruck.type] ?? selectedTruck.type} • {selectedTruck.plateNumber}
                </Text>
              </View>
              {selectedTruck.distanceKm !== undefined ? (
                <Text style={styles.sheetDistance}>{formatDistance(selectedTruck.distanceKm)}</Text>
              ) : null}
            </View>

            {selectedTruck.transporter?.verificationStatus === 'VERIFIED' ? (
              <Badge status="VERIFIED" label="Transporteur verifie" style={styles.sheetBadge} />
            ) : null}

            <View style={styles.sheetSpecs}>
              <SheetSpec label="Volume total" value={formatVolume(selectedTruck.volumeM3)} />
              <SheetSpec label="Charge utile" value={formatWeight(selectedTruck.capacityKg)} />
              <SheetSpec label="Base" value={selectedTruck.transporter?.city ?? '—'} />
            </View>

            {truckTrips.length ? (
              <>
                <Text style={styles.sheetSectionTitle}>Trajets declares</Text>
                {truckTrips.map((trip) => (
                  <TripCard
                    key={trip.id}
                    trip={trip}
                    onPress={() => {
                      clearSelection();
                      navigation.navigate('MissionForm', { truck: selectedTruck, trip });
                    }}
                  />
                ))}
              </>
            ) : (
              <Text style={styles.sheetHint}>
                Ce transporteur n'a pas encore declare de trajet. Vous pouvez tout de meme lui envoyer une
                demande de mission.
              </Text>
            )}

            <Button
              title="Envoyer une mission"
              icon="send"
              onPress={() => {
                clearSelection();
                navigation.navigate('MissionForm', { truck: selectedTruck, trip: truckTrips[0] ?? null });
              }}
              style={styles.sheetAction}
            />
          </ScrollView>
        ) : null}
      </BottomSheet>

      <BottomSheet visible={filtersOpen} onClose={() => setFiltersOpen(false)} height={430}>
        <ScrollView contentContainerStyle={styles.sheetContent}>
          <Text style={styles.sheetTitle}>Filtrer les camions</Text>

          <VolumeSlider
            label="Volume libre minimum"
            value={filters.minVolumeM3 ?? 0}
            onChange={(v) => setFilters({ minVolumeM3: v === 0 ? undefined : v })}
            min={0}
            max={100}
            step={1}
          />

          <Text style={styles.filterLabel}>Type de camion</Text>
          <SegmentedControl
            options={TYPE_OPTIONS}
            value={filters.type}
            onChange={(type) => setFilters({ type })}
            style={styles.segments}
          />

          <Text style={styles.filterLabel}>Marchandise acceptee</Text>
          <SegmentedControl
            options={GOODS_OPTIONS}
            value={filters.goodsType}
            onChange={(goodsType) => setFilters({ goodsType })}
            style={styles.segments}
          />

          <Text style={styles.filterLabel}>Ville</Text>
          <SegmentedControl
            options={CITY_OPTIONS}
            value={filters.city}
            onChange={(city) => setFilters({ city })}
            style={styles.segments}
          />

          <Text style={styles.filterLabel}>Rayon de recherche</Text>
          <SegmentedControl
            options={[
              { value: 25, label: '25 km' },
              { value: 50, label: '50 km' },
              { value: 100, label: '100 km' },
              { value: 300, label: '300 km' },
            ]}
            value={filters.radiusKm}
            onChange={(radiusKm) => setFilters({ radiusKm })}
            style={styles.segments}
          />

          <Button title="Voir les resultats" onPress={() => setFiltersOpen(false)} style={styles.sheetAction} />
          {activeFilterCount > 0 ? (
            <Button title="Reinitialiser les filtres" variant="ghost" onPress={resetFilters} />
          ) : null}
        </ScrollView>
      </BottomSheet>
    </View>
  );
}

function SheetSpec({ label, value }) {
  return (
    <View style={styles.sheetSpec}>
      <Text style={styles.sheetSpecValue}>{value}</Text>
      <Text style={styles.sheetSpecLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cardMuted },
  topBar: { position: 'absolute', top: 0, left: 0, right: 0 },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  counter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...shadows.card,
  },
  counterDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success, marginRight: spacing.sm },
  counterText: { ...typography.small, fontWeight: '600', color: colors.text },
  filterButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
  filterCount: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  filterCountText: { ...typography.caption, color: '#1A1206', fontSize: 10 },
  errorWrap: { paddingHorizontal: spacing.lg, marginTop: spacing.sm },
  mapActions: { position: 'absolute', right: spacing.lg, bottom: spacing.xxl },
  mapButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    ...shadows.card,
  },
  sheetContent: { padding: spacing.lg, paddingBottom: spacing.xxl },
  sheetHeader: { flexDirection: 'row', alignItems: 'center' },
  sheetIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetTitles: { flex: 1, marginLeft: spacing.md },
  sheetTitle: { ...typography.h2, color: colors.text },
  sheetSubtitle: { ...typography.small, color: colors.textMuted, marginTop: 2 },
  sheetDistance: { ...typography.small, color: colors.textMuted, fontWeight: '600' },
  sheetBadge: { marginTop: spacing.md },
  sheetSpecs: {
    flexDirection: 'row',
    backgroundColor: colors.cardMuted,
    borderRadius: radii.md,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  sheetSpec: { flex: 1, alignItems: 'center' },
  sheetSpecValue: { ...typography.bodyStrong, color: colors.text, fontWeight: '700' },
  sheetSpecLabel: { ...typography.caption, color: colors.textMuted, fontWeight: '400', marginTop: 2 },
  sheetSectionTitle: { ...typography.h3, color: colors.text, marginTop: spacing.xl, marginBottom: spacing.md },
  sheetHint: {
    ...typography.small,
    color: colors.textMuted,
    marginTop: spacing.lg,
    lineHeight: 19,
  },
  sheetAction: { marginTop: spacing.lg },
  filterLabel: {
    ...typography.small,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  segments: { paddingHorizontal: 0 },
});
