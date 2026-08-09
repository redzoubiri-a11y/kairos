import { create } from 'zustand';
import { chatApi } from '../api/endpoints';
import { emit } from '../api/socket';

const PAGE_SIZE = 50;

export const useChatStore = create((set, get) => ({
  // { [missionId]: Message[] }
  threads: {},
  // { [missionId]: boolean } — une page pleine laisse supposer un debut de
  // conversation encore non charge.
  hasMore: {},
  loading: false,
  loadingOlder: false,
  sending: false,
  error: null,
  typingIn: null,

  messagesFor: (missionId) => get().threads[missionId] ?? [],

  hasMoreFor: (missionId) => get().hasMore[missionId] ?? false,

  loadHistory: async (missionId) => {
    set({ loading: true, error: null });
    try {
      const items = await chatApi.history(missionId, { limit: PAGE_SIZE });
      set({
        threads: { ...get().threads, [missionId]: items },
        hasMore: { ...get().hasMore, [missionId]: items.length === PAGE_SIZE },
        loading: false,
      });
      chatApi.markRead(missionId).catch(() => {});
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  // Le serveur accepte un curseur `before` mais rien ne s'en servait : au-dela
  // de PAGE_SIZE messages, le debut de la conversation etait perdu.
  loadOlder: async (missionId) => {
    const thread = get().threads[missionId] ?? [];
    if (get().loadingOlder || !get().hasMore[missionId] || thread.length === 0) return;

    set({ loadingOlder: true });
    try {
      const older = await chatApi.history(missionId, {
        limit: PAGE_SIZE,
        before: thread[0].createdAt,
      });

      // Un message recu pendant l'appel s'est ajoute en fin de fil : on compare
      // a l'etat courant, pas a celui d'avant la requete.
      const current = get().threads[missionId] ?? [];
      const known = new Set(current.map((m) => m.id));
      const fresh = older.filter((m) => !known.has(m.id));

      set({
        threads: { ...get().threads, [missionId]: [...fresh, ...current] },
        hasMore: { ...get().hasMore, [missionId]: older.length === PAGE_SIZE },
        loadingOlder: false,
      });
    } catch (error) {
      set({ error: error.message, loadingOlder: false });
    }
  },

  // Deduplicates by id so a websocket echo never renders twice.
  receive: (message) => {
    const thread = get().threads[message.missionId] ?? [];
    if (thread.some((m) => m.id === message.id)) return;
    set({ threads: { ...get().threads, [message.missionId]: [...thread, message] } });
  },

  send: async (missionId, content) => {
    const trimmed = content.trim();
    if (!trimmed) return;
    set({ sending: true, error: null });
    try {
      const message = await chatApi.send(missionId, trimmed);
      get().receive(message);
      set({ sending: false });
      return message;
    } catch (error) {
      set({ error: error.message, sending: false });
      throw error;
    }
  },

  notifyTyping: (missionId) => emit('chat:typing', { missionId }),

  setTypingIn: (missionId) => {
    set({ typingIn: missionId });
    setTimeout(() => {
      if (get().typingIn === missionId) set({ typingIn: null });
    }, 2500);
  },

  clearThread: (missionId) => {
    const threads = { ...get().threads };
    const hasMore = { ...get().hasMore };
    delete threads[missionId];
    delete hasMore[missionId];
    set({ threads, hasMore });
  },
}));
