import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';

// Ouvre l'ecran vise par une notification tapee. Deux cas a couvrir :
// l'application etait en arriere-plan (listener), ou elle etait fermee et vient
// d'etre lancee par la notification elle-meme (getLastNotificationResponseAsync).
export function usePushResponse(navigationRef, isReady) {
  useEffect(() => {
    if (!isReady) return undefined;

    const openTarget = (response) => {
      const data = response?.notification?.request?.content?.data;
      if (!data?.missionId || !navigationRef.current?.isReady()) return;
      navigationRef.current.navigate('MissionDetail', { missionId: data.missionId });
    };

    let cancelled = false;
    Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (!cancelled) openTarget(response);
        // Expo garde cette reponse jusqu'a ce qu'on l'efface explicitement —
        // elle n'est pas consommee au premier appel. `isReady` redevient vrai
        // a chaque connexion (y compris un changement de compte sur le meme
        // appareil), donc sans cet appel, une notification tapee une fois
        // rouvrait la meme mission a chaque connexion suivante, meme pour un
        // autre utilisateur qui n'y a pas acces.
        return Notifications.clearLastNotificationResponseAsync();
      })
      .catch(() => {});

    const subscription = Notifications.addNotificationResponseReceivedListener(openTarget);

    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, [navigationRef, isReady]);
}
