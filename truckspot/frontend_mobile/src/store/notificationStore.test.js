import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useNotificationStore } from './notificationStore';
import { notificationApi } from '../api/endpoints';

vi.mock('../api/endpoints', () => ({
  notificationApi: { list: vi.fn(), markAllRead: vi.fn() },
}));

const PAGE_SIZE = 30;

function notif(id, overrides = {}) {
  return {
    id,
    type: 'MISSION_STATUS',
    title: `Notification ${id}`,
    body: 'Corps',
    readAt: null,
    createdAt: '2026-08-09T10:00:00.000Z',
    ...overrides,
  };
}

// Le serveur ne renvoie pas de total : seule une page pleine laisse supposer
// qu'il en reste. Les suites de pagination ont donc besoin d'une vraie page.
function fullPage(prefix) {
  return Array.from({ length: PAGE_SIZE }, (_, i) =>
    notif(`${prefix}${i}`, {
      createdAt: new Date(Date.UTC(2026, 7, 9, 10, 0, 0) - i * 60_000).toISOString(),
    })
  );
}

const INITIAL = useNotificationStore.getState();

beforeEach(() => {
  useNotificationStore.setState({ ...INITIAL, items: [], hasMore: false, error: null }, true);
  notificationApi.list.mockResolvedValue([]);
  notificationApi.markAllRead.mockResolvedValue({ updated: 0 });
});

describe('chargement', () => {
  it('remplit la liste et signale une suite quand la page est pleine', async () => {
    notificationApi.list.mockResolvedValue(fullPage('a'));

    await useNotificationStore.getState().load();

    const state = useNotificationStore.getState();
    expect(state.items).toHaveLength(PAGE_SIZE);
    expect(state.hasMore).toBe(true);
    expect(state.loading).toBe(false);
  });

  it('ne promet pas de suite quand la page est incomplete', async () => {
    notificationApi.list.mockResolvedValue([notif('n1')]);

    await useNotificationStore.getState().load();

    expect(useNotificationStore.getState().hasMore).toBe(false);
  });

  it("expose l'erreur sans laisser l'ecran en chargement", async () => {
    notificationApi.list.mockRejectedValue(new Error('Reseau indisponible'));

    await useNotificationStore.getState().load();

    const state = useNotificationStore.getState();
    expect(state.error).toBe('Reseau indisponible');
    expect(state.loading).toBe(false);
  });
});

describe('pagination', () => {
  // Le defaut corrige : la liste s'arretait a la premiere page et les plus
  // anciennes notifications etaient inatteignables.
  it('demande les plus anciennes a partir de la derniere affichee', async () => {
    const premiere = fullPage('a');
    useNotificationStore.setState({ items: premiere, hasMore: true });
    notificationApi.list.mockResolvedValue([notif('b0')]);

    await useNotificationStore.getState().loadMore();

    expect(notificationApi.list).toHaveBeenCalledWith({
      take: PAGE_SIZE,
      before: premiere[premiere.length - 1].createdAt,
    });
    const state = useNotificationStore.getState();
    expect(state.items).toHaveLength(PAGE_SIZE + 1);
    expect(state.items[state.items.length - 1].id).toBe('b0');
    expect(state.hasMore).toBe(false);
    expect(state.loadingMore).toBe(false);
  });

  it('ne rappelle pas le serveur une fois la fin atteinte', async () => {
    useNotificationStore.setState({ items: [notif('n1')], hasMore: false });

    await useNotificationStore.getState().loadMore();

    expect(notificationApi.list).not.toHaveBeenCalled();
  });

  it('ignore une demande pendant un chargement en cours', async () => {
    useNotificationStore.setState({ items: [notif('n1')], hasMore: true, loading: true });
    await useNotificationStore.getState().loadMore();
    expect(notificationApi.list).not.toHaveBeenCalled();

    useNotificationStore.setState({ loading: false, loadingMore: true });
    await useNotificationStore.getState().loadMore();
    expect(notificationApi.list).not.toHaveBeenCalled();
  });

  it('ne demande rien tant que la premiere page est vide', async () => {
    useNotificationStore.setState({ items: [], hasMore: true });

    await useNotificationStore.getState().loadMore();

    expect(notificationApi.list).not.toHaveBeenCalled();
  });

  it('ecarte une notification deja presente', async () => {
    useNotificationStore.setState({ items: [notif('n1'), notif('n2')], hasMore: true });
    notificationApi.list.mockResolvedValue([notif('n2'), notif('n3')]);

    await useNotificationStore.getState().loadMore();

    expect(useNotificationStore.getState().items.map((n) => n.id)).toEqual(['n1', 'n2', 'n3']);
  });

  it('ne perd pas la liste deja chargee si la suite echoue', async () => {
    useNotificationStore.setState({ items: [notif('n1')], hasMore: true });
    notificationApi.list.mockRejectedValue(new Error('Delai depasse'));

    await useNotificationStore.getState().loadMore();

    const state = useNotificationStore.getState();
    expect(state.items.map((n) => n.id)).toEqual(['n1']);
    expect(state.error).toBe('Delai depasse');
    expect(state.loadingMore).toBe(false);
  });
});

