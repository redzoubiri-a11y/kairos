import { io } from 'socket.io-client';
import { API_URL } from './client';

let socket = null;

// Un salon de mission est lie a la connexion : le serveur le perd des que la
// socket tombe. On retient donc ceux qu'on a rejoints pour pouvoir les
// redemander apres une reconnexion.
const joinedMissions = new Set();

// Demonte le transport sans toucher aux salons : ceux-ci decrivent ce que
// l'interface veut ecouter, pas ce que la connexion courante possede.
function teardown() {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}

export function connectSocket(token) {
  if (socket?.connected && socket.auth?.token === token) return socket;
  teardown();

  socket = io(API_URL, {
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 8000,
  });

  // Une coupure reseau ou un retour d'arriere-plan repart d'une session serveur
  // neuve. Sans ce rappel, la conversation ouverte cessait silencieusement de
  // recevoir « en train d'ecrire » et les accuses de lecture : rien ne signalait
  // la perte, l'ecran restait simplement muet.
  socket.on('connect', () => {
    joinedMissions.forEach((missionId) => socket.emit('mission:join', missionId));
  });

  return socket;
}

export function getSocket() {
  return socket;
}

// Deconnexion du compte : on oublie aussi ce qu'on ecoutait.
export function disconnectSocket() {
  teardown();
  joinedMissions.clear();
}

// Returns an unsubscribe function so effects can clean up without leaking listeners.
export function on(event, handler) {
  socket?.on(event, handler);
  return () => socket?.off(event, handler);
}

export function emit(event, payload, ack) {
  socket?.emit(event, payload, ack);
}

// A preferer a emit('mission:join') : seul ce chemin survit a une reconnexion.
export function joinMission(missionId) {
  if (!missionId) return;
  joinedMissions.add(missionId);
  socket?.emit('mission:join', missionId);
}

export function leaveMission(missionId) {
  if (!missionId) return;
  joinedMissions.delete(missionId);
  socket?.emit('mission:leave', missionId);
}

export function joinedMissionIds() {
  return [...joinedMissions];
}
