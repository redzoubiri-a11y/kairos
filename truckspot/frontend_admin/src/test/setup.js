import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach } from 'vitest';

import { useAuthStore } from '../store/authStore';
import { useUiStore } from '../store/uiStore';

// Les stores zustand sont des singletons de module : sans remise a zero, une
// session laissee par un test ferait passer ou echouer le suivant.
beforeEach(() => {
  localStorage.clear();
  useAuthStore.setState({ token: null, user: null });
  useUiStore.setState({ toasts: [], pendingRequests: 0 });
});

afterEach(() => {
  cleanup();
});
