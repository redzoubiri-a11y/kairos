/**
 * Comparatif d'offres fournisseurs et sous-traitants.
 *
 * Deux pieges guident la conception de ce module :
 *
 * 1. Une offre incomplete parait moins chere PARCE QU'ELLE est incomplete. Son
 *    total est donc extrapole sur les lignes manquantes, au prix moyen connu des
 *    autres offres, avant toute comparaison.
 * 2. Le moins-disant n'est pas toujours retenable. Une offre incomplete, une
 *    offre anormalement basse ou un sous-traitant sans assurance decennale ne
 *    sont pas des candidats : ce sont des dossiers a completer.
 */

import { euros, arrondi } from './arrondi.js';
import { SEUILS } from '../data/ratios.js';

const POIDS = { prix: 60, completude: 20, delai: 10, garanties: 10 };

function mediane(valeurs) {
  if (valeurs.length === 0) return null;
  const tries = [...valeurs].sort((a, b) => a - b);
  const milieu = Math.floor(tries.length / 2);
  return tries.length % 2 === 0 ? (tries[milieu - 1] + tries[milieu]) / 2 : tries[milieu];
}

/**
 * @param {object} entree
 * @param {Array} entree.postes  reference Artizon : [{ ref, libelle, quantite, unite, estimation }]
 * @param {Array} entree.offres  [{ fournisseur, lignes[], transport, remise, delaiJours,
 *                                  qualifications[], assuranceDecennale, attestationVigilance }]
 * @param {Array} [entree.qualificationsRequises]
 */
