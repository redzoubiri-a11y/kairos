import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { supabase } from '../../supabase';

// Handled only once per app session — prevents navigating to Notifications
// every time HomeScreen remounts after a user previously tapped a notification
let _coldStartHandled = false;

// Comportement des notifications quand l'app est au premier plan
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge:  true,
    }),
  });
}

async function registerForPushNotifications() {
  if (Platform.OS === 'web' || !Device.isDevice) return null;

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
  const data = response?.notification?.request?.content?.data;
  if (data?.type === 'review_request') {
    try { navigation.navigate('Main', { screen: 'Resa' }); } catch (_) {
      try { navigation.navigate('Main', { screen: 'Manager' }); } catch (_2) {}
    }
    return;
  }
  navigation.navigate('Notifications');
}

export default function usePushNotifications(navigation) {
  const notifListener   = useRef(null);
  const responseListener = useRef(null);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    registerForPushNotifications().then(savePushToken);

    // Cold start: handle once per session — not on every HomeScreen remount
    if (!_coldStartHandled) {
      _coldStartHandled = true;
      Notifications.getLastNotificationResponseAsync().then(response => {
        if (!response) return;
        // Only act if notification is very recent (< 5s = truly launched the app)
        const raw = response.notification?.date ?? 0;
        const sec = raw > 1e10 ? raw / 1000 : raw;
        if (Date.now() / 1000 - sec < 5) handleNotificationTap(response, navigation);
      });
    }

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
