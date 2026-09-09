/**
 * Assemblage du devis : lots, postes, totaux, ventilation de TVA, synthese.
 *
 * Un total n'est jamais reporte : il est recalcule depuis les postes a chaque
 * appel. C'est ce qui rend le controle B1 (total = somme des lots = somme des
 * postes) tautologiquement vrai ici, et faux dans la plupart des tableurs.
 */

import { euros, arrondi } from './arrondi.js';
import { margeRestante, prixPlancher, lireCoefficient } from './prix.js';
import { TAUX } from './tva.js';
import { CONDITIONS_DEFAUT } from '../data/parametres.js';

function normaliserPoste(poste, tvaParDefaut) {
  const quantite = poste.pourMemoire ? 0 : arrondi(poste.quantite ?? 0, 3);
  const prixUnitaire = poste.prixUnitaire ?? null;
  const total = poste.pourMemoire
    ? 0
    : poste.total ?? (prixUnitaire === null ? null : euros(prixUnitaire * quantite));

  const debourseTotal = poste.pourMemoire ? 0 : poste.debourseTotal ?? null;

  return {
    ...poste,
    quantite,
    prixUnitaire,
    total,
    debourseTotal,
    coefficient:
      poste.coefficient ??
      (debourseTotal && debourseTotal > 0 && total !== null ? arrondi(total / debourseTotal, 4) : null),
    tva: poste.tva ?? tvaParDefaut,
    source: poste.source ?? 'ESTIME',
  };
}

/**
 * @param {object} entree
 * @param {object} entree.entreprise   identite et assurance decennale
 * @param {object} entree.client
 * @param {object} entree.chantier     { adresse, nature, surfaceHabitable, ageLogementAnnees }
 * @param {Array}  entree.lots         [{ code, libelle, postes[], surfaceReference }]
 * @param {object} entree.parametres   chaine de prix
 * @param {object} [entree.conditions] validite, retenue de garantie, acompte...
 */
export function construireDevis({
  entreprise,
  client,
  chantier,
  lots,
  parametres,
  conditions = {},
  tvaParDefaut = TAUX.NORMAL,
  reference,
  date = new Date().toISOString().slice(0, 10),
}) {
  if (!Array.isArray(lots) || lots.length === 0) {
    throw new TypeError('construireDevis : au moins un lot est requis');
  }
  const conditionsCompletes = { ...CONDITIONS_DEFAUT, ...conditions };

  const lotsCalcules = lots.map((lot) => {
    const postes = (lot.postes ?? []).map((p) => normaliserPoste(p, tvaParDefaut));
    const totalHT = euros(postes.reduce((somme, p) => somme + (p.total ?? 0), 0));
    const debourseTotal = postes.every((p) => p.debourseTotal === null)
      ? null
      : euros(postes.reduce((somme, p) => somme + (p.debourseTotal ?? 0), 0));
    // La repartition main-d'oeuvre / fournitures ne se calcule que sur les postes
    // dont le debourse est decompose. Un poste repris en bloc (sous-traitance,
    // prix fournisseur global) n'a pas de part de main-d'oeuvre connue : le
    // compter pour zero fausserait le ratio vers le bas.
    const decomposes = postes.filter((p) => p.debourseUnitaire && !p.pourMemoire);
    const debourseDecompose = euros(
      decomposes.reduce((somme, p) => somme + p.debourseUnitaire.total * (p.quantite ?? 0), 0),
    );
    const mainOeuvre = euros(
      decomposes.reduce((somme, p) => somme + p.debourseUnitaire.mainOeuvre * (p.quantite ?? 0), 0),
    );

    return {
      ...lot,
      postes,
      totalHT,
      debourseTotal,
      debourseDecompose,
      coefficient: debourseTotal ? arrondi(totalHT / debourseTotal, 4) : null,
      partMainOeuvre: debourseDecompose > 0 ? arrondi(mainOeuvre / debourseDecompose, 4) : null,
      couvertureDecomposition:
        debourseTotal > 0 ? arrondi(debourseDecompose / debourseTotal, 4) : null,
    };
  });

  const totalHT = euros(lotsCalcules.reduce((somme, l) => somme + l.totalHT, 0));
  const debourseSecTotal = lotsCalcules.every((l) => l.debourseTotal === null)
    ? null
    : euros(lotsCalcules.reduce((somme, l) => somme + (l.debourseTotal ?? 0), 0));

  // Un poste sans debourse compte pour zero dans la somme, ce qui SURESTIME la
  // marge et le coefficient. On ne masque pas ce trou : on le mesure.
  const sansDebourse = lotsCalcules
    .flatMap((l) => l.postes)
    .filter((p) => !p.pourMemoire && p.debourseTotal === null);
  const montantSansDebourse = euros(sansDebourse.reduce((s, p) => s + (p.total ?? 0), 0));

  // Ventilation de TVA : un devis multi-taux se totalise taux par taux.
  const parTaux = new Map();
  for (const lot of lotsCalcules) {
    for (const poste of lot.postes) {
      const base = parTaux.get(poste.tva) ?? 0;
      parTaux.set(poste.tva, base + (poste.total ?? 0));
    }
  }
  const ventilationTVA = [...parTaux.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([taux, baseHT]) => ({
      taux,
      baseHT: euros(baseHT),
      montantTVA: euros(baseHT * taux),
    }));

  const totalTVA = euros(ventilationTVA.reduce((somme, v) => somme + v.montantTVA, 0));
  const totalTTC = euros(totalHT + totalTVA);

  const tousLesPostes = lotsCalcules.flatMap((l) => l.postes);
  const montantEstime = euros(
    tousLesPostes.filter((p) => p.source === 'ESTIME').reduce((s, p) => s + (p.total ?? 0), 0),
  );

  let synthese = {
    totalHT,
    debourseSecTotal,
    coefficientGlobal: debourseSecTotal ? arrondi(totalHT / debourseSecTotal, 4) : null,
    partEstimee: totalHT > 0 ? arrondi(montantEstime / totalHT, 4) : 0,
    montantEstime,
    nombrePostes: tousLesPostes.length,
    debourseComplet: sansDebourse.length === 0,
    postesSansDebourse: sansDebourse.map((p) => p.code),
    montantSansDebourse,
  };

  if (debourseSecTotal !== null && debourseSecTotal > 0) {
    const marge = margeRestante({ prixCible: totalHT, debourseSec: debourseSecTotal, parametres });
    const { prixPlancher: plancher } = prixPlancher(debourseSecTotal, parametres);
    synthese = {
      ...synthese,
      margePrevisionnelle: marge.marge,
      margeEuros: marge.margeEuros,
      prixPlancher: plancher,
      sousPlancher: marge.sousPlancher,
      lectureCoefficient: lireCoefficient(synthese.coefficientGlobal),
    };
  }

  const retenue = euros(totalHT * (conditionsCompletes.retenueGarantie ?? 0));
  const acompte = euros(totalTTC * (conditionsCompletes.acompte ?? 0));

  return {
    reference,
    date,
    entreprise,
    client,
    chantier,
    parametres,
    conditions: conditionsCompletes,
    lots: lotsCalcules,
    totalHT,
    ventilationTVA,
    totalTVA,
    totalTTC,
    retenueGarantie: retenue,
    echeancier: [
      { libelle: 'Acompte à la commande', montant: acompte },
      {
        libelle: 'Situations à l\'avancement, solde à la réception',
        montant: euros(totalTTC - acompte - retenue),
      },
      ...(retenue > 0
        ? [
            {
              libelle: 'Retenue de garantie, libérée 1 an après réception',
              montant: retenue,
              differe: true,
            },
          ]
        : []),
    ],
    synthese,
  };
}

