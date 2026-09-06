import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '../theme.js';
import { formaterEuros, formaterPourcent } from '../lib/format.js';
import { Aide } from './Champs.js';

/**
 * Rendu de la chaîne de calcul d'un devis — utilisé à l'écran (devis en
 * cours de saisie) comme dans l'historique (devis déjà enregistré, même
 * forme de résultat rejouée telle quelle, jamais recalculée).
 */
const COULEUR_NIVEAU = {
  bloquant: colors.danger,
  alerte: colors.warning,
  normal: colors.success,
  indetermine: colors.textMuted,
};

function LigneResultat({ label, valeur, gras }) {
  return (
    <View style={styles.ligneResultat}>
      <Text style={styles.labelResultat}>{label}</Text>
      <Text style={[styles.valeurResultat, gras && styles.valeurResultatGras]}>{valeur}</Text>
    </View>
  );
}

export default function SyntheseDevis({ devis, resultat }) {
  if (resultat.erreurParametres) {
    return (
      <View style={[styles.carteSynthese, styles.carteErreur]}>
        <Text style={styles.titreErreur}>Paramètres invalides</Text>
        <Text style={styles.texteErreurSynthese}>{resultat.erreurParametres}</Text>
      </View>
    );
  }

  const { chaine, lectureCoefficient, tva, totalTTC, debourseSec } = resultat;
  const couleurNiveau = COULEUR_NIVEAU[lectureCoefficient?.niveau] ?? colors.textMuted;

  return (
    <View style={styles.carteSynthese}>
      <LigneResultat label="Déboursé sec" valeur={formaterEuros(debourseSec)} />
      <LigneResultat label="Prix de revient" valeur={formaterEuros(chaine.prixRevient)} />
      <LigneResultat label="Frais généraux" valeur={formaterEuros(chaine.fraisGeneraux)} />
      <LigneResultat label="Aléas" valeur={formaterEuros(chaine.aleas)} />
      <LigneResultat label="Marge" valeur={formaterEuros(chaine.marge)} />
      <View style={styles.separateur} />
      <LigneResultat label="Prix de vente HT" valeur={formaterEuros(chaine.prixVente)} gras />

      <View style={[styles.puceNiveau, { borderColor: couleurNiveau }]}>
        <Text style={[styles.puceNiveauTexte, { color: couleurNiveau }]}>
          Coefficient {chaine.coefficient?.toFixed(2)} — {lectureCoefficient.message}
        </Text>
      </View>

      {!devis.fourniture.ferme && devis.fourniture.prix > 0 && (
        <Text style={styles.notePrixEstime}>
          Prix fourniture non confirmé par un devis fournisseur — à valider avant remise.
        </Text>
      )}

      <View style={styles.separateur} />
      <LigneResultat
        label={`TVA (${formaterPourcent(tva.taux, 1)})`}
        valeur={formaterEuros(chaine.prixVente * tva.taux)}
      />
      <LigneResultat label="Total TTC" valeur={formaterEuros(totalTTC)} gras />
      <Aide>{tva.motif}</Aide>
      {tva.conditions?.map((c) => (
        <Aide key={c}>• {c}</Aide>
      ))}
      {tva.alertes?.map((a) => (
        <Aide key={a} couleur={colors.warning}>
          {a}
        </Aide>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  carteSynthese: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  carteErreur: { borderColor: colors.danger },
  titreErreur: { ...typography.sectionTitle, color: colors.danger, marginBottom: spacing.xs },
  texteErreurSynthese: { ...typography.body, color: colors.danger },
  ligneResultat: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  labelResultat: { ...typography.label },
  valeurResultat: { ...typography.body },
  valeurResultatGras: { fontWeight: '700', fontSize: 16 },
  separateur: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
  puceNiveau: {
    borderWidth: 1,
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginTop: spacing.sm,
  },
  puceNiveauTexte: { fontSize: 13, fontWeight: '600' },
  notePrixEstime: { ...typography.hint, color: colors.warning, marginTop: spacing.sm },
});
