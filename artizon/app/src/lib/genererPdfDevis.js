import { Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

/**
 * Sur web, `Print.printAsync` imprime la page de l'app en cours plutôt que
 * le `html` fourni (constaté à l'usage, pas juste documenté) — on ouvre
 * donc nous-mêmes une iframe cachée contenant ce html et on l'imprime
 * directement, sans passer par expo-print pour cette plateforme.
 */
function imprimerHtmlWeb(html) {
  return new Promise((resolve) => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const nettoyer = () => {
      document.body.removeChild(iframe);
      resolve();
    };

    iframe.onload = () => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      // Pas d'événement fiable pour « impression terminée » sur tous les
      // navigateurs : on retire l'iframe après un délai plutôt que de la
      // garder indéfiniment dans le DOM.
      setTimeout(nettoyer, 1000);
    };

    iframe.srcdoc = html;
  });
}

/**
 * Sur natif, expo-sharing ouvre le partage OS (mail, WhatsApp...) sur le
 * PDF généré par expo-print.
 */
export async function genererEtPartagerPdfDevis(html) {
  if (Platform.OS === 'web') {
    await imprimerHtmlWeb(html);
    return;
  }

  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Envoyer le devis' });
  }
}
