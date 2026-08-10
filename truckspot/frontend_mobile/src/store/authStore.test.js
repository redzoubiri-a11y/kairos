import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from './authStore';
import { authApi, transporterApi } from '../api/endpoints';
import { setAuthToken, setUnauthorizedHandler } from '../api/client';
import { connectSocket, disconnectSocket } from '../api/socket';
import { registerForPushNotifications, unregisterPushNotifications } from '../api/push';
import AsyncStorage from '@react-native-async-storage/async-storage';

vi.mock('../api/endpoints', () => ({
  authApi: {
    me: vi.fn(),
    login: vi.fn(),
    signup: vi.fn(),
    updateProfile: vi.fn(),
    changePassword: vi.fn(),
  },
  transporterApi: { create: vi.fn() },
}));
vi.mock('../api/client', () => ({
  setAuthToken: vi.fn(),
  setUnauthorizedHandler: vi.fn(),
}));
vi.mock('../api/socket', () => ({
  connectSocket: vi.fn(),
  disconnectSocket: vi.fn(),
}));
vi.mock('../api/push', () => ({
  registerForPushNotifications: vi.fn(() => Promise.resolve('ExponentPushToken[x]')),
  unregisterPushNotifications: vi.fn(() => Promise.resolve()),
}));

// Doublure de AsyncStorage : un simple objet suffit, les stores n'utilisent que
// getItem / setItem / removeItem.
const storage = new Map();
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn((key) => Promise.resolve(storage.has(key) ? storage.get(key) : null)),
    setItem: vi.fn((key, value) => {
      storage.set(key, value);
      return Promise.resolve();
    }),
    removeItem: vi.fn((key) => {
      storage.delete(key);
      return Promise.resolve();
    }),
  },
}));

const TOKEN_KEY = 'truckspot.token';
const ONBOARDING_KEY = 'truckspot.onboarded';

const CLIENT = { id: 'u1', fullName: 'Karim Benali', role: 'CLIENT' };
const TRANSPORTEUR = {
  id: 'u2',
  fullName: 'Sofiane Ait',
  role: 'TRANSPORTER',
  transporter: { verificationStatus: 'VERIFIED' },
};

const INITIAL = useAuthStore.getState();

beforeEach(() => {
  storage.clear();
  useAuthStore.setState({ ...INITIAL, token: null, user: null, status: 'loading' }, true);
});

describe('demarrage', () => {
  it('reste deconnecte sans jeton persiste', async () => {
    await useAuthStore.getState().bootstrap();

    const state = useAuthStore.getState();
    expect(state.status).toBe('signedOut');
    expect(connectSocket).not.toHaveBeenCalled();
  });

  it('branche le traitement des 401 avant tout appel', async () => {
    await useAuthStore.getState().bootstrap();

    expect(setUnauthorizedHandler).toHaveBeenCalled();
  });

  it('revalide le jeton persiste et ouvre la websocket', async () => {
    storage.set(TOKEN_KEY, 'jeton-valide');
    authApi.me.mockResolvedValue(CLIENT);

    await useAuthStore.getState().bootstrap();

    const state = useAuthStore.getState();
    expect(state.status).toBe('signedIn');
    expect(state.user).toEqual(CLIENT);
    expect(setAuthToken).toHaveBeenCalledWith('jeton-valide');
    expect(connectSocket).toHaveBeenCalledWith('jeton-valide');
  });

  // Un jeton expire pendant que l'application etait fermee ne doit pas laisser
  // l'utilisateur devant un ecran qui echoue a chaque appel.
  it('purge un jeton que le serveur refuse', async () => {
    storage.set(TOKEN_KEY, 'jeton-perime');
    authApi.me.mockRejectedValue(new Error('Session expiree'));

    await useAuthStore.getState().bootstrap();

    const state = useAuthStore.getState();
    expect(state.status).toBe('signedOut');
    expect(state.token).toBeNull();
    expect(storage.has(TOKEN_KEY)).toBe(false);
    expect(setAuthToken).toHaveBeenCalledWith(null);
  });

  it('retient que l introduction a deja ete vue', async () => {
    storage.set(ONBOARDING_KEY, 'true');

    await useAuthStore.getState().bootstrap();

    expect(useAuthStore.getState().onboarded).toBe(true);
  });
});

describe('connexion', () => {
  it('persiste le jeton et ouvre la session', async () => {
    authApi.login.mockResolvedValue({ token: 'jeton-neuf', user: CLIENT });

    const user = await useAuthStore.getState().login({ email: 'a@b.dz', password: 'x' });

    expect(user).toEqual(CLIENT);
    expect(storage.get(TOKEN_KEY)).toBe('jeton-neuf');
    expect(useAuthStore.getState().status).toBe('signedIn');
    expect(registerForPushNotifications).toHaveBeenCalled();
  });

  it('laisse remonter un echec de connexion sans ouvrir de session', async () => {
    authApi.login.mockRejectedValue(new Error('Identifiants invalides'));

    await expect(useAuthStore.getState().login({ email: 'a@b.dz', password: 'x' })).rejects.toThrow(
      'Identifiants invalides'
    );

    expect(useAuthStore.getState().status).toBe('loading');
    expect(storage.has(TOKEN_KEY)).toBe(false);
    expect(connectSocket).not.toHaveBeenCalled();
  });

  it('ouvre la session apres une inscription', async () => {
    authApi.signup.mockResolvedValue({ token: 'jeton-inscrit', user: TRANSPORTEUR });

    await useAuthStore.getState().signup({ email: 'c@d.dz', password: 'x', fullName: 'S' });

    expect(useAuthStore.getState().status).toBe('signedIn');
    expect(connectSocket).toHaveBeenCalledWith('jeton-inscrit');
  });
});

