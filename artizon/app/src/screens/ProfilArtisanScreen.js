import { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, radius, spacing, typography } from '../theme.js';
import { calculerFraisGeneraux, useProfilArtisan } from '../hooks/useProfilArtisan.js';
import {
  Aide,
  ChampNombre,
  ChampTexte,
  SectionTitre,
  depuisSaisieNombre,
  versAffichagePourcent,
} from '../components/Champs.js';

const LIBELLES_COUT_HORAIRE = {
  apprenti: 'Apprenti',
  ouvrierSpecialise: 'Ouvrier spécialisé',
  ouvrierQualifie: 'Ouvrier qualifié',
  ouvrierHautementQualifie: 'Ouvrier hautement qualifié',
  chefEquipe: "Chef d'équipe",
};

const LIBELLES_PARAMETRES = {
  fraisChantier: {
    label: 'Frais de chantier',
    aide: "Installation, encadrement — laisser à 0 si chiffrés poste par poste.",
  },
  aleas: {
    label: 'Aléas par défaut',
    aide: 'Rénovation sur existant non sondé : 6 à 10 %. Neuf, dossier complet : 1 à 2 %.',
  },
  marge: {
    label: 'Marge visée par défaut',
    aide: 'Marché privé standard : 7 à 12 %. Ajustable affaire par affaire.',
  },
};

