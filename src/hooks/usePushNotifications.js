import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { supabase } from '../../supabase';

// Comportement des notifications quand l'app est au premier plan
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge:  true,
  }),
});

async function registerForPushNotifications() {
  if (!Device.isDevice) return null;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return null;

  const projectId = Constants.expoConfig?.extra?.eas?.projectId
    ?? Constants.easConfig?.projectId;

  try {
    const token = projectId
      ? (await Notifications.getExpoPushTokenAsync({ projectId })).data
      : (await Notifications.getExpoPushTokenAsync()).data;
    return token;
  } catch {
    return null;
  }
}

async function savePushToken(token) {
  if (!token) return;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    // Client
    await supabase.from('users').update({ push_token: token }).eq('auth_id', user.id);
    // Pro (restaurant owner) — silencieux si pas de row
    await supabase.from('restaurant_owners').update({ push_token: token }).eq('auth_id', user.id);
  } catch {
    // échec silencieux — pas bloquant
  }
}

function handleNotificationTap(response, navigation) {
  if (!navigation) return;
  navigation.navigate('Notifications');
}

export default function usePushNotifications(navigation) {
  const notifListener   = useRef(null);
  const responseListener = useRef(null);

  useEffect(() => {
    registerForPushNotifications().then(savePushToken);

    // Tap sur notif quand app était fermée (cold start)
    Notifications.getLastNotificationResponseAsync().then(response => {
      if (response) handleNotificationTap(response, navigation);
    });

    // Notification reçue quand app est ouverte
    notifListener.current = Notifications.addNotificationReceivedListener(() => {});

    // Utilisateur a tapé sur la notification (app en arrière-plan ou ouverte)
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      handleNotificationTap(response, navigation);
    });

    return () => {
      notifListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [navigation]);
}
