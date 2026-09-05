/**
 * Controles avant remise.
 *
 * Le silence n'est pas une preuve de verification : ce module renvoie aussi la
 * liste des controles qu'il n'a PAS pu evaluer faute de donnee, pour qu'ils
 * soient traites a la main plutot que passes sous silence.
 */

import { arrondi, euros } from './arrondi.js';
import { BORNES_COEFFICIENT } from './prix.js';
import {
  RATIOS_OUVRAGE,
  RATIOS_LOT_SHAB,
  REPARTITION_LOT,
  SEUILS,
  UNITES,
  uniteAffichee,
} from '../data/ratios.js';

const nb = (valeur, decimales = 2) =>
  Number(valeur).toLocaleString('fr-FR', {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  });

const NATURES_RENOVATION = new Set([
  'renovation',
  'rehabilitation',
  'amelioration',
  'transformation',
  'entretien',
  'renovation_energetique',
]);

function moisEcoules(dateISO, aujourdHui) {
  const date = new Date(dateISO.length === 7 ? `${dateISO}-01` : dateISO);
  if (Number.isNaN(date.getTime())) return null;
  return (aujourdHui.getFullYear() - date.getFullYear()) * 12 + (aujourdHui.getMonth() - date.getMonth());
}

export function controler(devis, { aujourdHui = new Date() } = {}) {
  const bloquants = [];
  const alertes = [];
  const nonEvalues = [];
  let passes = 0;

  const bloquant = (code, message, extra = {}) => bloquants.push({ code, niveau: 'bloquant', message, ...extra });
  const alerte = (code, message, extra = {}) => alertes.push({ code, niveau: 'alerte', message, ...extra });
  const nonEvalue = (code, raison) => nonEvalues.push({ code, raison });
  const passe = () => { passes += 1; };

  const postes = devis.lots.flatMap((lot) => lot.postes.map((p) => ({ ...p, lot })));

  // --- B1 : coherence arithmetique -----------------------------------------
  const sommePostes = euros(postes.reduce((s, p) => s + (p.total ?? 0), 0));
  const sommeLots = euros(devis.lots.reduce((s, l) => s + l.totalHT, 0));
  const sommeBasesTVA = euros(devis.ventilationTVA.reduce((s, v) => s + v.baseHT, 0));
  if (sommePostes !== devis.totalHT || sommeLots !== devis.totalHT || sommeBasesTVA !== devis.totalHT) {
    bloquant(
      'B1',
      `Totaux incohérents : postes ${sommePostes} €, lots ${sommeLots} €, bases de TVA ${sommeBasesTVA} €, ` +
        `total annoncé ${devis.totalHT} €`,
    );
  } else passe();

  // --- B2 a B5 : integrite des postes ---------------------------------------
  // Un poste « pour memoire » n'a legitimement pas de prix : il n'est pas un oubli.
  const nonRenseignes = postes.filter((p) => !p.pourMemoire && (p.aRenseigner || p.prixUnitaire === null));
  if (nonRenseignes.length > 0) {
    for (const p of nonRenseignes) {
      bloquant('B2', `Poste ${p.code} « ${p.libelle} » non renseigné`, { poste: p.code });
    }
  } else passe();

  const unitesInvalides = postes.filter((p) => !UNITES.has(p.unite));
  if (unitesInvalides.length > 0) {
    for (const p of unitesInvalides) {
      bloquant('B3', `Poste ${p.code} : unité « ${p.unite} » inconnue (admises : ${[...UNITES].join(', ')})`, {
        poste: p.code,
      });
    }
  } else passe();

  const quantitesNulles = postes.filter((p) => !p.pourMemoire && !(p.quantite > 0));
  if (quantitesNulles.length > 0) {
    for (const p of quantitesNulles) {
      bloquant('B4', `Poste ${p.code} « ${p.libelle} » : quantité nulle. Un poste sans quantité se marque « pour mémoire ».`, {
        poste: p.code,
      });
    }
  } else passe();

  const prixNuls = postes.filter((p) => !p.pourMemoire && !p.offert && p.prixUnitaire !== null && !(p.prixUnitaire > 0));
  if (prixNuls.length > 0) {
    for (const p of prixNuls) {
      bloquant('B5', `Poste ${p.code} « ${p.libelle} » : prix unitaire nul non déclaré comme offert`, { poste: p.code });
    }
  } else passe();

  // --- B6 / A6 : coefficient de vente ---------------------------------------
  const k = devis.synthese.coefficientGlobal;
  if (k === null) {
    nonEvalue('B6', 'Déboursé sec non renseigné : le coefficient de vente n\'est pas calculable');
  } else if (k < BORNES_COEFFICIENT.bloquantBas) {
    bloquant('B6', `Coefficient de vente global k = ${arrondi(k, 3)} < ${BORNES_COEFFICIENT.bloquantBas} : frais généraux non couverts`);
  } else {
    passe();
    if (k > BORNES_COEFFICIENT.alerteHaut) {
      alerte('A6', `Coefficient de vente global k = ${arrondi(k, 3)} : élevé, risque de perdre l'affaire. À justifier.`);
    }
  }

  for (const p of postes) {
    if (p.coefficient !== null && p.coefficient !== undefined && !p.prixImpose && p.coefficient < BORNES_COEFFICIENT.bloquantBas) {
      bloquant('B6', `Poste ${p.code} : k = ${arrondi(p.coefficient, 3)}, sous le seuil de couverture`, { poste: p.code });
    }
  }

  // --- B7 : marge nette ------------------------------------------------------
  if (devis.synthese.margePrevisionnelle === undefined) {
    nonEvalue('B7', 'Déboursé sec non renseigné : la marge prévisionnelle n\'est pas calculable');
  } else if (devis.synthese.margePrevisionnelle <= 0) {
    bloquant(
      'B7',
      `Marge prévisionnelle ${nb(devis.synthese.margePrevisionnelle * 100, 2)} % : le chantier se ferait à perte`,
    );
  } else passe();

  // --- B8 a B10 : conformite au dossier de consultation ----------------------
  const dossier = devis.dossier;
  if (!dossier?.piecesRequises) {
    nonEvalue('B8', 'Pièces exigées par le règlement de consultation non fournies au moteur');
  } else {
    const fournies = new Set(dossier.piecesFournies ?? []);
    const manquantes = dossier.piecesRequises.filter((piece) => !fournies.has(piece));
    if (manquantes.length > 0) {
      bloquant('B8', `Pièces exigées par le RC absentes de la réponse : ${manquantes.join(', ')}`);
    } else passe();
  }

  if (!dossier?.dateLimiteRemise) {
    nonEvalue('B9', 'Date limite de remise non fournie au moteur');
  } else if (new Date(dossier.dateLimiteRemise) < aujourdHui) {
    bloquant('B9', `Date limite de remise dépassée (${dossier.dateLimiteRemise})`);
  } else passe();

  if (dossier?.montantActeEngagement === undefined) {
    nonEvalue('B10', 'Montant de l\'acte d\'engagement non fourni au moteur');
  } else if (euros(dossier.montantActeEngagement) !== devis.totalHT) {
    bloquant(
      'B10',
      `Acte d'engagement ${euros(dossier.montantActeEngagement)} € ≠ total du DPGF ${devis.totalHT} €`,
    );
  } else passe();

  // --- A1 : ratios de plausibilite -------------------------------------------
  let ratiosEvalues = 0;
  for (const p of postes) {
    const fourchette = RATIOS_OUVRAGE[p.famille];
    if (!fourchette || p.unite !== 'm2' || p.prixUnitaire === null) continue;
    ratiosEvalues += 1;
    if (p.prixUnitaire < fourchette.min || p.prixUnitaire > fourchette.max) {
      const cible = p.prixUnitaire < fourchette.min ? fourchette.min : fourchette.max;
      alerte(
        'A1',
        `Poste ${p.code} à ${nb(p.prixUnitaire)} €/m², hors fourchette ${fourchette.min}–${fourchette.max} €/m² (${p.famille})`,
        { poste: p.code, impact: euros((cible - p.prixUnitaire) * p.quantite) },
      );
    }
  }
  for (const lot of devis.lots) {
    const fourchette = RATIOS_LOT_SHAB[lot.lot];
    const surface = devis.chantier?.surfaceHabitable;
    // Un ratio au m2 habitable ne veut rien dire sur un lot partiel : il ne
    // s'applique qu'aux lots que le chiffreur declare complets.
    if (!fourchette || !surface || lot.complet !== true) continue;
    ratiosEvalues += 1;
    const ratio = arrondi(lot.totalHT / surface, 2);
    if (ratio < fourchette.min || ratio > fourchette.max) {
      alerte(
        'A1',
        `Lot ${lot.code} « ${lot.libelle} » à ${nb(ratio)} €/m² SHAB, hors fourchette ${fourchette.min}–${fourchette.max}`,
        { lot: lot.code },
      );
    }
  }
  if (ratiosEvalues === 0) {
    nonEvalue('A1', 'Aucun poste ni lot ne porte de famille de ratio exploitable');
  } else passe();

  // --- A2 : repartition main-d'oeuvre / fournitures --------------------------
  let repartitionsEvaluees = 0;
  for (const lot of devis.lots) {
    const fourchette = REPARTITION_LOT[lot.lot];
    if (!fourchette || lot.partMainOeuvre === null || lot.partMainOeuvre === undefined) continue;
    // Sous 50 % de debourse decompose, le ratio ne dit plus rien de fiable.
    const couverture = lot.couvertureDecomposition ?? 1;
    if (couverture < 0.5) {
      nonEvalue(
        'A2',
        `Lot ${lot.code} : seuls ${nb(couverture * 100, 0)} % du déboursé sont décomposés, ratio non significatif`,
      );
      continue;
    }
    repartitionsEvaluees += 1;
    if (lot.partMainOeuvre < fourchette.min || lot.partMainOeuvre > fourchette.max) {
      alerte(
        'A2',
        `Lot ${lot.code} « ${lot.libelle} » : main-d'œuvre ${nb(lot.partMainOeuvre * 100, 1)} % du déboursé` +
          (couverture < 1 ? ` décomposé (${nb(couverture * 100, 0)} % du lot)` : '') +
          `, hors fourchette ${arrondi(fourchette.min * 100, 0)}–${arrondi(fourchette.max * 100, 0)} %. ` +
          `Cause fréquente : une quantité surestimée ou un temps de pose oublié.`,
        { lot: lot.code },
      );
    }
  }
  if (repartitionsEvaluees === 0) {
    nonEvalue('A2', 'Répartition main-d\'œuvre / fournitures non calculable (déboursé absent ou lot non référencé)');
  } else passe();

  // --- A3 : ecart entre postes techniquement voisins -------------------------
  const parFamille = new Map();
  for (const p of postes) {
    if (!p.famille || p.prixUnitaire === null) continue;
    const cle = `${p.famille}|${p.unite}`;
    if (!parFamille.has(cle)) parFamille.set(cle, []);
    parFamille.get(cle).push(p);
  }
  let famillesComparees = 0;
  for (const [cle, groupe] of parFamille) {
    if (groupe.length < 2) continue;
    famillesComparees += 1;
    const prix = groupe.map((p) => p.prixUnitaire);
    const min = Math.min(...prix);
    const max = Math.max(...prix);
    if (min > 0 && (max - min) / min > SEUILS.ecartPostesVoisins) {
      alerte(
        'A3',
        `Écart de ${nb(((max - min) / min) * 100, 0)} % entre postes de la famille « ${cle.split('|')[0]} » ` +
          `(${nb(min)} à ${nb(max)} €). Vérifier qu'il est justifié.`,
      );
    }
  }
  if (famillesComparees === 0) nonEvalue('A3', 'Aucune famille ne compte deux postes comparables');
  else passe();

  // --- A4 : part de postes estimes -------------------------------------------
  if (devis.synthese.partEstimee > SEUILS.partEstimee) {
    const aConsulter = postes
      .filter((p) => p.source === 'ESTIME')
      .sort((a, b) => (b.total ?? 0) - (a.total ?? 0))
      .slice(0, 5)
      .map((p) => `${p.code} ${p.libelle}`);
    alerte(
      'A4',
      `Postes [ESTIMÉ] = ${nb(devis.synthese.partEstimee * 100, 1)} % du montant (seuil ` +
        `${arrondi(SEUILS.partEstimee * 100, 0)} %). Consultations à lancer : ${aConsulter.join(' · ')}`,
      { impact: devis.synthese.montantEstime },
    );
  } else passe();

  // --- A5 : ecart avec le DPGF client ----------------------------------------
  const avecDPGF = postes.filter((p) => typeof p.quantiteDPGF === 'number');
  if (avecDPGF.length === 0) {
    nonEvalue('A5', 'Aucune quantité du DPGF client fournie pour comparaison');
  } else {
    let ecarts = 0;
    for (const p of avecDPGF) {
      if (p.quantiteDPGF === 0) continue;
      const ecart = (p.quantite - p.quantiteDPGF) / p.quantiteDPGF;
      if (Math.abs(ecart) > SEUILS.ecartDPGF) {
        ecarts += 1;
        alerte(
          'A5',
          `Poste ${p.code} : métré Artizon ${nb(p.quantite)} ${uniteAffichee(p.unite)} contre ${nb(p.quantiteDPGF)} au DPGF client ` +
            `(${ecart > 0 ? '+' : ''}${nb(ecart * 100, 1)} %). À signaler dans l'offre.`,
          { poste: p.code },
        );
      }
    }
    if (ecarts === 0) passe();
  }

  // --- A7 : aleas nuls en renovation -----------------------------------------
  const nature = devis.chantier?.nature;
  if (!nature) {
    nonEvalue('A7', 'Nature du chantier non renseignée');
  } else if (NATURES_RENOVATION.has(nature) && !(devis.parametres.aleas > 0)) {
    alerte('A7', 'Aléas à 0 % sur un chantier de rénovation : aucune provision pour l\'existant non reconnu');
  } else passe();

  // --- A8 : double comptage des frais de chantier ----------------------------
  const fraisEnPostes = postes.filter((p) => p.fraisDeChantier);
  if (fraisEnPostes.length > 0 && devis.parametres.fraisChantier > 0) {
    alerte(
      'A8',
      `Frais de chantier comptés en postes (${fraisEnPostes.map((p) => p.code).join(', ')}) ET en pourcentage ` +
        `(${nb(devis.parametres.fraisChantier * 100, 1)} %) : double comptage.`,
    );
  } else passe();

  // --- A9 : validite de l'offre sans revision de prix ------------------------
  const validite = devis.conditions?.validiteJours;
  if (validite === undefined) {
    nonEvalue('A9', 'Durée de validité de l\'offre non renseignée');
  } else if (validite > SEUILS.validiteMoisSansRevision * 30 && !devis.conditions.revisionPrix) {
    alerte(
      'A9',
      `Offre valable ${validite} jours sans clause de révision : le risque matière est intégralement porté par Artizon`,
    );
  } else passe();

  // --- A10 : consultation insuffisante sur un poste majeur -------------------
  const postesMajeurs = postes.filter(
    (p) => devis.totalHT > 0 && (p.total ?? 0) / devis.totalHT > SEUILS.posteMajeur,
  );
  const majeursSansInfo = postesMajeurs.filter((p) => p.consultations === undefined);
  if (postesMajeurs.length === 0) {
    passe();
  } else if (majeursSansInfo.length === postesMajeurs.length) {
    nonEvalue('A10', 'Nombre de consultations fournisseurs non renseigné sur les postes majeurs');
  } else {
    let insuffisants = 0;
    for (const p of postesMajeurs) {
      if (p.consultations !== undefined && p.consultations < 2) {
        insuffisants += 1;
        alerte(
          'A10',
          `Poste majeur ${p.code} (${nb(((p.total ?? 0) / devis.totalHT) * 100, 1)} % du devis) ` +
            `chiffré sur ${p.consultations} consultation(s). En consulter au moins deux.`,
          { poste: p.code },
        );
      }
    }
    if (insuffisants === 0) passe();
  }

  // --- A13 : fiabilite de la marge annoncee ----------------------------------
  if (devis.synthese.debourseComplet === false) {
    alerte(
      'A13',
      `${nb(devis.synthese.montantSansDebourse)} € de postes sans déboursé renseigné ` +
        `(${devis.synthese.postesSansDebourse.join(', ')}) : la marge et le coefficient affichés sont SURESTIMÉS. ` +
        `Renseigner leur déboursé avant de décider d'une remise.`,
      { impact: devis.synthese.montantSansDebourse },
    );
  } else passe();

  // --- A12 : anciennete des prix ---------------------------------------------
  const dates = postes.filter((p) => p.maj || p.dateSource);
  if (dates.length === 0) {
    nonEvalue('A12', 'Aucune date de source de prix renseignée');
  } else {
    let perimes = 0;
    for (const p of dates) {
      const mois = moisEcoules(p.dateSource ?? p.maj, aujourdHui);
      if (mois !== null && mois > SEUILS.ageSourceMois) {
        perimes += 1;
        alerte('A12', `Poste ${p.code} : prix datant de ${mois} mois, à reconsulter`, { poste: p.code });
      }
    }
    if (perimes === 0) passe();
  }

  const verdict =
    bloquants.length > 0 ? 'NON REMETTABLE' : alertes.length > 0 ? 'À COMPLÉTER' : 'REMETTABLE';

  return { bloquants, alertes, nonEvalues, passes, verdict };
}
