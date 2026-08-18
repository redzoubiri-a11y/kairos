import { useEffect } from 'react';
import { on } from '../api/socket';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import { useMapStore } from '../store/mapStore';
import { useMissionStore } from '../store/missionStore';
import { useNotificationStore } from '../store/notificationStore';

// Table plate plutot que suite d'appels : elle se compare a la liste des
// evenements reellement emis par le serveur. `chat:read` etait emis depuis le
// debut sans que rien ne l'ecoute — la double coche de lecture n'apparaissait
// jamais en direct. Un evenement oublie se voit maintenant dans un test.
export const realtimeHandlers = {
  'mission:new': (mission) => useMissionStore.getState().upsert(mission),
  'mission:updated': (mission) => useMissionStore.getState().upsert(mission),
  'chat:message': (message) => useChatStore.getState().receive(message),
  'chat:inbox': (message) => useChatStore.getState().receive(message),
  'chat:typing': ({ missionId }) => useChatStore.getState().setTypingIn(missionId),
  'chat:read': ({ missionId, readerId }) => useChatStore.getState().applyRead(missionId, readerId),
  'notification:new': (notification) => useNotificationStore.getState().receive(notification),
  'truck:position': (position) => useMapStore.getState().applyPosition(position),
  'transporter:verification': () => {
    useAuthStore.getState().refreshUser().catch(() => {});
  },
};

// Wires every server-pushed event into the right store. Mounted once, at the
// root, so events keep flowing regardless of the visible screen.
export function useRealtime() {
  const status = useAuthStore((s) => s.status);

  useEffect(() => {
    if (status !== 'signedIn') return undefined;

    const unsubscribers = Object.entries(realtimeHandlers).map(([event, handler]) =>
      on(event, handler)
    );

    return () => unsubscribers.forEach((off) => off());
  }, [status]);
}
