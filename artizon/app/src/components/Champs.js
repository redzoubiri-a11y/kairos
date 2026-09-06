import { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { colors, radius, spacing, typography } from '../theme.js';

/**
 * Primitives de formulaire partagées entre les écrans de l'app.
 * Aucune couleur ni taille en dur ici : tout passe par theme.js.
 */

export function versAffichagePourcent(valeurDecimale) {
  if (valeurDecimale === undefined || valeurDecimale === null || Number.isNaN(valeurDecimale)) {
    return '';
  }
  const points = valeurDecimale * 100;
  return Number.isInteger(points) ? String(points) : points.toFixed(1).replace('.', ',');
}

export function depuisSaisiePourcent(saisie) {
  const normalisee = saisie.replace(',', '.').trim();
  if (normalisee === '') return 0;
  const valeur = Number(normalisee);
  return Number.isFinite(valeur) ? valeur / 100 : null;
}

export function versAffichageNombre(valeur) {
  if (valeur === undefined || valeur === null || Number.isNaN(valeur)) return '';
  return String(valeur).replace('.', ',');
}

export function depuisSaisieNombre(saisie) {
  const normalisee = saisie.replace(',', '.').trim();
  if (normalisee === '') return 0;
  const valeur = Number(normalisee);
  return Number.isFinite(valeur) ? valeur : null;
}

export function SectionTitre({ children }) {
  return <Text style={styles.sectionTitre}>{children}</Text>;
}

export function Aide({ children, couleur }) {
  return <Text style={[styles.aide, couleur ? { color: couleur } : null]}>{children}</Text>;
}

/** Champ texte simple, sans conversion — pour le texte libre (nom, SIRET...). */
export function ChampTexte({ label, valeur, onChangeText, placeholder, clavier }) {
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
export function ChampNombre({
  label,
  valeur,
  onChangeValeur,
  suffixe,
  aide,
  versAffichage = versAffichageNombre,
  depuisSaisie = depuisSaisieNombre,
}) {
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

/** Sélecteur à puces, pour un choix fermé parmi quelques options. */
export function ChoixChips({ label, options, valeur, onChangeValeur, aide }) {
  return (
    <View style={styles.champ}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.ligneChips}>
        {options.map((option) => {
          const selectionne = option.value === valeur;
          return (
            <TouchableOpacity
              key={option.value}
              onPress={() => onChangeValeur(option.value)}
              style={[styles.chip, selectionne && styles.chipSelectionne]}
            >
              <Text style={[styles.chipTexte, selectionne && styles.chipTexteSelectionne]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {aide ? <Aide>{aide}</Aide> : null}
    </View>
  );
}

export const styles = StyleSheet.create({
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
});
