import { create } from 'zustand';
import { notificationApi } from '../api/endpoints';

const PAGE_SIZE = 30;

export const useNotificationStore = create((set, get) => ({
  items: [],
  loading: false,
  loadingMore: false,
  hasMore: false,
  error: null,

  load: async () => {
    set({ loading: true, error: null });
    try {
      const items = await notificationApi.list({ take: PAGE_SIZE });
      // Une page pleine signale qu'il en reste probablement d'autres : le
      // serveur ne renvoie pas de total, seul le curseur fait foi.
      set({ items, hasMore: items.length === PAGE_SIZE, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  // Sans ce curseur, la liste s'arretait a la premiere page et les plus
  // anciennes notifications etaient inatteignables.
  loadMore: async () => {
    const { items, loading, loadingMore, hasMore } = get();
    if (loading || loadingMore || !hasMore || items.length === 0) return;

    set({ loadingMore: true });
    try {
      const older = await notificationApi.list({
        take: PAGE_SIZE,
        before: items[items.length - 1].createdAt,
      });

      // Une notification arrivee par websocket pendant l'appel est deja en
      // tete : on la compare a la liste telle qu'elle est maintenant.
      const current = get().items;
      const known = new Set(current.map((n) => n.id));
      const fresh = older.filter((n) => !known.has(n.id));

      set({
        items: [...current, ...fresh],
        hasMore: older.length === PAGE_SIZE,
        loadingMore: false,
      });
    } catch (error) {
      set({ error: error.message, loadingMore: false });
    }
  },

  receive: (notification) => {
    if (get().items.some((n) => n.id === notification.id)) return;
    set({ items: [notification, ...get().items] });
  },

  markAllRead: async () => {
    const previous = get().items;
    const unread = previous.filter((n) => !n.readAt);
    if (unread.length === 0) return;

    const now = new Date().toISOString();
    set({ items: previous.map((n) => (n.readAt ? n : { ...n, readAt: now })), error: null });

    try {
      await notificationApi.markAllRead();
    } catch (error) {
      // Sans restauration, la pastille disparaissait alors que le serveur avait
      // refuse : les notifications revenaient non lues au rechargement suivant.
      // On ne restaure que les lignes concernees, pour ne pas perdre celles
      // arrivees entre-temps.
      const rollback = new Set(unread.map((n) => n.id));
      set({
        items: get().items.map((n) => (rollback.has(n.id) ? { ...n, readAt: null } : n)),
        error: error.message,
      });
    }
  },

  unreadCount: () => get().items.filter((n) => !n.readAt).length,

  clear: () => set({ items: [], hasMore: false, error: null }),
}));
