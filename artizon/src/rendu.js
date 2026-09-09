/**
 * Rendu texte des livrables : devis, controles, comparatif, metre.
 * Le format suit celui decrit par la skill `chiffreur-artizon`.
 */

import { arrondi } from './core/arrondi.js';
import { uniteAffichee, natureAffichee } from './data/ratios.js';

const nombre = (valeur, decimales = 2) =>
  Number(valeur).toLocaleString('fr-FR', {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  });

const LARGEUR = 93;

const ligne = (caractere = '─', longueur = LARGEUR) => caractere.repeat(longueur);

const tronquer = (texte, taille) =>
  texte.length <= taille ? texte.padEnd(taille) : `${texte.slice(0, taille - 1)}…`;

export function formaterDevis(devis) {
  const sortie = [];
  const { entreprise = {}, client = {}, chantier = {}, conditions } = devis;

  sortie.push(ligne('═'));
  sortie.push(`DEVIS ${devis.reference ?? ''}`.trim().padEnd(57) + (entreprise.nom ?? 'ARTIZON').padStart(36));
  sortie.push(ligne('═'));
  if (client.nom) sortie.push(`Client    : ${client.nom}${client.adresse ? ` — ${client.adresse}` : ''}`);
  if (chantier.adresse) sortie.push(`Chantier  : ${chantier.adresse}`);
  if (chantier.nature) {
    sortie.push(
      `Nature    : ${natureAffichee(chantier.nature)}` +
        (chantier.surfaceHabitable ? ` — ${nombre(chantier.surfaceHabitable, 1)} m² habitables` : '') +
        (typeof chantier.ageLogementAnnees === 'number' ? ` — logement de ${chantier.ageLogementAnnees} ans` : ''),
    );
  }
  sortie.push(`Date      : ${devis.date} — offre valable ${conditions.validiteJours} jours`);
  sortie.push('');

  for (const lot of devis.lots) {
    sortie.push(`LOT ${lot.code} — ${lot.libelle.toUpperCase()}`);
    sortie.push(
      `  ${'Code'.padEnd(8)}${'Désignation'.padEnd(42)}${'Qté'.padStart(10)} ${'U'.padEnd(5)}` +
        `${'PU HT'.padStart(11)}${'Total HT'.padStart(14)}  TVA`,
    );
    sortie.push(`  ${ligne('┄', 91)}`);

    for (const poste of lot.postes) {
      const marqueur = poste.source === 'ESTIME' ? ' *' : '  ';
      if (poste.pourMemoire) {
        sortie.push(
          `  ${poste.code.padEnd(8)}${tronquer(poste.libelle, 42)}${'PM'.padStart(10)} ${uniteAffichee(poste.unite).padEnd(5)}` +
            `${'—'.padStart(11)}${'—'.padStart(14)}`,
        );
        continue;
      }
      sortie.push(
        `  ${poste.code.padEnd(8)}${tronquer(poste.libelle, 42)}${nombre(poste.quantite, 2).padStart(10)} ` +
          `${uniteAffichee(poste.unite).padEnd(5)}${nombre(poste.prixUnitaire ?? 0).padStart(11)}` +
          `${nombre(poste.total ?? 0).padStart(14)}${marqueur}${arrondi(poste.tva * 100, 1)}%`,
      );
    }
    sortie.push(`  ${'Sous-total lot'.padStart(77)}${nombre(lot.totalHT).padStart(14)}`);
    sortie.push('');
  }

  sortie.push(ligne());
  sortie.push(`${'TOTAL HT'.padStart(79)}${nombre(devis.totalHT).padStart(14)}`);
  for (const v of devis.ventilationTVA) {
    sortie.push(
      `${`TVA ${arrondi(v.taux * 100, 1)} % sur ${nombre(v.baseHT)} € HT`.padStart(79)}` +
        `${nombre(v.montantTVA).padStart(14)}`,
    );
  }
  sortie.push(`${'TOTAL TTC'.padStart(79)}${nombre(devis.totalTTC).padStart(14)}`);
  sortie.push(ligne());

  if (devis.echeancier?.length) {
    sortie.push('');
    sortie.push('ÉCHÉANCIER');
    for (const echeance of devis.echeancier) {
      sortie.push(`  ${tronquer(echeance.libelle, 63)}${nombre(echeance.montant).padStart(28)}`);
    }
  }

  const s = devis.synthese;
  sortie.push('');
  sortie.push('SYNTHÈSE');
  sortie.push(`  Total HT                    ${nombre(s.totalHT).padStart(14)} €`);
  if (s.debourseSecTotal !== null) {
    sortie.push(`  Déboursé sec total          ${nombre(s.debourseSecTotal).padStart(14)} €`);
    sortie.push(`  Coefficient de vente        ${nombre(s.coefficientGlobal, 3).padStart(14)}`);
    sortie.push(
      `  Marge prévisionnelle        ${nombre(s.margePrevisionnelle * 100, 1).padStart(14)} %   ` +
        `soit ${nombre(s.margeEuros)} €`,
    );
    sortie.push(`  Prix plancher               ${nombre(s.prixPlancher).padStart(14)} €`);
    if (s.debourseComplet === false) {
      sortie.push(
        `  ⚠ marge surestimée : ${nombre(s.montantSansDebourse)} € de postes sans déboursé renseigné`,
      );
    }
  }
  sortie.push(`  Postes [ESTIMÉ]             ${nombre(s.partEstimee * 100, 1).padStart(14)} % du montant`);
  if (s.partEstimee > 0) sortie.push('  (* postes marqués ci-dessus : prix estimé, à valider avant remise)');

  return sortie.join('\n');
}

