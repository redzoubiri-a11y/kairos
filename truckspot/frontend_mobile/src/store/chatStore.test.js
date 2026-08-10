import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useChatStore } from './chatStore';
import { chatApi } from '../api/endpoints';
import { emit } from '../api/socket';

vi.mock('../api/endpoints', () => ({
  chatApi: { history: vi.fn(), send: vi.fn(), markRead: vi.fn() },
}));
vi.mock('../api/socket', () => ({ emit: vi.fn() }));

function message(id, overrides = {}) {
  return { id, missionId: 'mission-1', senderId: 'u1', content: 'Bonjour', ...overrides };
}

const INITIAL = useChatStore.getState();

beforeEach(() => {
  useChatStore.setState({ ...INITIAL, threads: {}, hasMore: {}, typingIn: null }, true);
  chatApi.markRead.mockResolvedValue({ updated: 0 });
});

const PAGE_SIZE = 50;

// Le serveur ne renvoie pas de total : seule une page pleine laisse supposer
// qu'un debut de conversation reste a charger.
function fullPage(prefix) {
  return Array.from({ length: PAGE_SIZE }, (_, i) =>
    message(`${prefix}${i}`, {
      createdAt: new Date(Date.UTC(2026, 7, 9, 10, 0, 0) + i * 60_000).toISOString(),
    })
  );
}

describe('historique', () => {
  it('charge une conversation et la marque comme lue', async () => {
    chatApi.history.mockResolvedValue([message('c1'), message('c2')]);

    await useChatStore.getState().loadHistory('mission-1');

    expect(useChatStore.getState().messagesFor('mission-1')).toHaveLength(2);
    expect(chatApi.markRead).toHaveBeenCalledWith('mission-1');
  });

  // Un accuse de lecture qui echoue ne doit pas empecher d'afficher les messages.
  it("affiche la conversation meme si l'accuse de lecture echoue", async () => {
    chatApi.history.mockResolvedValue([message('c1')]);
    chatApi.markRead.mockRejectedValue(new Error('hors ligne'));

    await useChatStore.getState().loadHistory('mission-1');

    expect(useChatStore.getState().messagesFor('mission-1')).toHaveLength(1);
    expect(useChatStore.getState().error).toBeNull();
  });

  it('isole les conversations les unes des autres', async () => {
    chatApi.history.mockResolvedValueOnce([message('a1', { missionId: 'mission-1' })]);
    await useChatStore.getState().loadHistory('mission-1');

    chatApi.history.mockResolvedValueOnce([message('b1', { missionId: 'mission-2' })]);
    await useChatStore.getState().loadHistory('mission-2');

    expect(useChatStore.getState().messagesFor('mission-1').map((m) => m.id)).toEqual(['a1']);
    expect(useChatStore.getState().messagesFor('mission-2').map((m) => m.id)).toEqual(['b1']);
  });

  it('renvoie une liste vide pour une conversation jamais ouverte', () => {
    expect(useChatStore.getState().messagesFor('inconnue')).toEqual([]);
  });
});

describe('messages precedents', () => {
  it('signale un debut de conversation a charger quand la page est pleine', async () => {
    chatApi.history.mockResolvedValue(fullPage('a'));

    await useChatStore.getState().loadHistory('mission-1');

    expect(useChatStore.getState().hasMoreFor('mission-1')).toBe(true);
  });

  it('ne promet rien de plus quand la page est incomplete', async () => {
    chatApi.history.mockResolvedValue([message('c1')]);

    await useChatStore.getState().loadHistory('mission-1');

    expect(useChatStore.getState().hasMoreFor('mission-1')).toBe(false);
  });

  // Le defaut corrige : le serveur acceptait deja un curseur `before`, mais rien
  // ne s'en servait et le debut d'une longue conversation etait perdu.
  it('prepend les plus anciens a partir du premier message affiche', async () => {
    const affiches = fullPage('a');
    useChatStore.setState({
      threads: { 'mission-1': affiches },
      hasMore: { 'mission-1': true },
    });
    chatApi.history.mockResolvedValue([message('vieux')]);

    await useChatStore.getState().loadOlder('mission-1');

    expect(chatApi.history).toHaveBeenCalledWith('mission-1', {
      limit: PAGE_SIZE,
      before: affiches[0].createdAt,
    });
    const thread = useChatStore.getState().messagesFor('mission-1');
    expect(thread[0].id).toBe('vieux');
    expect(thread).toHaveLength(PAGE_SIZE + 1);
    expect(useChatStore.getState().hasMoreFor('mission-1')).toBe(false);
  });

  it('ne rappelle pas le serveur une fois le debut atteint', async () => {
    useChatStore.setState({
      threads: { 'mission-1': [message('c1')] },
      hasMore: { 'mission-1': false },
    });

    await useChatStore.getState().loadOlder('mission-1');

    expect(chatApi.history).not.toHaveBeenCalled();
  });

  it('ne demande rien sur une conversation jamais ouverte', async () => {
    useChatStore.setState({ hasMore: { 'mission-1': true } });

    await useChatStore.getState().loadOlder('mission-1');

    expect(chatApi.history).not.toHaveBeenCalled();
  });

  it('ecarte un message deja affiche', async () => {
    useChatStore.setState({
      threads: { 'mission-1': [message('c2'), message('c3')] },
      hasMore: { 'mission-1': true },
    });
    chatApi.history.mockResolvedValue([message('c1'), message('c2')]);

    await useChatStore.getState().loadOlder('mission-1');

    expect(useChatStore.getState().messagesFor('mission-1').map((m) => m.id)).toEqual([
      'c1',
      'c2',
      'c3',
    ]);
  });

  it('ne perd pas la conversation si la page precedente echoue', async () => {
    useChatStore.setState({
      threads: { 'mission-1': [message('c1')] },
      hasMore: { 'mission-1': true },
    });
    chatApi.history.mockRejectedValue(new Error('Delai depasse'));

    await useChatStore.getState().loadOlder('mission-1');

    const state = useChatStore.getState();
    expect(state.messagesFor('mission-1').map((m) => m.id)).toEqual(['c1']);
    expect(state.error).toBe('Delai depasse');
    expect(state.loadingOlder).toBe(false);
  });
});

