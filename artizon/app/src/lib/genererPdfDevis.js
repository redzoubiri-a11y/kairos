import { Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

/**
 * Sur web, expo-sharing n'est pas disponible et printToFileAsync ne produit
 * pas un fichier partageable comme sur natif — on passe alors par
 * printAsync, qui ouvre la boîte de dialogue d'impression du navigateur
 * (« Enregistrer en PDF » y est l'équivalent).
 */
export async function genererEtPartagerPdfDevis(html) {
  if (Platform.OS === 'web') {
    await Print.printAsync({ html });
    return;
  }

  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Envoyer le devis' });
  }
}
