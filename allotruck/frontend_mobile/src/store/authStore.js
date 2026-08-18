import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi, transporterApi } from '../api/endpoints';
import { setAuthToken, setUnauthorizedHandler } from '../api/client';
import { connectSocket, disconnectSocket } from '../api/socket';
import { registerForPushNotifications, unregisterPushNotifications } from '../api/push';

const TOKEN_KEY = 'allotruck.token';
const ONBOARDING_KEY = 'allotruck.onboarded';

export const useAuthStore = create((set, get) => ({
  token: null,
  user: null,
  status: 'loading', // loading | signedOut | signedIn
  onboarded: false,
  error: null,

  // Reads the persisted session and revalidates it against the API.
  bootstrap: async () => {
    setUnauthorizedHandler(() => get().signOut());
    const [token, onboarded] = await Promise.all([
      AsyncStorage.getItem(TOKEN_KEY),
      AsyncStorage.getItem(ONBOARDING_KEY),
    ]);

    if (!token) {
      set({ status: 'signedOut', onboarded: onboarded === 'true' });
      return;
    }

    setAuthToken(token);
    try {
      const user = await authApi.me();
      connectSocket(token);
      set({ token, user, status: 'signedIn', onboarded: onboarded === 'true' });
      registerForPushNotifications();
    } catch {
      await AsyncStorage.removeItem(TOKEN_KEY);
      setAuthToken(null);
      set({ token: null, user: null, status: 'signedOut', onboarded: onboarded === 'true' });
    }
  },

  completeOnboarding: async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    set({ onboarded: true });
  },

  login: async (credentials) => {
    set({ error: null });
    const { token, user } = await authApi.login(credentials);
    await AsyncStorage.setItem(TOKEN_KEY, token);
    setAuthToken(token);
    connectSocket(token);
    set({ token, user, status: 'signedIn' });
    registerForPushNotifications();
    return user;
  },

  signup: async (payload) => {
    set({ error: null });
    const { token, user } = await authApi.signup(payload);
    await AsyncStorage.setItem(TOKEN_KEY, token);
    setAuthToken(token);
    connectSocket(token);
    set({ token, user, status: 'signedIn' });
    registerForPushNotifications();
    return user;
  },

  signOut: async () => {
    // Tant que la session est valide : la route de desinscription exige un jeton.
    await unregisterPushNotifications();
    await AsyncStorage.removeItem(TOKEN_KEY);
    setAuthToken(null);
    disconnectSocket();
    set({ token: null, user: null, status: 'signedOut' });
  },

  // Le serveur invalide les jetons precedents, y compris le notre. Sans adopter
  // le remplacant qu'il renvoie, l'appel suivant partirait avec un jeton perime
  // et deconnecterait l'utilisateur qui vient simplement de changer son mot de
  // passe.
  changePassword: async ({ currentPassword, newPassword }) => {
    const result = await authApi.changePassword({ currentPassword, newPassword });
    if (result.token) {
      await AsyncStorage.setItem(TOKEN_KEY, result.token);
      setAuthToken(result.token);
      connectSocket(result.token);
      set({ token: result.token });
    }
    return result;
  },

  refreshUser: async () => {
    const user = await authApi.me();
    set({ user });
    return user;
  },

  updateProfile: async (payload) => {
    const user = await authApi.updateProfile(payload);
    set({ user });
    return user;
  },

  // Turns a client account into a transporter account.
  becomeTransporter: async (company) => {
    await transporterApi.create(company);
    return get().refreshUser();
  },

  isTransporter: () => get().user?.role === 'TRANSPORTER',
  isVerified: () => get().user?.transporter?.verificationStatus === 'VERIFIED',
}));