export function formaterControles(resultat) {
  const sortie = [];
  sortie.push(
    `CONTRÔLES — ${resultat.passes} passés · ${resultat.alertes.length} alerte(s) · ` +
      `${resultat.bloquants.length} bloquant(s)`,
  );
  sortie.push('');

  for (const item of [...resultat.bloquants, ...resultat.alertes]) {
    const entete = item.niveau === 'bloquant' ? 'BLOQUANT' : 'ALERTE  ';
    sortie.push(`${entete} ${item.code}  ${item.message}`);
    if (item.impact !== undefined) {
      sortie.push(`${' '.repeat(15)}→ impact estimé : ${nombre(item.impact)} € HT`);
    }
    sortie.push('');
  }

  if (resultat.nonEvalues.length > 0) {
    sortie.push('NON ÉVALUÉS — à vérifier à la main, le moteur n\'a pas la donnée :');
    for (const item of resultat.nonEvalues) sortie.push(`  ${item.code}  ${item.raison}`);
    sortie.push('');
  }

  sortie.push(`VERDICT    ${resultat.verdict}`);
  return sortie.join('\n');
}

export function formaterComparatif(comparatif) {
  const sortie = [];
  sortie.push('COMPARATIF D\'OFFRES — base de comparaison : quantités de référence Artizon');
  sortie.push('');
  sortie.push(
    `  ${'Fournisseur'.padEnd(22)}${'Remis HT'.padStart(13)}${'Comparable'.padStart(14)}${'Écart'.padStart(9)}` +
      `${'Couvert.'.padStart(10)}${'Délai'.padStart(8)}${'Note'.padStart(8)}`,
  );
  sortie.push(`  ${ligne('┄', 84)}`);

  for (const offre of comparatif.offres) {
    sortie.push(
      `  ${tronquer(offre.fournisseur, 22)}${nombre(offre.total).padStart(13)}` +
        `${nombre(offre.totalComparable).padStart(14)}` +
        `${`${offre.ecartMoyenne > 0 ? '+' : ''}${nombre(offre.ecartMoyenne * 100, 1)} %`.padStart(9)}` +
        `${`${nombre(offre.couverture * 100, 0)} %`.padStart(10)}` +
        `${(offre.delaiJours === null ? '—' : `${offre.delaiJours} j`).padStart(8)}` +
        `${nombre(offre.note, 1).padStart(8)}${offre.suspecte ? '  ⚠ suspecte' : ''}`,
    );
    if (offre.manquantes.length > 0) {
      sortie.push(
        `${' '.repeat(4)}lignes non chiffrées : ${offre.manquantes.join(', ')} ` +
          `(+${nombre(offre.montantExtrapole)} € extrapolés pour comparer)`,
      );
    }
    if (offre.unitesIncoherentes.length > 0) {
      sortie.push(`${' '.repeat(4)}unités non comparables : ${offre.unitesIncoherentes.join(', ')}`);
    }
    if (offre.garantiesManquantes.length > 0) {
      sortie.push(`${' '.repeat(4)}non retenable : ${offre.garantiesManquantes.join(', ')}`);
    }
  }

  sortie.push('');
  sortie.push(
    `  Moyenne ${nombre(comparatif.statistiques.moyenne)} € · médiane ${nombre(comparatif.statistiques.mediane)} €`,
  );
  sortie.push(`  Moins-disant : ${comparatif.moinsDisant}`);
  sortie.push(`  Mieux-disant : ${comparatif.mieuxDisant}`);
  sortie.push('');
  sortie.push(
    `RECOMMANDATION  ${comparatif.recommandation.fournisseur} — ${nombre(comparatif.recommandation.total)} € HT`,
  );
  for (const raison of comparatif.recommandation.raisons) sortie.push(`  · ${raison}`);

  return sortie.join('\n');
}

/** Metre imprimable : le calcul, pas seulement le total. */
export function formaterMetre(titre, resultats) {
  const sortie = [`MÉTRÉ — ${titre}`, ''];
  for (const { libelle, resultat } of resultats) {
    sortie.push(`  ${libelle}`);
    for (const l of resultat.detail) sortie.push(`    ${l}`);
    sortie.push(
      `    → retenu : ${nombre(resultat.quantite, 2)} ${uniteAffichee(resultat.unite)}`.trimEnd(),
    );
    if (resultat.convention) sortie.push(`    convention : ${resultat.convention}`);
    sortie.push('');
  }
  return sortie.join('\n');
}
