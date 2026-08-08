import { useEffect } from 'react';
import { on } from '../api/socket';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import { useMapStore } from '../store/mapStore';
import { useMissionStore } from '../store/missionStore';
import { useNotificationStore } from '../store/notificationStore';

// Wires every server-pushed event into the right store. Mounted once, at the
// root, so events keep flowing regardless of the visible screen.
export function useRealtime() {
  const status = useAuthStore((s) => s.status);
  const refreshUser = useAuthStore((s) => s.refreshUser);

  useEffect(() => {
    if (status !== 'signedIn') return undefined;

    const unsubscribers = [
      on('mission:new', (mission) => useMissionStore.getState().upsert(mission)),
      on('mission:updated', (mission) => useMissionStore.getState().upsert(mission)),
      on('chat:message', (message) => useChatStore.getState().receive(message)),
      on('chat:inbox', (message) => useChatStore.getState().receive(message)),
      on('chat:typing', ({ missionId }) => useChatStore.getState().setTypingIn(missionId)),
      on('notification:new', (notification) => useNotificationStore.getState().receive(notification)),
      on('truck:position', (position) => useMapStore.getState().applyPosition(position)),
      on('transporter:verification', () => {
        refreshUser().catch(() => {});
      }),
    ];

    return () => unsubscribers.forEach((off) => off());
  }, [status, refreshUser]);
}
