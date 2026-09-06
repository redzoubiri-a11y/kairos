import { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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

function LigneDevis({ ligne, onModifier, onSupprimer }) {
  const [ouvert, setOuvert] = useState(false);
  const [enSuppression, setEnSuppression] = useState(false);
  const totalTTC = ligne.resultat?.totalTTC;

  const confirmerSuppression = () => {
    Alert.alert('Supprimer ce devis ?', 'Cette action est irréversible.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          setEnSuppression(true);
          const { error } = await onSupprimer(ligne.id);
          if (error) setEnSuppression(false);
        },
      },
    ]);
  };

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
          <View style={styles.ligneActions}>
            <TouchableOpacity onPress={() => onModifier(ligne)} disabled={enSuppression}>
              <Text style={styles.lienModifier}>Modifier ce devis</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={confirmerSuppression} disabled={enSuppression}>
              <Text style={styles.lienSupprimer}>
                {enSuppression ? 'Suppression…' : 'Supprimer'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}
    </View>
  );
}

export default function HistoriqueDevisScreen({ userId, onModifier }) {
  const { devisListe, enChargement, erreur, supprimer } = useHistoriqueDevis(userId);

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
          devisListe.map((ligne) => (
            <LigneDevis key={ligne.id} ligne={ligne} onModifier={onModifier} onSupprimer={supprimer} />
          ))
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
  ligneActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  lienModifier: { color: colors.primary, fontWeight: '600', fontSize: 13 },
  lienSupprimer: { color: colors.danger, fontWeight: '600', fontSize: 13 },
});
