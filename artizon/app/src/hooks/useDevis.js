import { useMemo, useState } from 'react';

import { coutMainOeuvre, debourseSec, lireCoefficient, prixDeVente, tauxApplicable } from '../lib/moteur.js';

function etatInitial(profil) {
  return {
    client: { nom: '' },
    ouvrage: { libelle: '' },
    fourniture: { prix: 0, ferme: false },
    pose: { heures: 0, categorie: 'ouvrierQualifie' },
    parametres: { ...profil.parametresDefaut },
    tva: { typeLocal: 'habitation', ageLogementAnnees: '', natureTravaux: 'amelioration' },
  };
}

/**
 * Reproduit, comme écran, le chiffrage qu'on ferait à la main pour un
 * artisan qui achète une fourniture chez un fabricant et assure la pose :
 * déboursé -> prix de vente -> TVA -> total TTC. Un seul ouvrage à la fois —
 * le cas réel (l'escalier) qui a servi de test.
 */
export function useDevis(profil) {
  const [devis, setDevis] = useState(() => etatInitial(profil));

  const mettreAJourClient = (champs) => setDevis((d) => ({ ...d, client: { ...d.client, ...champs } }));
  const mettreAJourOuvrage = (champs) => setDevis((d) => ({ ...d, ouvrage: { ...d.ouvrage, ...champs } }));
  const mettreAJourFourniture = (champs) =>
    setDevis((d) => ({ ...d, fourniture: { ...d.fourniture, ...champs } }));
  const mettreAJourPose = (champs) => setDevis((d) => ({ ...d, pose: { ...d.pose, ...champs } }));
  const mettreAJourParametre = (cle, valeur) =>
    setDevis((d) => ({ ...d, parametres: { ...d.parametres, [cle]: valeur } }));
  const mettreAJourTva = (champs) => setDevis((d) => ({ ...d, tva: { ...d.tva, ...champs } }));

  const reinitialiser = () => setDevis(etatInitial(profil));

  const resultat = useMemo(() => {
    const coutHoraireRetenu = profil.coutHoraire[devis.pose.categorie] ?? 0;
    const mainOeuvre = coutMainOeuvre({
      tempsUnitaire: devis.pose.heures || 0,
      coutHoraire: coutHoraireRetenu,
      coefficientContexte: 1,
    });
    const ds = debourseSec({ fournitures: devis.fourniture.prix || 0, mainOeuvre, materiel: 0 });

    let chaine = null;
    let erreurParametres = null;
    try {
      chaine = prixDeVente(ds, devis.parametres);
    } catch (e) {
      erreurParametres = e.message;
    }

    const tva = tauxApplicable({
      typeLocal: devis.tva.typeLocal,
      ageLogementAnnees: devis.tva.ageLogementAnnees === '' ? undefined : Number(devis.tva.ageLogementAnnees),
      natureTravaux: devis.tva.natureTravaux,
    });

    const totalTTC = chaine ? chaine.prixVente * (1 + tva.taux) : null;

    return {
      coutHoraireRetenu,
      mainOeuvre,
      debourseSec: ds,
      chaine,
      erreurParametres,
      lectureCoefficient: chaine ? lireCoefficient(chaine.coefficient) : null,
      tva,
      totalTTC,
    };
  }, [devis, profil.coutHoraire]);

  return {
    devis,
    resultat,
    mettreAJourClient,
    mettreAJourOuvrage,
    mettreAJourFourniture,
    mettreAJourPose,
    mettreAJourParametre,
    mettreAJourTva,
    reinitialiser,
  };
}
