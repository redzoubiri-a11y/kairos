import { beforeEach, describe, expect, it, vi } from 'vitest';
import { io } from 'socket.io-client';

import {
  connectSocket,
  disconnectSocket,
  joinMission,
  joinedMissionIds,
  leaveMission,
} from './socket';

vi.mock('./client', () => ({ API_URL: 'http://api.test' }));
vi.mock('socket.io-client', () => ({ io: vi.fn() }));

// Doublure minimale de socket.io : elle retient les gestionnaires pour qu'un
// test puisse declencher `connect` comme le ferait une reconnexion reelle.
function fakeSocket() {
  const handlers = {};
  return {
    connected: false,
    auth: {},
    emit: vi.fn(),
    on: vi.fn((event, handler) => {
      (handlers[event] ??= []).push(handler);
    }),
    off: vi.fn(),
    removeAllListeners: vi.fn(),
    disconnect: vi.fn(),
    fire: (event, ...args) => (handlers[event] ?? []).forEach((h) => h(...args)),
  };
}

let socket;

beforeEach(() => {
  disconnectSocket();
  socket = fakeSocket();
  io.mockReturnValue(socket);
});

function joinsOf(mock) {
  return mock.mock.calls.filter(([event]) => event === 'mission:join').map(([, id]) => id);
}

describe('connexion', () => {
  it('passe le jeton dans le handshake', () => {
    connectSocket('jeton-1');

    expect(io).toHaveBeenCalledWith('http://api.test', expect.objectContaining({ auth: { token: 'jeton-1' } }));
  });

  it('oublie les salons a la deconnexion du compte', () => {
    connectSocket('jeton-1');
    joinMission('m1');

    disconnectSocket();

    expect(joinedMissionIds()).toEqual([]);
  });
});

describe('salons de mission', () => {
  it('rejoint immediatement et retient la mission', () => {
    connectSocket('jeton-1');

    joinMission('m1');

    expect(socket.emit).toHaveBeenCalledWith('mission:join', 'm1');
    expect(joinedMissionIds()).toEqual(['m1']);
  });

  // Le defaut corrige : un salon est lie a la connexion, le serveur le perd des
  // que la socket tombe. Rien ne le redemandait, et la conversation ouverte
  // cessait silencieusement de recevoir la saisie et les accuses de lecture.
  it('redemande les salons apres une reconnexion', () => {
    connectSocket('jeton-1');
    joinMission('m1');
    joinMission('m2');
    socket.emit.mockClear();

    socket.fire('connect');

    expect(joinsOf(socket.emit).sort()).toEqual(['m1', 'm2']);
  });

  it('ne redemande pas un salon quitte entre-temps', () => {
    connectSocket('jeton-1');
    joinMission('m1');
    joinMission('m2');
    leaveMission('m1');
    socket.emit.mockClear();

    socket.fire('connect');

    expect(joinsOf(socket.emit)).toEqual(['m2']);
  });

  it('rejoint des l etablissement un salon demande trop tot', () => {
    // L'ecran de conversation peut se monter avant que la socket soit prete.
    joinMission('m1');
    connectSocket('jeton-1');

    socket.fire('connect');

    expect(joinsOf(socket.emit)).toEqual(['m1']);
  });

  it('ignore un identifiant absent', () => {
    connectSocket('jeton-1');

    joinMission(undefined);
    leaveMission(null);

    expect(joinedMissionIds()).toEqual([]);
    expect(joinsOf(socket.emit)).toEqual([]);
  });
});
