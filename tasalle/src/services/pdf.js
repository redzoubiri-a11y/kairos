// Production des PDF — écriture du fichier et partage.
// Les gabarits eux-mêmes vivent dans pdfTemplates.js, sans dépendance native.

import { Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export {
  escapeHtml,
  buildContractHtml,
  buildPlanningHtml,
  buildInvoiceHtml,
} from './pdfTemplates';

/**
 * Traduit les énumérations de la base pour les gabarits, qui restent purs.
 * `t` vient de useI18n : les libellés des documents restent au même endroit
 * que ceux de l'interface.
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

  // Les factures ont leur propre paire d'états, distincte de celle des
  // réservations : une facture est payée ou en attente, jamais « terminée ».
  const invoiceStatuses = {
    paid: t('pro.invoiceStatusPaid'),
    pending: t('pro.invoiceStatusPending'),
  };

  return { events, statuses, invoiceStatuses };
}

// ── Sortie ────────────────────────────────────────────────────────────────

/**
 * Impression d'un document sur le web.
 *
 * `expo-print` n'y sert à rien : sa version web ignore l'argument `html` et
 * appelle `window.print()`, ce qui imprime l'écran de l'application au lieu du
 * document. On monte donc le HTML dans un cadre hors écran et on imprime
 * celui-ci — c'est la seule façon d'obtenir le bon document dans le
 * back-office pro, qui tourne dans un navigateur.
 */
function printHtmlOnWeb(html) {
  return new Promise((resolve, reject) => {
    const cadre = document.createElement('iframe');
    cadre.setAttribute('aria-hidden', 'true');
    cadre.setAttribute('title', 'Document à imprimer');
    cadre.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';

    let termine = false;
    const nettoyer = () => {
      if (termine) return;
      termine = true;
      // Chrome imprime de façon asynchrone : retirer le cadre trop tôt vide
      // l'aperçu. On laisse passer la boîte de dialogue avant de nettoyer.
      setTimeout(() => cadre.remove(), 1000);
      resolve({ shared: false, uri: null });
    };

    cadre.onload = () => {
      try {
        const vue = cadre.contentWindow;
        vue.addEventListener('afterprint', nettoyer);
        vue.focus();
        vue.print();
        // Certains navigateurs n'émettent pas `afterprint` : filet de sécurité.
        setTimeout(nettoyer, 3000);
      } catch (e) {
        cadre.remove();
        reject(e);
      }
    };

    document.body.appendChild(cadre);
    const doc = cadre.contentDocument;
    doc.open();
    doc.write(html);
    doc.close();
  });
}

/**
 * Produit le PDF et propose de le partager.
 * Sur le web, il n'y a pas de fichier écrit : on ouvre la boîte d'impression
 * du navigateur, qui permet d'enregistrer en PDF.
 */
export async function exportToPdf({ html }) {
  if (Platform.OS === 'web') {
    return printHtmlOnWeb(html);
  }

  const { uri } = await Print.printToFileAsync({ html, base64: false });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
    return { shared: true, uri };
  }
  return { shared: false, uri };
}
