// Enregistrement de l'appareil pour les notifications push (§6.1).
//
// Tout est défensif : sur le web, dans un simulateur, sans projet EAS ou
// sans Supabase, la fonction renonce en silence. Une notification est un
// confort, jamais une raison de bloquer la connexion.

import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { supabase, hasSupabase } from '../data/client';

/** Affiche les notifications reçues alors que l'app est au premier plan. */
export function configureForegroundBehaviour() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: true,
    }),
  });
}

function projectId() {
  return (
    Constants?.expoConfig?.extra?.eas?.projectId ??
    Constants?.easConfig?.projectId ??
    null
  );
}

/**
 * Demande l'autorisation, récupère le jeton Expo et l'enregistre.
 * Renvoie le jeton, ou null si l'appareil ne peut pas en recevoir.
 */
export async function registerForPush() {
  // Le push natif ne fonctionne pas sur le web ni sur un simulateur.
  if (Platform.OS === 'web' || !Device.isDevice) return null;

  const id = projectId();
  if (!id) {
    // Sans identifiant de projet EAS, Expo ne peut pas émettre de jeton.
    console.warn('Push ignoré : aucun projectId EAS dans app.json');
    return null;
  }

  try {
    const existing = await Notifications.getPermissionsAsync();
    let status = existing.status;

    if (status !== 'granted') {
      const asked = await Notifications.requestPermissionsAsync();
      status = asked.status;
    }
    if (status !== 'granted') return null;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Tasalle',
        importance: Notifications.AndroidImportance.DEFAULT,
        lightColor: '#BE9A5E',
      });
    }

    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId: id });
    return token ?? null;
  } catch (e) {
    console.warn('Enregistrement push impossible', e?.message);
    return null;
  }
}

/** Associe le jeton au compte connecté. Sans Supabase, il n'y a rien à stocker. */
export async function savePushToken(token) {
  if (!token || !hasSupabase) return false;

  const { data } = await supabase.auth.getSession();
  const userId = data?.session?.user?.id;
  if (!userId) return false;

  const { error } = await supabase
    .from('push_tokens')
    .upsert(
      { user_id: userId, token, platform: Platform.OS, updated_at: new Date().toISOString() },
      { onConflict: 'token' }
    );

  if (error) {
    console.warn('Jeton push non enregistré', error.message);
    return false;
  }
  return true;
}

/** Enchaîne autorisation et enregistrement. Appelé une fois l'utilisateur connecté. */
export async function setupPush() {
  const token = await registerForPush();
  if (!token) return null;
  await savePushToken(token);
  return token;
}
