import { create } from 'zustand';
import { missionApi } from '../api/endpoints';

const PAGE_SIZE = 20;

export const useMissionStore = create((set, get) => ({
  items: [],
  loading: false,
  refreshing: false,
  loadingMore: false,
  error: null,
  statusFilter: null,
  page: 1,
  pages: 1,
  total: 0,

  setStatusFilter: (statusFilter) => {
    set({ statusFilter });
    return get().load();
  },

  // Recharge depuis la premiere page : un changement de filtre ou un
  // rafraichissement ne doit pas conserver les pages de l'ancienne liste.
  load: async ({ refreshing = false } = {}) => {
    set(refreshing ? { refreshing: true } : { loading: true, error: null });
    try {
      const result = await missionApi.list({
        status: get().statusFilter,
        page: 1,
        limit: PAGE_SIZE,
      });
      set({
        items: result.items,
        page: result.page,
        pages: result.pages,
        total: result.total,
        loading: false,
        refreshing: false,
      });
    } catch (error) {
      set({ error: error.message, loading: false, refreshing: false });
    }
  },

  // Sans cela, une liste depassant une page etait tronquee en silence.
  loadMore: async () => {
    const { page, pages, loading, loadingMore, refreshing, statusFilter } = get();
    if (loading || loadingMore || refreshing || page >= pages) return;

    set({ loadingMore: true });
    try {
      const result = await missionApi.list({
        status: statusFilter,
        page: page + 1,
        limit: PAGE_SIZE,
      });

      // Une mission arrivee par websocket entre-temps decale la pagination du
      // serveur : on ecarte les identifiants deja presents.
      const known = new Set(get().items.map((m) => m.id));
      const fresh = result.items.filter((m) => !known.has(m.id));

      set({
        items: [...get().items, ...fresh],
        page: result.page,
        pages: result.pages,
        total: result.total,
        loadingMore: false,
      });
    } catch (error) {
      set({ error: error.message, loadingMore: false });
    }
  },

  updateStatus: async (missionId, status, reason) => {
    const updated = await missionApi.updateStatus(missionId, status, reason);
    get().upsert(updated);
    return updated;
  },

  // Also used by the `mission:new` / `mission:updated` websocket events.
  upsert: (mission) => {
    const items = get().items;
    const index = items.findIndex((m) => m.id === mission.id);
    if (index === -1) {
      set({ items: [mission, ...items], total: get().total + 1 });
    } else {
      const next = [...items];
      next[index] = mission;
      set({ items: next });
    }
  },

  byId: (id) => get().items.find((m) => m.id === id) ?? null,

  pendingCount: () => get().items.filter((m) => m.status === 'PENDING').length,
}));
