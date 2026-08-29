// Filtres du LogBox — à importer avant les modules qu'ils concernent.
//
// Ce module agit à l'import, et c'est tout son intérêt : `expo-notifications`
// émet son avertissement au chargement, pas au premier appel. Un filtre posé
// depuis une fonction appelée plus tard arriverait après coup, et le bandeau
// se serait déjà déroulé.

import { LogBox } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

/**
 * Depuis le SDK 53, Expo Go n'embarque plus les notifications push distantes
 * sur Android : `expo-notifications` le signale par un `console.error`, ce qui
 * ouvre le LogBox par-dessus l'application à chaque démarrage — sur un
 * téléphone, il faut le fermer avant de voir quoi que ce soit.
 *
 * Le message est exact, mais sans objet ici : `registerForPush()` renonce de
 * lui-même faute de `projectId` EAS, et le push ne se teste que dans un build.
 *
 * Le filtre ne vaut que dans Expo Go. Dans un build de développement ou de
 * production — les seuls endroits où le push fonctionne réellement — une
 * erreur d'`expo-notifications` s'affiche normalement : c'est là qu'elle
 * voudrait dire quelque chose.
 */
if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
  LogBox?.ignoreLogs?.([/expo-notifications/]);
}
