/**
 * Chiffrage d'une affaire complete, depuis une description declarative.
 *
 * C'est le point d'entree de haut niveau : une affaire decrite en JSON entre,
 * un devis chiffre et controle sort. Les postes referencant un code de la
 * bibliotheque sont developpes en sous-detail ; les autres sont pris tels quels,
 * a condition de porter leur source.
 */

import { chiffrerOuvrage } from './core/ouvrage.js';
import { construireDevis } from './core/devis.js';
import { controler } from './core/controles.js';
import { tauxApplicable, regimeSousTraitance } from './core/tva.js';
import { ouvrage as ouvrageDeBibliotheque } from './data/bibliotheque.js';
import { PARAMETRES_DEFAUT } from './data/parametres.js';

/** Champs de l'ouvrage de bibliotheque a reporter sur le poste pour les controles. */
const CHAMPS_REPORTES = ['lot', 'famille', 'maj', 'fraisDeChantier'];

export function chiffrerAffaire(config) {
  const parametres = { ...PARAMETRES_DEFAUT, ...(config.parametres ?? {}) };
  const chantier = config.chantier ?? {};
  const contexteGlobal = chantier.coefficientContexte ?? 1;

  const tva = tauxApplicable({
    typeLocal: chantier.typeLocal ?? 'habitation',
    ageLogementAnnees: chantier.ageLogementAnnees,
    natureTravaux: config.tva?.natureTravaux ?? chantier.nature,
    categorie: config.tva?.categorie,
  });

  const lots = (config.lots ?? []).map((lot) => ({
    ...lot,
    postes: (lot.postes ?? []).map((poste) => {
      const tvaPoste = poste.tva ?? tva.taux;

      if (!poste.ouvrage) {
        if (!poste.source) {
          throw new TypeError(
            `Poste ${poste.code ?? poste.libelle} : source de prix manquante. Aucun prix sans source.`,
          );
        }
        return { ...poste, tva: tvaPoste };
      }

      const definition = ouvrageDeBibliotheque(poste.ouvrage);
      const chiffre = chiffrerOuvrage(definition, poste.quantite, parametres, {
        coefficientContexte: poste.coefficientContexte ?? contexteGlobal,
        tva: tvaPoste,
        prixUnitaireImpose: poste.prixUnitaireImpose,
      });

      const reportes = Object.fromEntries(
        CHAMPS_REPORTES.filter((champ) => definition[champ] !== undefined).map((champ) => [
          champ,
          definition[champ],
        ]),
      );

      return {
        ...chiffre,
        ...reportes,
        // Les donnees de suivi fournies dans l'affaire priment sur la bibliotheque.
        ...(poste.quantiteDPGF !== undefined ? { quantiteDPGF: poste.quantiteDPGF } : {}),
        ...(poste.consultations !== undefined ? { consultations: poste.consultations } : {}),
        ...(poste.dateSource !== undefined ? { dateSource: poste.dateSource } : {}),
        ...(poste.libelle ? { libelle: poste.libelle } : {}),
      };
    }),
  }));

  const devis = construireDevis({
    reference: config.reference,
    date: config.date,
    entreprise: config.entreprise,
    client: config.client,
    chantier,
    lots,
    parametres,
    conditions: config.conditions,
    tvaParDefaut: tva.taux,
  });

  devis.dossier = config.dossier;

  return {
    devis,
    controles: controler(devis),
    tva,
    sousTraitance: regimeSousTraitance({ sousTraitance: config.sousTraitance }),
    parametres,
  };
}
