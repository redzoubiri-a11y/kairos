import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing, typography } from '../theme.js';
import { useHistoriqueDevis } from '../hooks/useHistoriqueDevis.js';
import { formaterEuros } from '../lib/format.js';
import SyntheseDevis from '../components/SyntheseDevis.js';

function formaterDate(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const jour = String(d.getDate()).padStart(2, '0');
  const mois = String(d.getMonth() + 1).padStart(2, '0');
  return `${jour}/${mois}/${d.getFullYear()}`;
}

function LigneDevis({ ligne }) {
  const [ouvert, setOuvert] = useState(false);
  const totalTTC = ligne.resultat?.totalTTC;

  return (
    <View style={styles.ligne}>
      <TouchableOpacity onPress={() => setOuvert((v) => !v)} style={styles.enteteLigne}>
        <View style={styles.enteteTextes}>
          <Text style={styles.ouvrage}>{ligne.ouvrage_libelle || 'Sans description'}</Text>
          <Text style={styles.client}>
            {ligne.client_nom || 'Client non renseigné'} · {formaterDate(ligne.created_at)}
          </Text>
        </View>
        <Text style={styles.montant}>{typeof totalTTC === 'number' ? formaterEuros(totalTTC) : '—'}</Text>
      </TouchableOpacity>
      {ouvert && ligne.resultat ? (
        <View style={styles.detail}>
          <SyntheseDevis devis={{ fourniture: ligne.fourniture }} resultat={ligne.resultat} />
        </View>
      ) : null}
    </View>
  );
}

export default function HistoriqueDevisScreen({ userId }) {
  const { devisListe, enChargement, erreur } = useHistoriqueDevis(userId);

  return (
    <SafeAreaView style={styles.conteneur} edges={['top']}>
      <ScrollView contentContainerStyle={styles.contenu}>
        <Text style={styles.titre}>Historique des devis</Text>

        {enChargement ? (
          <ActivityIndicator color={colors.primary} style={styles.chargement} />
        ) : erreur ? (
          <Text style={styles.erreur}>Échec du chargement — réessaie.</Text>
        ) : devisListe.length === 0 ? (
          <Text style={styles.vide}>Aucun devis enregistré pour l'instant.</Text>
        ) : (
          devisListe.map((ligne) => <LigneDevis key={ligne.id} ligne={ligne} />)
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, backgroundColor: colors.background },
  contenu: { padding: spacing.lg, paddingBottom: spacing.xl },
  titre: { ...typography.title, marginBottom: spacing.lg },
  chargement: { marginTop: spacing.xl },
  erreur: { ...typography.body, color: colors.danger },
  vide: { ...typography.hint },
  ligne: {
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  enteteLigne: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  enteteTextes: { flex: 1, marginRight: spacing.sm },
  ouvrage: { ...typography.body, fontWeight: '700' },
  client: { ...typography.hint, marginTop: spacing.xs },
  montant: { ...typography.body, fontWeight: '700' },
  detail: { marginTop: spacing.md },
});