function CalculateurFraisGeneraux({ onAppliquer }) {
  const [ca, setCa] = useState('');
  const [charges, setCharges] = useState('');

  const resultat = calculerFraisGeneraux({
    chiffreAffaires: depuisSaisieNombre(ca) ?? 0,
    chargesStructure: depuisSaisieNombre(charges) ?? 0,
  });

  return (
    <View style={styles.calculateur}>
      <Text style={styles.calculateurTitre}>Je ne connais pas mon %, je le calcule</Text>
      <Text style={styles.aide}>
        %FG = charges de structure de l'année / chiffre d'affaires de l'année. Ces charges ne
        comptent pas les matériaux ni la main-d'œuvre de chantier, déjà dans le déboursé.
      </Text>
      <View style={styles.ligneCalculateur}>
        <View style={styles.champCalculateur}>
          <Text style={styles.label}>Chiffre d'affaires annuel</Text>
          <TextInput
            style={styles.saisie}
            value={ca}
            onChangeText={setCa}
            keyboardType="numeric"
            placeholder="280000"
            placeholderTextColor={colors.textMuted}
          />
        </View>
        <View style={styles.champCalculateur}>
          <Text style={styles.label}>Charges de structure</Text>
          <TextInput
            style={styles.saisie}
            value={charges}
            onChangeText={setCharges}
            keyboardType="numeric"
            placeholder="33600"
            placeholderTextColor={colors.textMuted}
          />
        </View>
      </View>
      {resultat !== null && (
        <View style={styles.resultatCalculateur}>
          <Text style={styles.resultatTexte}>Frais généraux calculés : {versAffichagePourcent(resultat)} %</Text>
          <TouchableOpacity style={styles.boutonSecondaire} onPress={() => onAppliquer(resultat)}>
            <Text style={styles.boutonSecondaireTexte}>Utiliser ce %</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

export default function ProfilArtisanScreen({ userId, deconnecter }) {
  const {
    profil,
    enChargement,
    enSauvegarde,
    erreur,
    mettreAJourEntreprise,
    mettreAJourAssurance,
    mettreAJourCoutHoraire,
    mettreAJourParametre,
    sauvegarder,
  } = useProfilArtisan(userId);

  if (enChargement || !profil) {
    return (
      <SafeAreaView style={styles.conteneurChargement}>
        <ActivityIndicator color={colors.primary} />
      </SafeAreaView>
    );
  }

  const enregistrer = async () => {
    const { error } = await sauvegarder();
    if (!error) {
      Alert.alert('Profil enregistré', 'Ces paramètres serviront de base à tes prochains devis.');
    }
  };

  return (
    <SafeAreaView style={styles.conteneur} edges={['top']}>
      <ScrollView contentContainerStyle={styles.contenu} keyboardShouldPersistTaps="handled">
        <Text style={styles.titre}>Mon profil artisan</Text>
        <Text style={styles.sousTitre}>
          Ces chiffres sont les tiens, pas ceux d'Artizon — ils servent de base à chaque devis que
          tu produis dans l'app.
        </Text>

        <SectionTitre>Mon entreprise</SectionTitre>
        <ChampTexte
          label="Nom de l'entreprise"
          valeur={profil.entreprise.nom}
          onChangeText={(v) => mettreAJourEntreprise({ nom: v })}
          placeholder="Ex. Menuiserie Dupont"
        />
        <ChampTexte
          label="Forme juridique"
          valeur={profil.entreprise.forme}
          onChangeText={(v) => mettreAJourEntreprise({ forme: v })}
          placeholder="Ex. EURL, SARL, auto-entrepreneur"
        />
        <ChampTexte
          label="SIRET"
          valeur={profil.entreprise.siret}
          onChangeText={(v) => mettreAJourEntreprise({ siret: v })}
          placeholder="14 chiffres"
          clavier="numeric"
        />
        <ChampTexte
          label="N° TVA intracommunautaire"
          valeur={profil.entreprise.tvaIntracommunautaire}
          onChangeText={(v) => mettreAJourEntreprise({ tvaIntracommunautaire: v })}
          placeholder="FR00000000000"
        />

        <SectionTitre>Assurance décennale</SectionTitre>
        <Aide>Obligatoire sur chaque devis — mention légale, pas optionnelle.</Aide>
        <ChampTexte
          label="Assureur"
          valeur={profil.entreprise.assuranceDecennale.assureur}
          onChangeText={(v) => mettreAJourAssurance({ assureur: v })}
          placeholder="Nom de la compagnie"
        />
        <ChampTexte
          label="N° de contrat"
          valeur={profil.entreprise.assuranceDecennale.contrat}
          onChangeText={(v) => mettreAJourAssurance({ contrat: v })}
          placeholder="Référence du contrat"
        />
        <ChampTexte
          label="Couverture géographique"
          valeur={profil.entreprise.assuranceDecennale.couvertureGeographique}
          onChangeText={(v) => mettreAJourAssurance({ couvertureGeographique: v })}
          placeholder="France métropolitaine"
        />

        <SectionTitre>Coût horaire par catégorie</SectionTitre>
        <Aide>
          Le coût réel d'une heure de travail, tout compris — pas le salaire. Charges patronales,
          congés payés BTP, paniers, trajets, temps improductif inclus.
        </Aide>
        {Object.entries(LIBELLES_COUT_HORAIRE).map(([cle, label]) => (
          <ChampNombre
            key={cle}
            label={label}
            valeur={profil.coutHoraire[cle]}
            onChangeValeur={(v) => mettreAJourCoutHoraire(cle, v)}
            suffixe="€/h"
          />
        ))}

        <SectionTitre>Frais généraux</SectionTitre>
        <ChampNombre
          label="Frais généraux"
          valeur={profil.parametresDefaut.fraisGeneraux}
          onChangeValeur={(v) => mettreAJourParametre('fraisGeneraux', v)}
          suffixe="%"
          aide="Se constate sur le compte de résultat, ne se devine pas. Repère : 8-14 % en artisanal, 12-20 % avec bureau d'études."
          versAffichage={versAffichagePourcent}
          depuisSaisie={depuisSaisieNombre}
        />
        <CalculateurFraisGeneraux
          onAppliquer={(valeur) => mettreAJourParametre('fraisGeneraux', valeur)}
        />

        <SectionTitre>Paramètres par défaut</SectionTitre>
        <Aide>Pré-remplissent chaque nouveau devis — modifiables affaire par affaire.</Aide>
        {Object.entries(LIBELLES_PARAMETRES).map(([cle, { label, aide }]) => (
          <ChampNombre
            key={cle}
            label={label}
            valeur={profil.parametresDefaut[cle]}
            onChangeValeur={(v) => mettreAJourParametre(cle, v)}
            suffixe="%"
            aide={aide}
          />
        ))}

        <TouchableOpacity style={styles.boutonPrincipal} onPress={enregistrer} disabled={enSauvegarde}>
          {enSauvegarde ? (
            <ActivityIndicator color={colors.surface} />
          ) : (
            <Text style={styles.boutonPrincipalTexte}>Enregistrer</Text>
          )}
        </TouchableOpacity>

        {erreur ? <Text style={styles.texteErreur}>Échec de l'enregistrement — réessaie.</Text> : null}

        <TouchableOpacity style={styles.boutonDeconnexion} onPress={deconnecter}>
          <Text style={styles.texteDeconnexion}>Se déconnecter</Text>
        </TouchableOpacity>
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
  aide: { ...typography.hint, marginBottom: spacing.sm },
  label: { ...typography.label, marginBottom: spacing.xs },
  saisie: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.body,
  },
  calculateur: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  calculateurTitre: { ...typography.sectionTitle, fontSize: 14, marginBottom: spacing.xs },
  ligneCalculateur: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  champCalculateur: { flex: 1 },
  resultatCalculateur: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  resultatTexte: { ...typography.body, fontWeight: '600' },
  boutonSecondaire: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  boutonSecondaireTexte: { color: colors.primary, fontWeight: '600' },
  boutonPrincipal: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  boutonPrincipalTexte: { color: colors.surface, fontWeight: '700', fontSize: 16 },
  texteErreur: { color: colors.danger, marginTop: spacing.sm, textAlign: 'center' },
  boutonDeconnexion: { marginTop: spacing.xl, alignItems: 'center' },
  texteDeconnexion: { color: colors.danger, fontWeight: '600' },
});
