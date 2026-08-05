// Production des PDF — écriture du fichier et partage.
// Les gabarits eux-mêmes vivent dans pdfTemplates.js, sans dépendance native.

import { Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export { escapeHtml, buildContractHtml, buildPlanningHtml } from './pdfTemplates';

/**
 * Traduit les énumérations de la base pour les gabarits, qui restent purs.
 * `t` vient de useI18n : les documents suivent donc la langue de l'app.
 */
export function pdfLabels(t) {
  const events = {};
  ['mariage', 'fiancailles', 'anniversaire', 'conference', 'autre'].forEach((k) => {
    events[k] = t(`events.${k}`);
  });

  const statuses = {};
  ['pending', 'confirmed', 'cancelled', 'completed'].forEach((k) => {
    statuses[k] = t(`status.${k}`);
  });

  return { events, statuses };
}

// ── Sortie ────────────────────────────────────────────────────────────────

/**
 * Produit le PDF et propose de le partager.
 * Sur le web, `expo-print` n'écrit pas de fichier : on ouvre la boîte
 * d'impression du navigateur, qui permet d'enregistrer en PDF.
 */
export async function exportToPdf({ html }) {
  if (Platform.OS === 'web') {
    await Print.printAsync({ html });
    return { shared: false, uri: null };
  }

  const { uri } = await Print.printToFileAsync({ html, base64: false });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
    return { shared: true, uri };
  }
  return { shared: false, uri };
}