describe('reception temps reel', () => {
  it('place la nouvelle notification en tete', () => {
    useNotificationStore.setState({ items: [notif('n1')] });

    useNotificationStore.getState().receive(notif('n2'));

    expect(useNotificationStore.getState().items.map((n) => n.id)).toEqual(['n2', 'n1']);
  });

  it('ignore une notification deja recue', () => {
    useNotificationStore.getState().receive(notif('n1'));
    useNotificationStore.getState().receive(notif('n1'));

    expect(useNotificationStore.getState().items).toHaveLength(1);
  });
});

describe('accuse de lecture', () => {
  it('marque tout comme lu et vide le compteur', async () => {
    useNotificationStore.setState({ items: [notif('n1'), notif('n2')] });

    await useNotificationStore.getState().markAllRead();

    expect(notificationApi.markAllRead).toHaveBeenCalled();
    expect(useNotificationStore.getState().unreadCount()).toBe(0);
  });

  it("n'appelle pas le serveur quand tout est deja lu", async () => {
    useNotificationStore.setState({ items: [notif('n1', { readAt: '2026-08-09T09:00:00.000Z' })] });

    await useNotificationStore.getState().markAllRead();

    expect(notificationApi.markAllRead).not.toHaveBeenCalled();
  });

  // Le defaut corrige : la pastille disparaissait alors que le serveur avait
  // refuse, et les notifications revenaient non lues au rechargement suivant.
  it("restaure l'etat non lu quand le serveur refuse", async () => {
    useNotificationStore.setState({ items: [notif('n1'), notif('n2')] });
    notificationApi.markAllRead.mockRejectedValue(new Error('Hors ligne'));

    await useNotificationStore.getState().markAllRead();

    const state = useNotificationStore.getState();
    expect(state.unreadCount()).toBe(2);
    expect(state.error).toBe('Hors ligne');
  });

  it('conserve deja-lu et arrivee recente lors de la restauration', async () => {
    useNotificationStore.setState({
      items: [notif('n1'), notif('n2', { readAt: '2026-08-09T09:00:00.000Z' })],
    });
    notificationApi.markAllRead.mockImplementation(async () => {
      // Une notification arrive pendant l'appel : la restauration ne doit ni la
      // perdre ni la considerer comme lue.
      useNotificationStore.getState().receive(notif('n3'));
      throw new Error('Hors ligne');
    });

    await useNotificationStore.getState().markAllRead();

    const items = useNotificationStore.getState().items;
    expect(items.map((n) => n.id)).toEqual(['n3', 'n1', 'n2']);
    expect(items.find((n) => n.id === 'n1').readAt).toBeNull();
    expect(items.find((n) => n.id === 'n2').readAt).toBe('2026-08-09T09:00:00.000Z');
    expect(items.find((n) => n.id === 'n3').readAt).toBeNull();
  });

  it('compte les non lues pour la pastille', () => {
    useNotificationStore.setState({
      items: [notif('n1'), notif('n2', { readAt: '2026-08-09T09:00:00.000Z' }), notif('n3')],
    });

    expect(useNotificationStore.getState().unreadCount()).toBe(2);
  });

  it('oublie tout a la deconnexion', () => {
    useNotificationStore.setState({ items: [notif('n1')], hasMore: true, error: 'Ancien' });

    useNotificationStore.getState().clear();

    const state = useNotificationStore.getState();
    expect(state.items).toEqual([]);
    expect(state.hasMore).toBe(false);
    expect(state.error).toBeNull();
  });
});