export function comparerOffres({ postes, offres, qualificationsRequises = [] }) {
  if (!Array.isArray(postes) || postes.length === 0) {
    throw new TypeError('comparerOffres : la liste des postes de référence est vide');
  }
  if (!Array.isArray(offres) || offres.length < 2) {
    throw new TypeError('comparerOffres : au moins deux offres sont nécessaires pour comparer');
  }

  // Prix de reference par poste, pour extrapoler les lignes manquantes.
  const prixConnus = new Map(postes.map((p) => [p.ref, []]));
  for (const offre of offres) {
    for (const ligne of offre.lignes ?? []) {
      const poste = postes.find((p) => p.ref === ligne.ref);
      if (!poste || (ligne.unite && ligne.unite !== poste.unite)) continue;
      prixConnus.get(poste.ref)?.push(ligne.prixUnitaire);
    }
  }
  const prixReference = new Map(
    postes.map((poste) => {
      const connus = prixConnus.get(poste.ref) ?? [];
      const moyenne = connus.length ? connus.reduce((s, p) => s + p, 0) / connus.length : null;
      return [poste.ref, poste.estimation ?? moyenne];
    }),
  );

  const depouillees = offres.map((offre) => {
    const parRef = new Map((offre.lignes ?? []).map((l) => [l.ref, l]));
    const lignes = [];
    const manquantes = [];
    const unitesIncoherentes = [];
    let extrapole = 0;

    const combler = (poste, statut) => {
      const reference = prixReference.get(poste.ref);
      const montant = reference === null ? null : euros(reference * poste.quantite);
      if (montant !== null) extrapole += montant;
      return { ...poste, prixUnitaire: null, montant: null, montantExtrapole: montant, statut };
    };

    for (const poste of postes) {
      const ligne = parRef.get(poste.ref);
      if (!ligne) {
        manquantes.push(poste.ref);
        lignes.push(combler(poste, 'manquante'));
        continue;
      }
      if (ligne.unite && ligne.unite !== poste.unite) {
        unitesIncoherentes.push(`${poste.ref} (${ligne.unite} au lieu de ${poste.unite})`);
        lignes.push({ ...combler(poste, 'unite_incoherente'), prixUnitaire: ligne.prixUnitaire });
        continue;
      }
      // Quantite de reference Artizon, jamais celle de l'offre : c'est ce qui
      // rend les totaux comparables entre eux.
      lignes.push({
        ...poste,
        prixUnitaire: ligne.prixUnitaire,
        montant: euros(ligne.prixUnitaire * poste.quantite),
        statut: 'comparee',
      });
    }

    const sousTotal = euros(lignes.reduce((s, l) => s + (l.montant ?? 0), 0));
    const remise = euros(sousTotal * (offre.remise ?? 0));
    const total = euros(sousTotal - remise + (offre.transport ?? 0));
    const couverture = arrondi(
      (postes.length - manquantes.length - unitesIncoherentes.length) / postes.length,
      4,
    );

    const garantiesManquantes = [
      ...(offre.assuranceDecennale === false ? ['assurance décennale'] : []),
      ...(offre.attestationVigilance === false ? ['attestation de vigilance URSSAF'] : []),
      ...qualificationsRequises.filter((q) => !(offre.qualifications ?? []).includes(q)),
    ];

    return {
      fournisseur: offre.fournisseur,
      lignes,
      sousTotal,
      remise,
      transport: euros(offre.transport ?? 0),
      total,
      // Base de comparaison : lignes manquantes comblees au prix connu du marche.
      totalComparable: euros(total + extrapole),
      montantExtrapole: euros(extrapole),
      manquantes,
      unitesIncoherentes,
      couverture,
      delaiJours: offre.delaiJours ?? null,
      conditionsPaiement: offre.conditionsPaiement ?? null,
      garantiesManquantes,
      complete: manquantes.length === 0 && unitesIncoherentes.length === 0,
    };
  });

  const totaux = depouillees.map((o) => o.totalComparable);
  const moyenne = arrondi(totaux.reduce((s, t) => s + t, 0) / totaux.length, 2);
  const med = mediane(totaux);
  const meilleurTotal = Math.min(...totaux);
  const pireTotal = Math.max(...totaux);
  const delais = depouillees.map((o) => o.delaiJours).filter((d) => typeof d === 'number');
  const meilleurDelai = delais.length ? Math.min(...delais) : null;
  const pireDelai = delais.length ? Math.max(...delais) : null;

  const evaluees = depouillees.map((offre) => {
    const notePrix =
      pireTotal === meilleurTotal
        ? POIDS.prix
        : POIDS.prix * ((pireTotal - offre.totalComparable) / (pireTotal - meilleurTotal));
    const noteCompletude = POIDS.completude * offre.couverture;
    const noteDelai =
      offre.delaiJours === null || meilleurDelai === null || pireDelai === meilleurDelai
        ? POIDS.delai * 0.5
        : POIDS.delai * ((pireDelai - offre.delaiJours) / (pireDelai - meilleurDelai));
    const noteGaranties = offre.garantiesManquantes.length === 0 ? POIDS.garanties : 0;

    const ecart = arrondi((offre.totalComparable - moyenne) / moyenne, 4);

    return {
      ...offre,
      ecartMoyenne: ecart,
      suspecte: ecart < -SEUILS.offreSuspecte,
      note: arrondi(notePrix + noteCompletude + noteDelai + noteGaranties, 1),
      detailNote: {
        prix: arrondi(notePrix, 1),
        completude: arrondi(noteCompletude, 1),
        delai: arrondi(noteDelai, 1),
        garanties: noteGaranties,
      },
    };
  });

  // Une offre incomplete, anormalement basse ou sans garantie n'est pas un
  // candidat : c'est un dossier a completer avant de pouvoir etre compare.
  const eligibles = evaluees.filter(
    (o) => o.complete && !o.suspecte && o.garantiesManquantes.length === 0,
  );
  const classement = eligibles.length > 0 ? eligibles : evaluees;

  const moinsDisant = evaluees.reduce((a, b) => (b.totalComparable < a.totalComparable ? b : a));
  const mieuxDisant = classement.reduce((a, b) => (b.note > a.note ? b : a));

  const raisons = [];
  if (eligibles.length === 0) {
    raisons.push(
      'Aucune offre n\'est retenable en l\'état : toutes sont incomplètes, anormalement basses ou sans garantie. ' +
        'Relancer la consultation avant de décider.',
    );
  }
  if (moinsDisant.fournisseur === mieuxDisant.fournisseur) {
    raisons.push(`${mieuxDisant.fournisseur} est à la fois le moins-disant et le mieux-disant.`);
  } else {
    raisons.push(
      `${moinsDisant.fournisseur} est le moins cher sur base comparable (${moinsDisant.totalComparable} €), ` +
        `mais ${mieuxDisant.fournisseur} est retenu : note ${mieuxDisant.note}/100 contre ${moinsDisant.note}/100.`,
    );
  }
  for (const offre of evaluees) {
    if (offre.montantExtrapole > 0) {
      raisons.push(
        `${offre.fournisseur} ne chiffre pas ${offre.manquantes.concat(offre.unitesIncoherentes).join(', ')} : ` +
          `${offre.montantExtrapole} € ajoutés au prix moyen connu pour comparer. Son prix n'est pas ferme.`,
      );
    }
    if (offre.suspecte) {
      raisons.push(
        `L'offre de ${offre.fournisseur} est ${arrondi(Math.abs(offre.ecartMoyenne) * 100, 1)} % sous la moyenne : ` +
          `vérifier ce qu'elle ne contient pas. Une erreur du sous-traitant devient celle d'Artizon en chantier.`,
      );
    }
    if (offre.garantiesManquantes.length > 0) {
      raisons.push(
        `${offre.fournisseur} : ${offre.garantiesManquantes.join(', ')} à obtenir avant tout engagement.`,
      );
    }
  }

  return {
    postes,
    offres: evaluees.sort((a, b) => b.note - a.note),
    statistiques: { moyenne, mediane: med === null ? null : arrondi(med, 2), meilleurTotal, pireTotal },
    moinsDisant: moinsDisant.fournisseur,
    mieuxDisant: mieuxDisant.fournisseur,
    eligibles: eligibles.map((o) => o.fournisseur),
    recommandation: {
      fournisseur: mieuxDisant.fournisseur,
      total: mieuxDisant.total,
      totalComparable: mieuxDisant.totalComparable,
      raisons,
    },
  };
}
