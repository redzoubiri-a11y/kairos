import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, radius, spacing, typography } from '../theme.js';
import { useProfilArtisan } from '../hooks/useProfilArtisan.js';
import { useDevis } from '../hooks/useDevis.js';
import { useClients } from '../hooks/useClients.js';
import { formaterEuros } from '../lib/format.js';
import { genererDevisHtml } from '../lib/genererDevisHtml.js';
import { genererEtPartagerPdfDevis } from '../lib/genererPdfDevis.js';
import { Aide, ChampNombre, ChampTexte, ChoixChips, SectionTitre } from '../components/Champs.js';
import ComparateurFournisseurs from '../components/ComparateurFournisseurs.js';
import SelectionClient from '../components/SelectionClient.js';
import SyntheseDevis from '../components/SyntheseDevis.js';

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

export default function NouveauDevisScreen({ userId, devisExistant, onFinModification }) {
  const { profil, enChargement } = useProfilArtisan(userId);

  if (enChargement || !profil) {
    return (
      <SafeAreaView style={styles.conteneurChargement}>
        <ActivityIndicator color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <FormulaireDevis
      profil={profil}
      userId={userId}
      devisExistant={devisExistant}
      onFinModification={onFinModification}
    />
  );
}

function FormulaireDevis({ profil, userId, devisExistant, onFinModification }) {
  const {
    devis,
    resultat,
    enEnregistrement,
    erreurEnregistrement,
    devisEnregistre,
    estModification,
    mettreAJourClient,
    mettreAJourOuvrage,
    mettreAJourFourniture,
    mettreAJourLignePose,
    ajouterLignePose,
    retirerLignePose,
    mettreAJourParametre,
    mettreAJourTva,
    enregistrer,
  } = useDevis(profil, userId, devisExistant);
  const { clients, ajouter: ajouterClient } = useClients(userId);
  const [afficherComparateur, setAfficherComparateur] = useState(false);
  const [enGenerationPdf, setEnGenerationPdf] = useState(false);
  const [erreurPdf, setErreurPdf] = useState(false);

  const validerEnregistrement = async () => {
    const { error } = await enregistrer();
    if (!error) onFinModification?.();
  };

  const envoyerPdf = async () => {
    setEnGenerationPdf(true);
    setErreurPdf(false);
    try {
      const html = genererDevisHtml({ profil, devis, resultat });
      await genererEtPartagerPdfDevis(html);
    } catch {
      setErreurPdf(true);
    } finally {
      setEnGenerationPdf(false);
    }
  };

  return (
    <SafeAreaView style={styles.conteneur} edges={['top']}>
      <ScrollView contentContainerStyle={styles.contenu} keyboardShouldPersistTaps="handled">
        <Text style={styles.titre}>{estModification ? 'Modifier le devis' : 'Nouveau devis'}</Text>
        <Text style={styles.sousTitre}>
          Une fourniture achetée chez un fabricant, ta pose, ta marge — le prix à remettre à ton
          client.
        </Text>
        {estModification ? (
          <View style={styles.bandeauModification}>
            <Text style={styles.bandeauModificationTexte}>Modification d'un devis existant</Text>
            <TouchableOpacity onPress={() => onFinModification?.()}>
              <Text style={styles.lienAnnulerModification}>Annuler</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <SectionTitre>Client</SectionTitre>
        <ChampTexte
          label="Nom du client"
          valeur={devis.client.nom}
          onChangeText={(v) => mettreAJourClient({ nom: v })}
          placeholder="Ex. M. Khelifi"
        />
        <SelectionClient
          clients={clients}
          nomActuel={devis.client.nom}
          onChoisir={(c) => mettreAJourClient({ nom: c.nom })}
          onCreer={ajouterClient}
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
        <SyntheseDevis devis={devis} resultat={resultat} />

        <TouchableOpacity
          style={[styles.boutonPrincipal, (enEnregistrement || Boolean(resultat.erreurParametres)) && styles.boutonDesactive]}
          onPress={validerEnregistrement}
          disabled={enEnregistrement || Boolean(resultat.erreurParametres)}
        >
          {enEnregistrement ? (
            <ActivityIndicator color={colors.surface} />
          ) : (
            <Text style={styles.boutonPrincipalTexte}>
              {devisEnregistre
                ? estModification
                  ? 'Devis mis à jour ✓'
                  : 'Devis enregistré ✓'
                : estModification
                  ? 'Mettre à jour ce devis'
                  : 'Enregistrer ce devis'}
            </Text>
          )}
        </TouchableOpacity>
        {erreurEnregistrement ? (
          <Text style={styles.notePrixEstime}>Échec de l'enregistrement — réessaie.</Text>
        ) : null}

        <TouchableOpacity
          style={[
            styles.boutonSecondaire,
            (enGenerationPdf || Boolean(resultat.erreurParametres)) && styles.boutonDesactive,
          ]}
          onPress={envoyerPdf}
          disabled={enGenerationPdf || Boolean(resultat.erreurParametres)}
        >
          {enGenerationPdf ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <Text style={styles.boutonSecondaireTexte}>Envoyer le devis (PDF)</Text>
          )}
        </TouchableOpacity>
        {erreurPdf ? <Text style={styles.notePrixEstime}>Échec de la génération du PDF — réessaie.</Text> : null}
        {!profil.entreprise.nom || !profil.entreprise.siret ? (
          <Text style={styles.notePrixEstime}>
            Complète le nom et le SIRET de ton entreprise dans "Mon profil" — mentions obligatoires sur un devis.
          </Text>
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
  bandeauModification: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginBottom: spacing.lg,
  },
  bandeauModificationTexte: { ...typography.label, color: colors.text },
  lienAnnulerModification: { color: colors.danger, fontWeight: '600', fontSize: 13 },
  lienComparateur: { marginTop: spacing.sm, alignSelf: 'flex-start' },
  lienComparateurTexte: { color: colors.primary, fontWeight: '600', fontSize: 13 },
  separateurLigne: { height: 1, backgroundColor: colors.border, marginVertical: spacing.md },
  retirerLigne: { color: colors.danger, fontSize: 13, marginTop: -spacing.xs, marginBottom: spacing.sm },
  lienAjouterOuvrier: { marginTop: spacing.xs, marginBottom: spacing.sm, alignSelf: 'flex-start' },
  lienAjouterOuvrierTexte: { color: colors.primary, fontWeight: '600', fontSize: 13 },
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
  boutonSecondaire: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  boutonSecondaireTexte: { color: colors.primary, fontWeight: '700', fontSize: 16 },
});
