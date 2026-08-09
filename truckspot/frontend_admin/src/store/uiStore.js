import { create } from 'zustand';

let nextId = 0;

export const useUiStore = create((set, get) => ({
  toasts: [],
  pendingRequests: 0,

  pushToast: (message, variant = 'info', duration = 4500) => {
    const id = ++nextId;
    set((state) => ({ toasts: [...state.toasts, { id, message, variant }] }));
    setTimeout(() => get().dismissToast(id), duration);
    return id;
  },

  dismissToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),

  startLoading: () => set((state) => ({ pendingRequests: state.pendingRequests + 1 })),
  stopLoading: () =>
    set((state) => ({ pendingRequests: Math.max(0, state.pendingRequests - 1) })),
}));

export const toastSuccess = (message) => useUiStore.getState().pushToast(message, 'success');
export const toastError = (message) => useUiStore.getState().pushToast(message, 'error');
