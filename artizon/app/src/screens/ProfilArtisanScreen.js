import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, radius, spacing, typography } from '../theme.js';
import { calculerFraisGeneraux, useProfilArtisan } from '../hooks/useProfilArtisan.js';

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

function versAffichagePourcent(valeurDecimale) {
  if (valeurDecimale === undefined || valeurDecimale === null || Number.isNaN(valeurDecimale)) {
    return '';
  }
  const points = valeurDecimale * 100;
  return Number.isInteger(points) ? String(points) : points.toFixed(1).replace('.', ',');
}

function depuisSaisiePourcent(saisie) {
  const normalisee = saisie.replace(',', '.').trim();
  if (normalisee === '') return 0;
  const valeur = Number(normalisee);
  return Number.isFinite(valeur) ? valeur / 100 : null;
}

function versAffichageNombre(valeur) {
  if (valeur === undefined || valeur === null || Number.isNaN(valeur)) return '';
  return String(valeur).replace('.', ',');
}

function depuisSaisieNombre(saisie) {
  const normalisee = saisie.replace(',', '.').trim();
  if (normalisee === '') return 0;
  const valeur = Number(normalisee);
  return Number.isFinite(valeur) ? valeur : null;
}

function SectionTitre({ children }) {
  return <Text style={styles.sectionTitre}>{children}</Text>;
}

function Aide({ children }) {
  return <Text style={styles.aide}>{children}</Text>;
}

/** Champ texte simple, sans conversion — pour le texte libre (nom, SIRET...). */
function ChampTexte({ label, valeur, onChangeText, placeholder, clavier }) {
  return (
    <View style={styles.champ}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.saisie}
        value={valeur}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        keyboardType={clavier}
        autoCapitalize="none"
      />
    </View>
  );
}

/**
 * Champ numérique : garde une chaîne locale pendant la saisie (pour ne pas
 * reformater sous les doigts de l'utilisateur), et ne remonte la valeur
 * numérique au parent qu'une fois la saisie valide.
 */
function ChampNombre({ label, valeur, onChangeValeur, suffixe, aide, versAffichage, depuisSaisie }) {
  const [texte, setTexte] = useState(() => versAffichage(valeur));
  const [aEteModifie, setAEteModifie] = useState(false);

  const affiche = aEteModifie ? texte : versAffichage(valeur);

  return (
    <View style={styles.champ}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.ligneSaisieSuffixe}>
        <TextInput
          style={[styles.saisie, styles.saisieAvecSuffixe]}
          value={affiche}
          onChangeText={(t) => {
            setTexte(t);
            setAEteModifie(true);
            const parsed = depuisSaisie(t);
            if (parsed !== null) onChangeValeur(parsed);
          }}
          onBlur={() => setAEteModifie(false)}
          keyboardType="numeric"
          placeholder="0"
          placeholderTextColor={colors.textMuted}
        />
        {suffixe ? <Text style={styles.suffixe}>{suffixe}</Text> : null}
      </View>
      {aide ? <Aide>{aide}</Aide> : null}
    </View>
  );
}

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

export default function ProfilArtisanScreen() {
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
  } = useProfilArtisan();

  if (enChargement || !profil) {
    return (
      <SafeAreaView style={styles.conteneurChargement}>
        <ActivityIndicator color={colors.primary} />
      </SafeAreaView>
    );
  }

  const enregistrer = async () => {
    await sauvegarder();
    if (!erreur) Alert.alert('Profil enregistré', 'Ces paramètres serviront de base à tes prochains devis.');
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
            versAffichage={versAffichageNombre}
            depuisSaisie={depuisSaisieNombre}
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
          depuisSaisie={depuisSaisiePourcent}
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
            versAffichage={versAffichagePourcent}
            depuisSaisie={depuisSaisiePourcent}
          />
        ))}

        <TouchableOpacity
          style={styles.boutonPrincipal}
          onPress={enregistrer}
          disabled={enSauvegarde}
        >
          {enSauvegarde ? (
            <ActivityIndicator color={colors.surface} />
          ) : (
            <Text style={styles.boutonPrincipalTexte}>Enregistrer</Text>
          )}
        </TouchableOpacity>

        {erreur ? <Text style={styles.texteErreur}>Échec de l'enregistrement — réessaie.</Text> : null}
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
  sectionTitre: { ...typography.sectionTitle, marginTop: spacing.lg, marginBottom: spacing.sm },
  aide: { ...typography.hint, marginBottom: spacing.sm },
  champ: { marginBottom: spacing.md },
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
  ligneSaisieSuffixe: { flexDirection: 'row', alignItems: 'center' },
  saisieAvecSuffixe: { flex: 1 },
  suffixe: { ...typography.label, marginLeft: spacing.sm },
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
});
