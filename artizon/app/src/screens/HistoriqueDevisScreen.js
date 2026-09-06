import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, radius, spacing, typography } from '../theme.js';
import { useHistoriqueDevis } from '../hooks/useHistoriqueDevis.js';
import { formaterEuros } from '../lib/format.js';
import SyntheseDevis from '../components/SyntheseDevis.js';

function formaterDate(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const jour = String(d.getDate()).padStart(2, '0');
  const mois = String(d.getMonth() + 1).padStart(2, '0');
  const heures = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${jour}/${mois}/${d.getFullYear()} ${heures}:${minutes}`;
}

function LigneDevis({ ligne, onModifier, onComparer, onSupprimer }) {
  const [ouvert, setOuvert] = useState(false);
  const [confirmationDemandee, setConfirmationDemandee] = useState(false);
  const [enSuppression, setEnSuppression] = useState(false);
  const totalTTC = ligne.resultat?.totalTTC;

  const supprimer = async () => {
    setEnSuppression(true);
    const { error } = await onSupprimer(ligne.id);
    if (error) {
      setEnSuppression(false);
      setConfirmationDemandee(false);
    }
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
          {confirmationDemandee ? (
            <View style={styles.confirmation}>
              <Text style={styles.confirmationTexte}>Supprimer ce devis ? Action irréversible.</Text>
              <View style={styles.ligneActions}>
                <TouchableOpacity onPress={() => setConfirmationDemandee(false)} disabled={enSuppression}>
                  <Text style={styles.lienModifier}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={supprimer} disabled={enSuppression}>
                  <Text style={styles.lienSupprimer}>{enSuppression ? 'Suppression…' : 'Oui, supprimer'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.ligneActions}>
              <TouchableOpacity onPress={() => onModifier(ligne)}>
                <Text style={styles.lienModifier}>Modifier ce devis</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => onComparer(ligne)}>
                <Text style={styles.lienModifier}>Comparer des fournisseurs</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setConfirmationDemandee(true)}>
                <Text style={styles.lienSupprimer}>Supprimer</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      ) : null}
    </View>
  );
}

export default function HistoriqueDevisScreen({ userId, onModifier, onComparer }) {
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
            <LigneDevis
              key={ligne.id}
              ligne={ligne}
              onModifier={onModifier}
              onComparer={onComparer}
              onSupprimer={supprimer}
            />
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
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  lienModifier: { color: colors.primary, fontWeight: '600', fontSize: 13 },
  lienSupprimer: { color: colors.danger, fontWeight: '600', fontSize: 13 },
  confirmation: {
    marginTop: spacing.md,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: radius.sm,
    padding: spacing.sm,
  },
  confirmationTexte: { ...typography.body, color: colors.danger, marginBottom: spacing.sm },
});
