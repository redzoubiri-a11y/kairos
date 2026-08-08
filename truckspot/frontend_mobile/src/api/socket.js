import { io } from 'socket.io-client';
import { API_URL } from './client';

let socket = null;

export function connectSocket(token) {
  if (socket?.connected && socket.auth?.token === token) return socket;
  disconnectSocket();

  socket = io(API_URL, {
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 8000,
  });

  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}

// Returns an unsubscribe function so effects can clean up without leaking listeners.
export function on(event, handler) {
  socket?.on(event, handler);
  return () => socket?.off(event, handler);
}

export function emit(event, payload, ack) {
  socket?.emit(event, payload, ack);
}
