import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, radius, spacing, typography } from '../theme.js';
import { useProfilArtisan } from '../hooks/useProfilArtisan.js';
import { useDevis } from '../hooks/useDevis.js';
import { formaterEuros, formaterPourcent } from '../lib/format.js';
import { Aide, ChampNombre, ChampTexte, ChoixChips, SectionTitre } from '../components/Champs.js';
import ComparateurFournisseurs from '../components/ComparateurFournisseurs.js';

const OPTIONS_CATEGORIE = [
  { value: 'apprenti', label: 'Apprenti' },
  { value: 'ouvrierSpecialise', label: 'Ouvrier spécialisé' },
  { value: 'ouvrierQualifie', label: 'Ouvrier qualifié' },
  { value: 'ouvrierHautementQualifie', label: 'Ouvrier hautement qualifié' },
  { value: 'chefEquipe', label: "Chef d'équipe" },
];

const OPTIONS_FERMETE = [
  { value: true, label: 'Devis fournisseur ferme' },
  { value: false, label: 'Estimation à confirmer' },
];

const OPTIONS_TYPE_LOCAL = [
  { value: 'habitation', label: 'Habitation' },
  { value: 'professionnel', label: 'Professionnel' },
];

const OPTIONS_NATURE_TRAVAUX = [
  { value: 'amelioration', label: 'Amélioration' },
  { value: 'renovation_energetique', label: 'Rénovation énergétique' },
  { value: 'entretien', label: 'Entretien' },
  { value: 'neuf', label: 'Neuf' },
];

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

