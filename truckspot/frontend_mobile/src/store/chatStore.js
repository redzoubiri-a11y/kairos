import { create } from 'zustand';
import { chatApi } from '../api/endpoints';
import { emit } from '../api/socket';

export const useChatStore = create((set, get) => ({
  // { [missionId]: Message[] }
  threads: {},
  loading: false,
  sending: false,
  error: null,
  typingIn: null,

  messagesFor: (missionId) => get().threads[missionId] ?? [],

  loadHistory: async (missionId) => {
    set({ loading: true, error: null });
    try {
      const items = await chatApi.history(missionId, { limit: 100 });
      set({ threads: { ...get().threads, [missionId]: items }, loading: false });
      chatApi.markRead(missionId).catch(() => {});
    } catch (error) {
      set({ error: error.message, loading: false });
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
    delete threads[missionId];
    set({ threads });
  },
}));