describe('reception', () => {
  // Le serveur emet chat:message dans le salon et chat:inbox sur le canal
  // personnel : sans deduplication, l'expediteur verrait son message deux fois.
  it('ignore un message deja present', () => {
    useChatStore.getState().receive(message('c1'));
    useChatStore.getState().receive(message('c1'));

    expect(useChatStore.getState().messagesFor('mission-1')).toHaveLength(1);
  });

  it('conserve l ordre d arrivee', () => {
    useChatStore.getState().receive(message('c1', { content: 'premier' }));
    useChatStore.getState().receive(message('c2', { content: 'second' }));

    expect(useChatStore.getState().messagesFor('mission-1').map((m) => m.content)).toEqual([
      'premier',
      'second',
    ]);
  });

  it('cree la conversation si elle n existait pas', () => {
    useChatStore.getState().receive(message('c1', { missionId: 'mission-neuve' }));

    expect(useChatStore.getState().messagesFor('mission-neuve')).toHaveLength(1);
  });
});

describe('accuses de lecture', () => {
  // Le defaut corrige : la bulle affichait deja la double coche, mais rien
  // n'ecoutait chat:read. Il fallait quitter l'ecran et revenir pour la voir.
  it('marque comme lus les messages de l autre partie', () => {
    useChatStore.setState({
      threads: {
        'mission-1': [
          message('c1', { senderId: 'moi' }),
          message('c2', { senderId: 'moi' }),
          message('c3', { senderId: 'lui' }),
        ],
      },
    });

    useChatStore.getState().applyRead('mission-1', 'lui');

    const thread = useChatStore.getState().messagesFor('mission-1');
    expect(thread[0].readAt).toBeTruthy();
    expect(thread[1].readAt).toBeTruthy();
    // Le lecteur ne s'accuse pas reception a lui-meme.
    expect(thread[2].readAt).toBeUndefined();
  });

  it('ne rejoue pas la date d un message deja lu', () => {
    useChatStore.setState({
      threads: {
        'mission-1': [message('c1', { senderId: 'moi', readAt: '2026-08-01T10:00:00.000Z' })],
      },
    });

    useChatStore.getState().applyRead('mission-1', 'lui');

    expect(useChatStore.getState().messagesFor('mission-1')[0].readAt).toBe(
      '2026-08-01T10:00:00.000Z'
    );
  });

  it('ne touche pas les autres conversations', () => {
    useChatStore.setState({
      threads: {
        'mission-1': [message('c1', { senderId: 'moi' })],
        'mission-2': [message('c2', { missionId: 'mission-2', senderId: 'moi' })],
      },
    });

    useChatStore.getState().applyRead('mission-1', 'lui');

    expect(useChatStore.getState().messagesFor('mission-2')[0].readAt).toBeUndefined();
  });

  it('ignore une conversation jamais ouverte', () => {
    expect(() => useChatStore.getState().applyRead('inconnue', 'lui')).not.toThrow();
    expect(useChatStore.getState().messagesFor('inconnue')).toEqual([]);
  });
});

describe('envoi', () => {
  it('envoie le message ebarbe et l ajoute a la conversation', async () => {
    chatApi.send.mockResolvedValue(message('c1', { content: 'Bonjour' }));

    await useChatStore.getState().send('mission-1', '   Bonjour   ');

    expect(chatApi.send).toHaveBeenCalledWith('mission-1', 'Bonjour');
    expect(useChatStore.getState().messagesFor('mission-1')).toHaveLength(1);
  });

  it("n'envoie rien pour un message vide ou fait d'espaces", async () => {
    await useChatStore.getState().send('mission-1', '   ');
    await useChatStore.getState().send('mission-1', '');

    expect(chatApi.send).not.toHaveBeenCalled();
  });

  // L'ecran remet le brouillon dans le champ : l'erreur doit donc remonter.
  it('propage l echec et libere l indicateur d envoi', async () => {
    chatApi.send.mockRejectedValue(new Error('La conversation est fermee'));

    await expect(useChatStore.getState().send('mission-1', 'Bonjour')).rejects.toThrow(
      'La conversation est fermee'
    );

    const state = useChatStore.getState();
    expect(state.sending).toBe(false);
    expect(state.error).toBe('La conversation est fermee');
    expect(state.messagesFor('mission-1')).toHaveLength(0);
  });

  it('signale la saisie sur la websocket', () => {
    useChatStore.getState().notifyTyping('mission-1');

    expect(emit).toHaveBeenCalledWith('chat:typing', { missionId: 'mission-1' });
  });

  it('oublie une conversation a la demande', () => {
    useChatStore.getState().receive(message('c1'));
    useChatStore.setState({ hasMore: { 'mission-1': true } });

    useChatStore.getState().clearThread('mission-1');

    expect(useChatStore.getState().messagesFor('mission-1')).toEqual([]);
    // Sinon une conversation rouverte proposerait de charger un debut absent.
    expect(useChatStore.getState().hasMoreFor('mission-1')).toBe(false);
  });
});