describe('deconnexion', () => {
  // La route de desinscription exige un jeton : la desinscription push doit
  // partir avant que le jeton ne soit efface, sinon l'appareil garde ses push.
  it('desinscrit l appareil avant d effacer le jeton', async () => {
    storage.set(TOKEN_KEY, 'jeton-valide');
    useAuthStore.setState({ token: 'jeton-valide', user: CLIENT, status: 'signedIn' });

    const ordre = [];
    unregisterPushNotifications.mockImplementation(async () => {
      ordre.push('desinscription');
    });
    AsyncStorage.removeItem.mockImplementation(async (key) => {
      ordre.push(`oubli:${key}`);
      storage.delete(key);
    });

    await useAuthStore.getState().signOut();

    expect(ordre).toEqual(['desinscription', `oubli:${TOKEN_KEY}`]);
  });

  it('ferme la session et la websocket', async () => {
    useAuthStore.setState({ token: 'jeton-valide', user: CLIENT, status: 'signedIn' });

    await useAuthStore.getState().signOut();

    const state = useAuthStore.getState();
    expect(state.status).toBe('signedOut');
    expect(state.token).toBeNull();
    expect(state.user).toBeNull();
    expect(disconnectSocket).toHaveBeenCalled();
    expect(setAuthToken).toHaveBeenCalledWith(null);
  });
});

describe('changement de mot de passe', () => {
  // Le serveur invalide les jetons precedents, y compris celui de la session en
  // cours. Sans adopter le remplacant, l'appel suivant repartait avec un jeton
  // perime et deconnectait celui qui venait de changer son mot de passe.
  it('adopte le jeton de remplacement', async () => {
    useAuthStore.setState({ token: 'ancien', user: CLIENT, status: 'signedIn' });
    authApi.changePassword.mockResolvedValue({ success: true, token: 'nouveau' });

    await useAuthStore.getState().changePassword({
      currentPassword: 'x',
      newPassword: 'yyyyyyyy',
    });

    expect(useAuthStore.getState().token).toBe('nouveau');
    expect(storage.get(TOKEN_KEY)).toBe('nouveau');
    expect(setAuthToken).toHaveBeenCalledWith('nouveau');
    // La websocket porte le jeton dans son handshake : elle doit repartir aussi.
    expect(connectSocket).toHaveBeenCalledWith('nouveau');
  });

  it('garde la session en place si le serveur ne renvoie pas de jeton', async () => {
    useAuthStore.setState({ token: 'ancien', user: CLIENT, status: 'signedIn' });
    authApi.changePassword.mockResolvedValue({ success: true });

    await useAuthStore.getState().changePassword({
      currentPassword: 'x',
      newPassword: 'yyyyyyyy',
    });

    expect(useAuthStore.getState().token).toBe('ancien');
  });

  it('laisse remonter un mot de passe actuel errone', async () => {
    useAuthStore.setState({ token: 'ancien', user: CLIENT, status: 'signedIn' });
    authApi.changePassword.mockRejectedValue(new Error('Mot de passe actuel incorrect'));

    await expect(
      useAuthStore.getState().changePassword({ currentPassword: 'faux', newPassword: 'yyyyyyyy' })
    ).rejects.toThrow('Mot de passe actuel incorrect');

    expect(useAuthStore.getState().token).toBe('ancien');
  });
});

describe('profil', () => {
  it('remplace l utilisateur apres une mise a jour', async () => {
    useAuthStore.setState({ user: CLIENT, status: 'signedIn' });
    authApi.updateProfile.mockResolvedValue({ ...CLIENT, fullName: 'Karim B.' });

    await useAuthStore.getState().updateProfile({ fullName: 'Karim B.' });

    expect(useAuthStore.getState().user.fullName).toBe('Karim B.');
  });

  it('recharge le profil apres la creation du compte transporteur', async () => {
    useAuthStore.setState({ user: CLIENT, status: 'signedIn' });
    transporterApi.create.mockResolvedValue({ id: 'p1' });
    authApi.me.mockResolvedValue(TRANSPORTEUR);

    const user = await useAuthStore.getState().becomeTransporter({ companyName: 'Ait Transport' });

    expect(transporterApi.create).toHaveBeenCalledWith({ companyName: 'Ait Transport' });
    expect(user.role).toBe('TRANSPORTER');
    expect(useAuthStore.getState().isTransporter()).toBe(true);
  });

  it('distingue un transporteur verifie d un transporteur en attente', () => {
    useAuthStore.setState({ user: TRANSPORTEUR });
    expect(useAuthStore.getState().isVerified()).toBe(true);

    useAuthStore.setState({
      user: { ...TRANSPORTEUR, transporter: { verificationStatus: 'PENDING' } },
    });
    expect(useAuthStore.getState().isVerified()).toBe(false);

    useAuthStore.setState({ user: CLIENT });
    expect(useAuthStore.getState().isVerified()).toBe(false);
  });

  it('marque l introduction comme vue une bonne fois', async () => {
    await useAuthStore.getState().completeOnboarding();

    expect(storage.get(ONBOARDING_KEY)).toBe('true');
    expect(useAuthStore.getState().onboarded).toBe(true);
  });
});