/**
 * Effet reel d'une remise commerciale sur le devis complet.
 * La remise se prend sur la marge : elle ne modifie ni le debourse, ni les aleas.
 */
export function appliquerRemise(devis, taux) {
  if (taux < 0 || taux >= 1) throw new RangeError(`Remise invalide : ${taux}`);
  if (devis.synthese.debourseSecTotal === null) {
    throw new Error('Remise impossible : le déboursé du devis n\'est pas renseigné');
  }

  const totalHT = euros(devis.totalHT * (1 - taux));
  const marge = margeRestante({
    prixCible: totalHT,
    debourseSec: devis.synthese.debourseSecTotal,
    parametres: devis.parametres,
  });

  const ventilationTVA = devis.ventilationTVA.map((v) => ({
    taux: v.taux,
    baseHT: euros(v.baseHT * (1 - taux)),
    montantTVA: euros(v.baseHT * (1 - taux) * v.taux),
  }));
  const totalTVA = euros(ventilationTVA.reduce((s, v) => s + v.montantTVA, 0));

  return {
    tauxRemise: taux,
    montantRemise: euros(devis.totalHT - totalHT),
    totalHT,
    ventilationTVA,
    totalTVA,
    totalTTC: euros(totalHT + totalTVA),
    margeAvant: devis.synthese.margePrevisionnelle,
    margeApres: marge.marge,
    pointsPerdus: arrondi((devis.synthese.margePrevisionnelle - marge.marge) * 100, 2),
    prixPlancher: marge.prixPlancher,
    sousPlancher: marge.sousPlancher,
    aPerte: marge.aPerte,
    avis: marge.aPerte
      ? 'REFUSER — le prix est sous le prix de revient, chaque euro facturé creuse le résultat'
      : marge.sousPlancher
        ? 'REFUSER — sous le prix plancher, les frais généraux ne sont plus couverts'
        : 'ACCEPTABLE — décision de direction, la marge restante est connue',
  };
}