function Synthese({ devis, resultat }) {
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

export default function NouveauDevisScreen({ userId }) {
  const { profil, enChargement } = useProfilArtisan(userId);

  if (enChargement || !profil) {
    return (
      <SafeAreaView style={styles.conteneurChargement}>
        <ActivityIndicator color={colors.primary} />
      </SafeAreaView>
    );
  }

  return <FormulaireDevis profil={profil} userId={userId} />;
}

function FormulaireDevis({ profil, userId }) {
  const {
    devis,
    resultat,
    enEnregistrement,
    erreurEnregistrement,
    devisEnregistre,
    mettreAJourClient,
    mettreAJourOuvrage,
    mettreAJourFourniture,
    mettreAJourLignePose,
    ajouterLignePose,
    retirerLignePose,
    mettreAJourParametre,
    mettreAJourTva,
    enregistrer,
  } = useDevis(profil, userId);
  const [afficherComparateur, setAfficherComparateur] = useState(false);

  return (
    <SafeAreaView style={styles.conteneur} edges={['top']}>
      <ScrollView contentContainerStyle={styles.contenu} keyboardShouldPersistTaps="handled">
        <Text style={styles.titre}>Nouveau devis</Text>
        <Text style={styles.sousTitre}>
          Une fourniture achetée chez un fabricant, ta pose, ta marge — le prix à remettre à ton
          client.
        </Text>

        <SectionTitre>Client</SectionTitre>
        <ChampTexte
          label="Nom du client"
          valeur={devis.client.nom}
          onChangeText={(v) => mettreAJourClient({ nom: v })}
          placeholder="Ex. M. Khelifi"
        />

        <SectionTitre>Prestation</SectionTitre>
        <ChampTexte
          label="Description"
          valeur={devis.ouvrage.libelle}
          onChangeText={(v) => mettreAJourOuvrage({ libelle: v })}
          placeholder="Ex. Escalier quart tournant haut droit, hêtre"
        />

        <SectionTitre>Fourniture</SectionTitre>
        <ChampNombre
          label="Prix d'achat fournisseur"
          valeur={devis.fourniture.prix}
          onChangeValeur={(v) => mettreAJourFourniture({ prix: v })}
          suffixe="€"
        />
        <ChoixChips
          options={OPTIONS_FERMETE}
          valeur={devis.fourniture.ferme}
          onChangeValeur={(v) => mettreAJourFourniture({ ferme: v })}
        />
        <TouchableOpacity onPress={() => setAfficherComparateur((v) => !v)} style={styles.lienComparateur}>
          <Text style={styles.lienComparateurTexte}>
            {afficherComparateur ? 'Masquer le comparateur' : 'Comparer plusieurs fournisseurs'}
          </Text>
        </TouchableOpacity>
        {afficherComparateur ? (
          <ComparateurFournisseurs
            libelleOuvrage={devis.ouvrage.libelle}
            onChoisir={(choix) => {
              mettreAJourFourniture({ prix: choix.prix, ferme: true });
              setAfficherComparateur(false);
            }}
            onFermer={() => setAfficherComparateur(false)}
          />
        ) : null}

        <SectionTitre>Pose</SectionTitre>
        {devis.pose.lignes.map((ligne, index) => (
          <View key={index}>
            {index > 0 ? <View style={styles.separateurLigne} /> : null}
            <ChampNombre
              label={devis.pose.lignes.length > 1 ? `Temps de pose — ouvrier ${index + 1}` : 'Temps de pose'}
              valeur={ligne.heures}
              onChangeValeur={(v) => mettreAJourLignePose(index, { heures: v })}
              suffixe="h"
            />
            <ChoixChips
              label="Qui pose ?"
              options={OPTIONS_CATEGORIE}
              valeur={ligne.categorie}
              onChangeValeur={(v) => mettreAJourLignePose(index, { categorie: v })}
              aide={`Coût horaire retenu : ${formaterEuros(resultat.lignesMainOeuvre[index]?.coutHoraire ?? 0)}/h — modifiable dans ton profil.`}
            />
            {devis.pose.lignes.length > 1 ? (
              <TouchableOpacity onPress={() => retirerLignePose(index)}>
                <Text style={styles.retirerLigne}>Retirer cet ouvrier</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ))}
        <TouchableOpacity onPress={ajouterLignePose} style={styles.lienAjouterOuvrier}>
          <Text style={styles.lienAjouterOuvrierTexte}>+ Ajouter un ouvrier</Text>
        </TouchableOpacity>
        {devis.pose.lignes.length > 1 ? (
          <Aide>
            Total pose : {resultat.heuresTotal} h — {formaterEuros(resultat.mainOeuvre)} de main d'œuvre.
          </Aide>
        ) : null}

        <SectionTitre>Paramètres de l'affaire</SectionTitre>
        <Aide>Pré-remplis depuis ton profil — ajustables pour cette affaire précise.</Aide>
        <ChampNombre
          label="Frais de chantier"
          valeur={devis.parametres.fraisChantier}
          onChangeValeur={(v) => mettreAJourParametre('fraisChantier', v)}
          suffixe="%"
        />
        <ChampNombre
          label="Aléas"
          valeur={devis.parametres.aleas}
          onChangeValeur={(v) => mettreAJourParametre('aleas', v)}
          suffixe="%"
        />
        <ChampNombre
          label="Marge"
          valeur={devis.parametres.marge}
          onChangeValeur={(v) => mettreAJourParametre('marge', v)}
          suffixe="%"
        />

        <SectionTitre>TVA</SectionTitre>
        <ChoixChips
          label="Type de local"
          options={OPTIONS_TYPE_LOCAL}
          valeur={devis.tva.typeLocal}
          onChangeValeur={(v) => mettreAJourTva({ typeLocal: v })}
        />
        <ChampTexte
          label="Âge du logement (années)"
          valeur={String(devis.tva.ageLogementAnnees)}
          onChangeText={(v) => mettreAJourTva({ ageLogementAnnees: v.replace(/[^0-9]/g, '') })}
          placeholder="Ex. 15"
          clavier="numeric"
        />
        <ChoixChips
          label="Nature des travaux"
          options={OPTIONS_NATURE_TRAVAUX}
          valeur={devis.tva.natureTravaux}
          onChangeValeur={(v) => mettreAJourTva({ natureTravaux: v })}
        />

        <SectionTitre>Synthèse</SectionTitre>
        <Synthese devis={devis} resultat={resultat} />

        <TouchableOpacity
          style={[styles.boutonPrincipal, (enEnregistrement || Boolean(resultat.erreurParametres)) && styles.boutonDesactive]}
          onPress={enregistrer}
          disabled={enEnregistrement || Boolean(resultat.erreurParametres)}
        >
          {enEnregistrement ? (
            <ActivityIndicator color={colors.surface} />
          ) : (
            <Text style={styles.boutonPrincipalTexte}>
              {devisEnregistre ? 'Devis enregistré ✓' : 'Enregistrer ce devis'}
            </Text>
          )}
        </TouchableOpacity>
        {erreurEnregistrement ? (
          <Text style={styles.notePrixEstime}>Échec de l'enregistrement — réessaie.</Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, backgroundColor: colors.background },
  conteneurChargement: { flex: 1, backgroundColor: colors.background, justifyContent: 'center' },
  contenu: { padding: spacing.lg, paddingBottom: spacing.xl },
  titre: { ...typography.title, marginBottom: spacing.xs },
  sousTitre: { ...typography.hint, marginBottom: spacing.lg },
  lienComparateur: { marginTop: spacing.sm, alignSelf: 'flex-start' },
  lienComparateurTexte: { color: colors.primary, fontWeight: '600', fontSize: 13 },
  separateurLigne: { height: 1, backgroundColor: colors.border, marginVertical: spacing.md },
  retirerLigne: { color: colors.danger, fontSize: 13, marginTop: -spacing.xs, marginBottom: spacing.sm },
  lienAjouterOuvrier: { marginTop: spacing.xs, marginBottom: spacing.sm, alignSelf: 'flex-start' },
  lienAjouterOuvrierTexte: { color: colors.primary, fontWeight: '600', fontSize: 13 },
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
  boutonPrincipal: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  boutonDesactive: { opacity: 0.6 },
  boutonPrincipalTexte: { color: colors.surface, fontWeight: '700', fontSize: 16 },
});
