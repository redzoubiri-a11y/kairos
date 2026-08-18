import { beforeEach, describe, expect, it, vi } from 'vitest';

import { realtimeHandlers } from './useRealtime';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import { useMapStore } from '../store/mapStore';
import { useMissionStore } from '../store/missionStore';
import { useNotificationStore } from '../store/notificationStore';

vi.mock('../api/socket', () => ({ on: vi.fn(), emit: vi.fn() }));
vi.mock('../api/client', () => ({ setAuthToken: vi.fn(), setUnauthorizedHandler: vi.fn() }));
vi.mock('../api/push', () => ({
  registerForPushNotifications: vi.fn(),
  unregisterPushNotifications: vi.fn(),
}));
vi.mock('../api/endpoints', () => ({
  authApi: { me: vi.fn(), login: vi.fn(), signup: vi.fn(), updateProfile: vi.fn() },
  transporterApi: { create: vi.fn() },
  missionApi: { list: vi.fn(), updateStatus: vi.fn() },
  chatApi: { history: vi.fn(), send: vi.fn(), markRead: vi.fn() },
  truckApi: { available: vi.fn() },
  tripApi: { list: vi.fn() },
  notificationApi: { list: vi.fn(), markAllRead: vi.fn() },
}));
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: { getItem: vi.fn(), setItem: vi.fn(), removeItem: vi.fn() },
}));

// Liste relevee dans le backend : tout ce que le serveur pousse au client.
// `connected` est un accuse de handshake, il ne porte aucun etat.
const EVENEMENTS_SERVEUR = [
  'mission:new',
  'mission:updated',
  'chat:message',
  'chat:inbox',
  'chat:typing',
  'chat:read',
  'notification:new',
  'truck:position',
  'transporter:verification',
];

beforeEach(() => {
  useChatStore.setState({ threads: {}, hasMore: {}, typingIn: null });
  useMissionStore.setState({ items: [], total: 0 });
  useNotificationStore.setState({ items: [] });
  useMapStore.setState({ trucks: [] });
});

describe('couverture des evenements', () => {
  // Le defaut qui a motive ce test : chat:read etait emis depuis le debut sans
  // que rien ne l'ecoute, et personne ne s'en apercevait.
  it('branche tous les evenements pousses par le serveur', () => {
    expect(Object.keys(realtimeHandlers).sort()).toEqual([...EVENEMENTS_SERVEUR].sort());
  });

  it("n'ecoute rien que le serveur n'emette", () => {
    const inconnus = Object.keys(realtimeHandlers).filter((e) => !EVENEMENTS_SERVEUR.includes(e));
    expect(inconnus).toEqual([]);
  });
});

describe('acheminement vers les stores', () => {
  it('range une mission poussee dans la liste', () => {
    realtimeHandlers['mission:new']({ id: 'm1', status: 'PENDING' });

    expect(useMissionStore.getState().items.map((m) => m.id)).toEqual(['m1']);
  });

  it('range un message dans sa conversation', () => {
    realtimeHandlers['chat:message']({ id: 'c1', missionId: 'mission-1', senderId: 'u1' });

    expect(useChatStore.getState().messagesFor('mission-1')).toHaveLength(1);
  });

  // Le meme message arrive par le salon et par le canal personnel : la
  // deduplication du store doit tenir sur les deux chemins.
  it('ne double pas un message recu par les deux canaux', () => {
    const message = { id: 'c1', missionId: 'mission-1', senderId: 'u1' };
    realtimeHandlers['chat:message'](message);
    realtimeHandlers['chat:inbox'](message);

    expect(useChatStore.getState().messagesFor('mission-1')).toHaveLength(1);
  });

  it('allume la double coche a la lecture de l autre partie', () => {
    useChatStore.setState({
      threads: { 'mission-1': [{ id: 'c1', missionId: 'mission-1', senderId: 'moi' }] },
    });

    realtimeHandlers['chat:read']({ missionId: 'mission-1', readerId: 'lui' });

    expect(useChatStore.getState().messagesFor('mission-1')[0].readAt).toBeTruthy();
  });

  it('range une notification poussee en tete', () => {
    realtimeHandlers['notification:new']({ id: 'n1', readAt: null });

    expect(useNotificationStore.getState().unreadCount()).toBe(1);
  });

  it('deplace le camion sur la carte', () => {
    useMapStore.setState({ trucks: [{ id: 't1', latitude: 36.7, longitude: 3.0, isAvailable: true }] });

    realtimeHandlers['truck:position']({
      truckId: 't1',
      latitude: 36.9,
      longitude: 3.2,
      isAvailable: true,
    });

    expect(useMapStore.getState().trucks[0].latitude).toBe(36.9);
  });

  // Une verification refusee cote admin arrive pendant que l'ecran est ouvert :
  // l'echec du rechargement ne doit pas faire tomber le gestionnaire.
  it('encaisse un rechargement de profil en echec', async () => {
    const refreshUser = vi.fn(() => Promise.reject(new Error('hors ligne')));
    useAuthStore.setState({ refreshUser });

    expect(() => realtimeHandlers['transporter:verification']()).not.toThrow();
    await Promise.resolve();
    expect(refreshUser).toHaveBeenCalled();
  });
});
