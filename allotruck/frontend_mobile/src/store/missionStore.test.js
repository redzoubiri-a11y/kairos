import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useMissionStore } from './missionStore';
import { missionApi } from '../api/endpoints';

vi.mock('../api/endpoints', () => ({
  missionApi: { list: vi.fn(), updateStatus: vi.fn() },
}));

function mission(id, overrides = {}) {
  return { id, status: 'PENDING', pickupCity: 'Alger', dropoffCity: 'Oran', ...overrides };
}

function page(items, { page = 1, pages = 1, total = items.length } = {}) {
  return { items, page, pages, total, limit: 20 };
}

const INITIAL = useMissionStore.getState();

beforeEach(() => {
  useMissionStore.setState(
    { ...INITIAL, items: [], page: 1, pages: 1, total: 0, statusFilter: null },
    true
  );
});

describe('chargement', () => {
  it('retient la pagination renvoyee par le serveur', async () => {
    missionApi.list.mockResolvedValue(page([mission('m1')], { pages: 3, total: 45 }));

    await useMissionStore.getState().load();

    const state = useMissionStore.getState();
    expect(state.items).toHaveLength(1);
    expect(state.pages).toBe(3);
    expect(state.total).toBe(45);
    expect(state.loading).toBe(false);
  });

  it('demande toujours la premiere page', async () => {
    missionApi.list.mockResolvedValue(page([]));
    useMissionStore.setState({ page: 4 });

    await useMissionStore.getState().load();

    expect(missionApi.list).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, limit: 20 })
    );
  });

  it("expose l'erreur sans laisser l'ecran en chargement", async () => {
    missionApi.list.mockRejectedValue(new Error("Impossible de joindre le serveur."));

    await useMissionStore.getState().load();

    const state = useMissionStore.getState();
    expect(state.error).toMatch(/impossible de joindre/i);
    expect(state.loading).toBe(false);
    expect(state.refreshing).toBe(false);
  });

  it('repart de la premiere page quand le filtre change', async () => {
    missionApi.list.mockResolvedValue(page([mission('m9')]));
    useMissionStore.setState({ items: [mission('ancien')], page: 3, pages: 5 });

    await useMissionStore.getState().setStatusFilter('ACCEPTED');

    expect(missionApi.list).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'ACCEPTED', page: 1 })
    );
    expect(useMissionStore.getState().items.map((m) => m.id)).toEqual(['m9']);
  });
});

describe('pagination', () => {
  // Le defaut corrige : au-dela d'une page, la liste etait tronquee en silence.
  it('ajoute la page suivante a la suite', async () => {
    useMissionStore.setState({ items: [mission('m1')], page: 1, pages: 2, total: 2 });
    missionApi.list.mockResolvedValue(page([mission('m2')], { page: 2, pages: 2, total: 2 }));

    await useMissionStore.getState().loadMore();

    const state = useMissionStore.getState();
    expect(state.items.map((m) => m.id)).toEqual(['m1', 'm2']);
    expect(state.page).toBe(2);
    expect(state.loadingMore).toBe(false);
  });

  it("n'appelle pas le serveur sur la derniere page", async () => {
    useMissionStore.setState({ items: [mission('m1')], page: 2, pages: 2 });

    await useMissionStore.getState().loadMore();

    expect(missionApi.list).not.toHaveBeenCalled();
  });

  it('ignore une demande pendant un chargement en cours', async () => {
    useMissionStore.setState({ items: [], page: 1, pages: 3, loading: true });
    await useMissionStore.getState().loadMore();
    expect(missionApi.list).not.toHaveBeenCalled();

    useMissionStore.setState({ loading: false, loadingMore: true });
    await useMissionStore.getState().loadMore();
    expect(missionApi.list).not.toHaveBeenCalled();
  });

  // Une mission arrivee par websocket decale la pagination du serveur et fait
  // reapparaitre un element deja affiche sur la page suivante.
  it('ecarte les doublons introduits par un decalage de pagination', async () => {
    useMissionStore.setState({ items: [mission('m1'), mission('m2')], page: 1, pages: 2 });
    missionApi.list.mockResolvedValue(
      page([mission('m2'), mission('m3')], { page: 2, pages: 2, total: 3 })
    );

    await useMissionStore.getState().loadMore();

    expect(useMissionStore.getState().items.map((m) => m.id)).toEqual(['m1', 'm2', 'm3']);
  });

  it('ne perd pas la liste deja chargee si la page suivante echoue', async () => {
    useMissionStore.setState({ items: [mission('m1')], page: 1, pages: 2 });
    missionApi.list.mockRejectedValue(new Error('Delai depasse'));

    await useMissionStore.getState().loadMore();

    const state = useMissionStore.getState();
    expect(state.items.map((m) => m.id)).toEqual(['m1']);
    expect(state.error).toBe('Delai depasse');
    expect(state.loadingMore).toBe(false);
  });
});

describe('upsert', () => {
  // Utilise par les evenements websocket mission:new et mission:updated.
  it('insere une mission inconnue en tete et incremente le total', () => {
    useMissionStore.setState({ items: [mission('m1')], total: 1 });

    useMissionStore.getState().upsert(mission('m2'));

    const state = useMissionStore.getState();
    expect(state.items.map((m) => m.id)).toEqual(['m2', 'm1']);
    expect(state.total).toBe(2);
  });

  it('remplace une mission connue sans la deplacer ni gonfler le total', () => {
    useMissionStore.setState({ items: [mission('m1'), mission('m2')], total: 2 });

    useMissionStore.getState().upsert(mission('m1', { status: 'ACCEPTED' }));

    const state = useMissionStore.getState();
    expect(state.items.map((m) => m.id)).toEqual(['m1', 'm2']);
    expect(state.items[0].status).toBe('ACCEPTED');
    expect(state.total).toBe(2);
  });

  it('compte les missions en attente pour le badge', () => {
    useMissionStore.setState({
      items: [mission('m1'), mission('m2', { status: 'ACCEPTED' }), mission('m3')],
    });

    expect(useMissionStore.getState().pendingCount()).toBe(2);
  });

  it('retrouve une mission par identifiant', () => {
    useMissionStore.setState({ items: [mission('m1'), mission('m2')] });

    expect(useMissionStore.getState().byId('m2').id).toBe('m2');
    expect(useMissionStore.getState().byId('inconnu')).toBeNull();
  });
});
