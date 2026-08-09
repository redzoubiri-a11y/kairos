import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { deviceApi } from './endpoints';

// Retenu ici pour pouvoir desinscrire l'appareil a la deconnexion, moment ou le
// jeton Expo n'est plus forcement redemandable.
let registeredToken = null;

// Une notification recue alors que l'application est au premier plan doit
// quand meme etre visible : la websocket a deja mis l'ecran a jour, mais
// l'utilisateur peut etre sur un autre onglet.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const PROJECT_ID_PLACEHOLDER = 'REPLACE_WITH_EAS_PROJECT_ID';

// getExpoPushTokenAsync leve si aucun projectId n'est trouve. Le placeholder
// d'app.json en est un du point de vue d'Expo : il serait transmis tel quel et
// rejete par le serveur avec un message obscur. Mieux vaut le traiter comme
// absent et dire clairement ce qu'il manque.
function resolveProjectId() {
  const candidate =
    Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId ?? null;
  return candidate && candidate !== PROJECT_ID_PLACEHOLDER ? candidate : null;
}

async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('default', {
    name: 'Missions et messages',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#F4A521',
  });
}

// Renvoie null plutot que de lever : l'absence de notifications push ne doit
// jamais empecher de se connecter.
export async function registerForPushNotifications() {
  try {
    if (!Constants.isDevice && Platform.OS !== 'web') {
      // Un emulateur ne recoit pas de notification push.
      return null;
    }

    await ensureAndroidChannel();

    const existing = await Notifications.getPermissionsAsync();
    let status = existing.status;
    if (status !== 'granted') {
      const asked = await Notifications.requestPermissionsAsync();
      status = asked.status;
    }
    if (status !== 'granted') return null;

    const projectId = resolveProjectId();
    if (!projectId) {
      console.warn(
        "[push] projectId EAS absent : renseignez expo.extra.eas.projectId dans app.json (`eas init`). Les notifications push restent desactivees."
      );
      return null;
    }

    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });

    await deviceApi.register({
      token,
      platform: Platform.OS === 'ios' ? 'IOS' : 'ANDROID',
      deviceName: Constants.deviceName ?? undefined,
    });

    registeredToken = token;
    return token;
  } catch (error) {
    console.warn('[push] enregistrement impossible:', error.message);
    return null;
  }
}

// A appeler tant que la session est encore valide : la route exige un jeton.
export async function unregisterPushNotifications() {
  if (!registeredToken) return;
  try {
    await deviceApi.unregister(registeredToken);
  } catch (error) {
    console.warn('[push] desinscription impossible:', error.message);
  } finally {
    registeredToken = null;
  }
}

export function getRegisteredToken() {
  return registeredToken;
}
