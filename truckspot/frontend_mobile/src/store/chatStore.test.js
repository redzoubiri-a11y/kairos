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
  useChatStore.setState({ ...INITIAL, threads: {}, typingIn: null }, true);
  chatApi.markRead.mockResolvedValue({ updated: 0 });
});

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
    useChatStore.getState().clearThread('mission-1');

    expect(useChatStore.getState().messagesFor('mission-1')).toEqual([]);
  });
});
