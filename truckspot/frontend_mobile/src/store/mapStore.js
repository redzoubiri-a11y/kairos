import { create } from 'zustand';
import { truckApi, tripApi } from '../api/endpoints';

const DEFAULT_FILTERS = {
  minVolumeM3: undefined,
  type: undefined,
  city: undefined,
  goodsType: undefined,
  radiusKm: 100,
};

export const useMapStore = create((set, get) => ({
  trucks: [],
  trips: [],
  filters: { ...DEFAULT_FILTERS },
  selectedTruckId: null,
  center: null,
  loading: false,
  error: null,

  setCenter: (center) => set({ center }),
  selectTruck: (truckId) => set({ selectedTruckId: truckId }),
  clearSelection: () => set({ selectedTruckId: null }),

  setFilters: (patch) => {
    set({ filters: { ...get().filters, ...patch } });
    return get().refresh();
  },

  resetFilters: () => {
    set({ filters: { ...DEFAULT_FILTERS } });
    return get().refresh();
  },

  refresh: async () => {
    const { center, filters } = get();
    set({ loading: true, error: null });
    try {
      const geo = center
        ? { latitude: center.latitude, longitude: center.longitude, radiusKm: filters.radiusKm }
        : {};

      const [trucks, trips] = await Promise.all([
        truckApi.available({
          minVolumeM3: filters.minVolumeM3,
          type: filters.type,
          city: filters.city,
          ...geo,
        }),
        tripApi.list({
          minFreeVolumeM3: filters.minVolumeM3,
          goodsType: filters.goodsType,
          originCity: filters.city,
          limit: 50,
          ...geo,
        }),
      ]);

      set({ trucks, trips: trips.items, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  // Applied from the `truck:position` websocket event.
  applyPosition: ({ truckId, latitude, longitude, isAvailable, lastPositionAt }) => {
    set({
      trucks: get()
        .trucks.map((t) =>
          t.id === truckId ? { ...t, latitude, longitude, isAvailable, lastPositionAt } : t
        )
        .filter((t) => t.isAvailable),
    });
  },

  selectedTruck: () => get().trucks.find((t) => t.id === get().selectedTruckId) ?? null,

  tripsForTruck: (truckId) => get().trips.filter((trip) => trip.truck?.id === truckId),
}));
