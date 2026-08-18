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
  // Set by forceSignedOutAfterTimeout() when RootNavigator's 8s failsafe
  // fires. Guards every subsequent `set()` in bootstrap() so a slow (but not
  // actually stuck) bootstrap can't resolve later and clobber the forced
  // signedOut state, which would bounce a logged-in user back to the login
  // screen and then snap them back into the app.
  bootstrapTimedOut: false,

  // Reads the persisted session and revalidates it against the API.
  // Wrapped end to end: any failure here (AsyncStorage unavailable, native
  // module issue) must still leave `status`, otherwise the app is stuck on
  // the splash screen forever with no way to diagnose it remotely.
  bootstrap: async () => {
    setUnauthorizedHandler(() => get().signOut());
    try {
      // allSettled, not all: a failure reading one key (e.g. TOKEN_KEY) must
      // not discard a successful read of the other, otherwise a transient
      // AsyncStorage hiccup on the token falls through to the catch below
      // and wrongly resets a real, persisted onboarding flag to false.
      const [tokenResult, onboardedResult] = await Promise.allSettled([
        AsyncStorage.getItem(TOKEN_KEY),
        AsyncStorage.getItem(ONBOARDING_KEY),
      ]);
      const token = tokenResult.status === 'fulfilled' ? tokenResult.value : null;
      const onboarded = onboardedResult.status === 'fulfilled' && onboardedResult.value === 'true';

      if (get().bootstrapTimedOut) return;

      if (!token) {
        set({ status: 'signedOut', onboarded });
        return;
      }

      setAuthToken(token);
      try {
        const user = await authApi.me();
        if (get().bootstrapTimedOut) {
          // The failsafe already forced signedOut and cleared the client
          // while this request was in flight — undo the setAuthToken(token)
          // above instead of opening a socket for a session the UI has
          // already dismissed.
          setAuthToken(null);
          return;
        }
        connectSocket(token);
        set({ token, user, status: 'signedIn', onboarded });
        registerForPushNotifications();
      } catch {
        // removeItem is best-effort: even if it throws, the token must be
        // cleared from the in-memory API client, otherwise it keeps sending
        // a stale/rejected token on every request after this point.
        try {
          await AsyncStorage.removeItem(TOKEN_KEY);
        } catch (removeError) {
          console.error('[authStore] failed to clear stale token', removeError);
        }
        setAuthToken(null);
        if (get().bootstrapTimedOut) return;
        set({ token: null, user: null, status: 'signedOut', onboarded });
      }
    } catch (error) {
      console.error('[authStore] bootstrap failed', error);
      if (!get().bootstrapTimedOut) set({ status: 'signedOut', onboarded: false });
    }
  },

  // Called by RootNavigator's failsafe timeout when bootstrap() never
  // resolves. Reads the real persisted onboarding flag itself instead of
  // guessing false, so a returning user isn't sent back through onboarding.
  // Also tears down whatever bootstrap() may have already wired up
  // (setAuthToken/connectSocket run before its own bootstrapTimedOut check),
  // so the API client and socket don't keep a live session the UI now shows
  // as signed out.
  forceSignedOutAfterTimeout: async () => {
    set({ bootstrapTimedOut: true });
    setAuthToken(null);
    disconnectSocket();
    let onboarded = false;
    try {
      onboarded = (await AsyncStorage.getItem(ONBOARDING_KEY)) === 'true';
    } catch (error) {
      console.error('[authStore] failed to read onboarding flag on timeout', error);
    }
    set({ status: 'signedOut', onboarded });
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
