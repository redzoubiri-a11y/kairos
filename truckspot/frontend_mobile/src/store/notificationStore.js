import { create } from 'zustand';
import { notificationApi } from '../api/endpoints';

export const useNotificationStore = create((set, get) => ({
  items: [],
  loading: false,
  error: null,

  load: async () => {
    set({ loading: true, error: null });
    try {
      const items = await notificationApi.list({ take: 50 });
      set({ items, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  receive: (notification) => {
    if (get().items.some((n) => n.id === notification.id)) return;
    set({ items: [notification, ...get().items] });
  },

  markAllRead: async () => {
    const now = new Date().toISOString();
    set({ items: get().items.map((n) => (n.readAt ? n : { ...n, readAt: now })) });
    await notificationApi.markAllRead();
  },

  unreadCount: () => get().items.filter((n) => !n.readAt).length,

  clear: () => set({ items: [] }),
}));
