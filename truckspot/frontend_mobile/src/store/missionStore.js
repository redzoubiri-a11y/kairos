import { create } from 'zustand';
import { missionApi } from '../api/endpoints';

export const useMissionStore = create((set, get) => ({
  items: [],
  loading: false,
  refreshing: false,
  error: null,
  statusFilter: null,

  setStatusFilter: (statusFilter) => {
    set({ statusFilter });
    return get().load();
  },

  load: async ({ refreshing = false } = {}) => {
    set(refreshing ? { refreshing: true } : { loading: true, error: null });
    try {
      const { items } = await missionApi.list({ status: get().statusFilter, limit: 50 });
      set({ items, loading: false, refreshing: false });
    } catch (error) {
      set({ error: error.message, loading: false, refreshing: false });
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
      set({ items: [mission, ...items] });
    } else {
      const next = [...items];
      next[index] = mission;
      set({ items: next });
    }
  },

  byId: (id) => get().items.find((m) => m.id === id) ?? null,

  pendingCount: () => get().items.filter((m) => m.status === 'PENDING').length,
}));
