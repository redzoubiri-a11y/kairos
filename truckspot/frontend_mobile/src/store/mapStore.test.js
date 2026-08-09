import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useMapStore } from './mapStore';
import { truckApi, tripApi } from '../api/endpoints';

vi.mock('../api/endpoints', () => ({
  truckApi: { available: vi.fn() },
  tripApi: { list: vi.fn() },
}));

function truck(id, overrides = {}) {
  return { id, latitude: 36.75, longitude: 3.05, isAvailable: true, volumeM3: 20, ...overrides };
}

function trip(id, truckId, overrides = {}) {
  return { id, truck: { id: truckId }, goodsTypes: ['Palettes'], ...overrides };
}

const INITIAL = useMapStore.getState();

beforeEach(() => {
  useMapStore.setState({ ...INITIAL, trucks: [], trips: [], center: null }, true);
  truckApi.available.mockResolvedValue([]);
  tripApi.list.mockResolvedValue({ items: [] });
});

describe('recherche', () => {
  it('interroge les camions et les trajets en parallele', async () => {
    truckApi.available.mockResolvedValue([truck('t1')]);
    tripApi.list.mockResolvedValue({ items: [trip('v1', 't1')] });

    await useMapStore.getState().refresh();

    const state = useMapStore.getState();
    expect(state.trucks).toHaveLength(1);
    expect(state.trips).toHaveLength(1);
    expect(state.loading).toBe(false);
  });

  it('joint la position et le rayon quand un centre est connu', async () => {
    useMapStore.setState({ center: { latitude: 36.75, longitude: 3.05 } });

    await useMapStore.getState().refresh();

    expect(truckApi.available).toHaveBeenCalledWith(
      expect.objectContaining({ latitude: 36.75, longitude: 3.05, radiusKm: 100 })
    );
  });

  it('omet la position tant que le centre est inconnu', async () => {
    await useMapStore.getState().refresh();

    const params = truckApi.available.mock.calls[0][0];
    expect(params.latitude).toBeUndefined();
    expect(params.longitude).toBeUndefined();
  });

  it("expose l'erreur sans laisser la carte en chargement", async () => {
    truckApi.available.mockRejectedValue(new Error('Reseau indisponible'));

    await useMapStore.getState().refresh();

    expect(useMapStore.getState().error).toBe('Reseau indisponible');
    expect(useMapStore.getState().loading).toBe(false);
  });
});

describe('filtre marchandise', () => {
  // Un camion ne porte pas de type de marchandise, seuls ses trajets en portent :
  // sans ce croisement, la carte afficherait des camions hors sujet.
  it('ne garde que les camions rattaches a un trajet correspondant', async () => {
    truckApi.available.mockResolvedValue([truck('t1'), truck('t2')]);
    tripApi.list.mockResolvedValue({ items: [trip('v1', 't1')] });
    useMapStore.setState({ filters: { ...INITIAL.filters, goodsType: 'Palettes' } });

    await useMapStore.getState().refresh();

    expect(useMapStore.getState().trucks.map((t) => t.id)).toEqual(['t1']);
  });

  it('conserve tous les camions sans filtre marchandise', async () => {
    truckApi.available.mockResolvedValue([truck('t1'), truck('t2')]);
    tripApi.list.mockResolvedValue({ items: [trip('v1', 't1')] });

    await useMapStore.getState().refresh();

    expect(useMapStore.getState().trucks.map((t) => t.id)).toEqual(['t1', 't2']);
  });

  it('relance la recherche a chaque changement de filtre', async () => {
    await useMapStore.getState().setFilters({ type: 'FRIGO' });

    expect(useMapStore.getState().filters.type).toBe('FRIGO');
    expect(truckApi.available).toHaveBeenCalledWith(expect.objectContaining({ type: 'FRIGO' }));
  });

  it('remet les filtres a leur valeur par defaut', async () => {
    useMapStore.setState({
      filters: { ...INITIAL.filters, type: 'FRIGO', city: 'Oran', minVolumeM3: 40 },
    });

    await useMapStore.getState().resetFilters();

    const { filters } = useMapStore.getState();
    expect(filters.type).toBeUndefined();
    expect(filters.city).toBeUndefined();
    expect(filters.minVolumeM3).toBeUndefined();
    expect(filters.radiusKm).toBe(100);
  });
});

describe('position temps reel', () => {
  it('deplace le camion concerne sans toucher aux autres', () => {
    useMapStore.setState({ trucks: [truck('t1'), truck('t2')] });

    useMapStore.getState().applyPosition({
      truckId: 't1',
      latitude: 36.9,
      longitude: 3.2,
      isAvailable: true,
      lastPositionAt: '2026-08-09T10:00:00.000Z',
    });

    const trucks = useMapStore.getState().trucks;
    expect(trucks.find((t) => t.id === 't1').latitude).toBe(36.9);
    expect(trucks.find((t) => t.id === 't2').latitude).toBe(36.75);
  });

  // Un transporteur qui se met en indisponible doit disparaitre de la carte.
  it('retire de la carte un camion devenu indisponible', () => {
    useMapStore.setState({ trucks: [truck('t1'), truck('t2')] });

    useMapStore.getState().applyPosition({
      truckId: 't1',
      latitude: 36.9,
      longitude: 3.2,
      isAvailable: false,
    });

    expect(useMapStore.getState().trucks.map((t) => t.id)).toEqual(['t2']);
  });

  it('ignore un camion absent de la carte', () => {
    useMapStore.setState({ trucks: [truck('t1')] });

    useMapStore.getState().applyPosition({
      truckId: 'inconnu',
      latitude: 0,
      longitude: 0,
      isAvailable: true,
    });

    expect(useMapStore.getState().trucks.map((t) => t.id)).toEqual(['t1']);
  });
});

describe('selection', () => {
  it('retrouve le camion selectionne et ses trajets', () => {
    useMapStore.setState({
      trucks: [truck('t1'), truck('t2')],
      trips: [trip('v1', 't1'), trip('v2', 't2'), trip('v3', 't1')],
      selectedTruckId: 't1',
    });

    expect(useMapStore.getState().selectedTruck().id).toBe('t1');
    expect(useMapStore.getState().tripsForTruck('t1').map((t) => t.id)).toEqual(['v1', 'v3']);
  });

  it('renvoie null quand rien n est selectionne', () => {
    useMapStore.setState({ trucks: [truck('t1')], selectedTruckId: null });

    expect(useMapStore.getState().selectedTruck()).toBeNull();
  });
});
