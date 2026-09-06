import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { colors, radius, spacing, typography } from '../theme.js';
import { ChampTexte } from './Champs.js';

/**
 * Choix rapide parmi les clients déjà enregistrés par l'artisan, plus un
 * petit formulaire pour en enregistrer un nouveau — évite de retaper (et de
 * perdre le téléphone/l'adresse) à chaque devis pour un client récurrent.
 */
export default function SelectionClient({ clients, nomActuel, onChoisir, onCreer }) {
  const [formulaireOuvert, setFormulaireOuvert] = useState(false);
  const [nom, setNom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [adresse, setAdresse] = useState('');
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState(null);

  const ouvrirFormulaire = () => {
    setNom(nomActuel || '');
    setTelephone('');
    setAdresse('');
    setErreur(null);
    setFormulaireOuvert(true);
  };

  const enregistrer = async () => {
    if (!nom.trim()) {
      setErreur('Nom requis');
      return;
    }
    setEnCours(true);
    setErreur(null);
    const { error } = await onCreer({ nom, telephone, adresse });
    setEnCours(false);
    if (error) {
      setErreur("Échec de l'enregistrement — réessaie.");
      return;
    }
    setFormulaireOuvert(false);
  };

  return (
    <View>
      {clients.length > 0 ? (
        <View style={styles.champ}>
          <Text style={styles.label}>Client existant</Text>
          <View style={styles.ligneChips}>
            {clients.map((c) => {
              const selectionne = c.nom === nomActuel;
              return (
                <TouchableOpacity
                  key={c.id}
                  onPress={() => onChoisir(c)}
                  style={[styles.chip, selectionne && styles.chipSelectionne]}
                >
                  <Text style={[styles.chipTexte, selectionne && styles.chipTexteSelectionne]}>{c.nom}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ) : null}

      {formulaireOuvert ? (
        <View style={styles.formulaire}>
          <ChampTexte label="Nom" valeur={nom} onChangeText={setNom} placeholder="Ex. M. Khelifi" />
          <ChampTexte
            label="Téléphone"
            valeur={telephone}
            onChangeText={setTelephone}
            placeholder="Ex. 06 12 34 56 78"
            clavier="phone-pad"
          />
          <ChampTexte
            label="Adresse"
            valeur={adresse}
            onChangeText={setAdresse}
            placeholder="Ex. 12 rue des Lilas, Dreux"
          />
          {erreur ? <Text style={styles.erreur}>{erreur}</Text> : null}
          <View style={styles.ligneBoutons}>
            <TouchableOpacity onPress={() => setFormulaireOuvert(false)} style={styles.boutonAnnuler}>
              <Text style={styles.boutonAnnulerTexte}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={enregistrer}
              disabled={enCours}
              style={[styles.boutonEnregistrer, enCours && styles.boutonDesactive]}
            >
              <Text style={styles.boutonEnregistrerTexte}>
                {enCours ? 'Enregistrement…' : 'Enregistrer ce client'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity onPress={ouvrirFormulaire} style={styles.lien}>
          <Text style={styles.lienTexte}>+ Enregistrer comme nouveau client</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  champ: { marginBottom: spacing.md },
  label: { ...typography.label, marginBottom: spacing.xs },
  ligneChips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surface,
  },
  chipSelectionne: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipTexte: { ...typography.body, fontSize: 13, color: colors.text },
  chipTexteSelectionne: { color: colors.surface, fontWeight: '600' },
  lien: { marginTop: spacing.xs, marginBottom: spacing.md, alignSelf: 'flex-start' },
  lienTexte: { color: colors.primary, fontWeight: '600', fontSize: 13 },
  formulaire: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  erreur: { ...typography.hint, color: colors.danger, marginBottom: spacing.sm },
  ligneBoutons: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  boutonAnnuler: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  boutonAnnulerTexte: { ...typography.body, fontSize: 13, fontWeight: '600' },
  boutonEnregistrer: {
    flex: 2,
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  boutonDesactive: { opacity: 0.6 },
  boutonEnregistrerTexte: { color: colors.surface, fontWeight: '600', fontSize: 13 },
});
