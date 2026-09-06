import { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { colors, radius, spacing, typography } from '../theme.js';
import { comparerOffres } from '../lib/moteur.js';
import { formaterEuros, formaterPourcent } from '../lib/format.js';
import { Aide, ChampTexte } from './Champs.js';

/** Référence unique : la fourniture du devis en cours, quantité 1, unité "ens". */
const REF_FOURNITURE = 'fourniture';

function offreVide() {
  return { fournisseur: '', prix: '', delaiJours: '', assuranceDecennale: true };
}

function estValide(offre) {
  return offre.fournisseur.trim() !== '' && Number(offre.prix) > 0;
}

/**
 * Compare 2 à 5 devis reçus pour une même fourniture. Réutilise
 * `comparerOffres` du moteur avec un seul poste de référence — la
 * fourniture en cours — plutôt qu'une nomenclature à plusieurs lignes :
 * c'est le cas d'usage réel de l'écran de devis, un ouvrage à la fois.
 */
export default function ComparateurFournisseurs({ libelleOuvrage, onChoisir, onFermer }) {
  const [offres, setOffres] = useState(() => [offreVide(), offreVide()]);

  const mettreAJour = (index, champs) => {
    setOffres((liste) => liste.map((o, i) => (i === index ? { ...o, ...champs } : o)));
  };

  const ajouter = () => {
    if (offres.length >= 5) return;
    setOffres((liste) => [...liste, offreVide()]);
  };

  const retirer = (index) => setOffres((liste) => liste.filter((_, i) => i !== index));

  const offresValides = offres.filter(estValide);

  const resultat = useMemo(() => {
    if (offresValides.length < 2) return null;
    try {
      return comparerOffres({
        postes: [
          { ref: REF_FOURNITURE, libelle: libelleOuvrage || 'Fourniture', quantite: 1, unite: 'ens' },
        ],
        offres: offresValides.map((o) => ({
          fournisseur: o.fournisseur.trim(),
          lignes: [{ ref: REF_FOURNITURE, prixUnitaire: Number(o.prix), unite: 'ens' }],
          // null et non undefined : comparatif.js teste `=== null` pour repérer
          // un délai non renseigné, une valeur undefined casserait le calcul.
          delaiJours: o.delaiJours ? Number(o.delaiJours) : null,
          assuranceDecennale: o.assuranceDecennale,
        })),
      });
    } catch {
      return null;
    }
  }, [offresValides, libelleOuvrage]);

  return (
    <View style={styles.conteneur}>
      <View style={styles.entete}>
        <Text style={styles.titre}>Comparer plusieurs fournisseurs</Text>
        {onFermer ? (
          <TouchableOpacity onPress={onFermer}>
            <Text style={styles.fermer}>Fermer</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      <Aide>
        Ramène chaque devis reçu sur la même base et repère l'offre incomplète ou anormalement
        basse — celle qui manque une prestation se rattrape toujours en cours de chantier.
      </Aide>

      {offres.map((offre, index) => (
        <View key={index} style={styles.ligneOffre}>
          <View style={styles.champFournisseur}>
            <ChampTexte
              label={`Fournisseur ${index + 1}`}
              valeur={offre.fournisseur}
              onChangeText={(v) => mettreAJour(index, { fournisseur: v })}
              placeholder="Nom"
            />
          </View>
          <View style={styles.champPrix}>
            <Text style={styles.label}>Prix</Text>
            <TextInput
              style={styles.saisie}
              value={offre.prix}
              onChangeText={(v) => mettreAJour(index, { prix: v.replace(',', '.').replace(/[^0-9.]/g, '') })}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={colors.textMuted}
            />
          </View>
          <View style={styles.champDelai}>
            <Text style={styles.label}>Délai (j)</Text>
            <TextInput
              style={styles.saisie}
              value={offre.delaiJours}
              onChangeText={(v) => mettreAJour(index, { delaiJours: v.replace(/[^0-9]/g, '') })}
              keyboardType="numeric"
              placeholder="—"
              placeholderTextColor={colors.textMuted}
            />
          </View>
          <TouchableOpacity
            onPress={() => mettreAJour(index, { assuranceDecennale: !offre.assuranceDecennale })}
            style={styles.champAssurance}
          >
            <Text style={[styles.badgeAssurance, !offre.assuranceDecennale && styles.badgeAssuranceManquante]}>
              {offre.assuranceDecennale ? 'Décennale ✓' : 'Décennale ?'}
            </Text>
          </TouchableOpacity>
          {offres.length > 2 ? (
            <TouchableOpacity onPress={() => retirer(index)}>
              <Text style={styles.retirer}>Retirer</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ))}

      {offres.length < 5 ? (
        <TouchableOpacity onPress={ajouter} style={styles.boutonAjouter}>
          <Text style={styles.boutonAjouterTexte}>+ Ajouter un fournisseur</Text>
        </TouchableOpacity>
      ) : null}

      {offresValides.length < 2 ? (
        <Aide>Renseigne au moins deux fournisseurs (nom + prix) pour lancer la comparaison.</Aide>
      ) : null}

      {resultat ? (
        <View style={styles.resultat}>
          {resultat.offres.map((o) => (
            <View key={o.fournisseur} style={styles.carteOffre}>
              <View style={styles.carteOffreEntete}>
                <Text style={styles.carteOffreFournisseur}>{o.fournisseur}</Text>
                <Text style={styles.carteOffreMontant}>{formaterEuros(o.total)}</Text>
              </View>
              <Text style={styles.carteOffreDetail}>
                Écart moyenne {o.ecartMoyenne > 0 ? '+' : ''}
                {formaterPourcent(o.ecartMoyenne, 1)} · note {o.note}/100
                {o.suspecte ? ' · ⚠ suspecte' : ''}
              </Text>
              {o.garantiesManquantes?.length ? (
                <Text style={styles.carteOffreAlerte}>{o.garantiesManquantes.join(', ')} manquant</Text>
              ) : null}
              <TouchableOpacity
                style={styles.boutonChoisir}
                onPress={() => onChoisir({ prix: o.total, fournisseur: o.fournisseur })}
              >
                <Text style={styles.boutonChoisirTexte}>Utiliser ce prix</Text>
              </TouchableOpacity>
            </View>
          ))}

          <View style={styles.recommandation}>
            <Text style={styles.recommandationTitre}>
              Recommandation : {resultat.recommandation.fournisseur}
            </Text>
            {resultat.recommandation.raisons.map((r) => (
              <Aide key={r}>• {r}</Aide>
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  conteneur: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  entete: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  titre: { ...typography.sectionTitle, fontSize: 15 },
  fermer: { color: colors.primary, fontWeight: '600' },
  ligneOffre: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.sm,
    flexWrap: 'wrap',
  },
  champFournisseur: { flex: 2, minWidth: 110 },
  champPrix: { flex: 1, minWidth: 70 },
  champDelai: { flex: 1, minWidth: 60 },
  champAssurance: { justifyContent: 'center', paddingBottom: spacing.sm },
  label: { ...typography.label, marginBottom: spacing.xs },
  saisie: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    ...typography.body,
  },
  badgeAssurance: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.success,
    borderWidth: 1,
    borderColor: colors.success,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  badgeAssuranceManquante: { color: colors.warning, borderColor: colors.warning },
  retirer: { color: colors.danger, fontSize: 12, paddingBottom: spacing.sm },
  boutonAjouter: { marginTop: spacing.md, alignItems: 'center' },
  boutonAjouterTexte: { color: colors.primary, fontWeight: '600' },
  resultat: { marginTop: spacing.md },
  carteOffre: {
    backgroundColor: colors.background,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  carteOffreEntete: { flexDirection: 'row', justifyContent: 'space-between' },
  carteOffreFournisseur: { ...typography.body, fontWeight: '700' },
  carteOffreMontant: { ...typography.body, fontWeight: '700' },
  carteOffreDetail: { ...typography.hint, marginTop: spacing.xs },
  carteOffreAlerte: { ...typography.hint, color: colors.warning, marginTop: spacing.xs },
  boutonChoisir: {
    marginTop: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingVertical: spacing.xs,
    alignItems: 'center',
  },
  boutonChoisirTexte: { color: colors.surface, fontWeight: '600', fontSize: 13 },
  recommandation: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    marginTop: spacing.xs,
  },
  recommandationTitre: { ...typography.body, fontWeight: '700', marginBottom: spacing.xs },
});
