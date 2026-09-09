import { useMemo, useState } from 'react';

import { supabase } from '../lib/supabase.js';
import {
  arrondi,
  coutMainOeuvre,
  debourseSec,
  euros,
  lireCoefficient,
  prixDeVente,
  tauxApplicable,
} from '../lib/moteur.js';

function ligneVide() {
  return { heures: 0, categorie: 'ouvrierQualifie' };
}

function etatInitial(profil, devisExistant) {
  if (devisExistant) {
    return {
      client: { nom: devisExistant.client_nom ?? '' },
      ouvrage: { libelle: devisExistant.ouvrage_libelle ?? '' },
      fourniture: {
        prix: devisExistant.fourniture?.prix ?? 0,
        ferme: devisExistant.fourniture?.ferme ?? false,
      },
      pose: { lignes: devisExistant.pose?.lignes?.length ? devisExistant.pose.lignes : [ligneVide()] },
      parametres: { ...profil.parametresDefaut, ...devisExistant.parametres },
      tva: {
        typeLocal: 'habitation',
        ageLogementAnnees: '',
        natureTravaux: 'amelioration',
        ...devisExistant.tva,
      },
    };
  }
  return {
    client: { nom: '' },
    ouvrage: { libelle: '' },
    fourniture: { prix: 0, ferme: false },
    // Une ligne par ouvrier posé sur le chantier — un solo n'en a qu'une,
    // une équipe en ajoute une par profil différent (apprenti + qualifié...).
    pose: { lignes: [ligneVide()] },
    parametres: { ...profil.parametresDefaut },
    tva: { typeLocal: 'habitation', ageLogementAnnees: '', natureTravaux: 'amelioration' },
  };
}

/**
 * Reproduit, comme écran, le chiffrage qu'on ferait à la main pour un
 * artisan qui achète une fourniture chez un fabricant et assure la pose :
 * déboursé -> prix de vente -> TVA -> total TTC. Un seul ouvrage à la fois —
 * le cas réel (l'escalier) qui a servi de test.
 *
 * `devisExistant` (ligne Supabase brute, venant de l'historique) bascule le
 * hook en mode modification : le formulaire part de ses valeurs et
 * `enregistrer` met à jour cette même ligne au lieu d'en créer une nouvelle.
 */
export function useDevis(profil, userId, devisExistant) {
  const [devis, setDevis] = useState(() => etatInitial(profil, devisExistant));
  const [devisId, setDevisId] = useState(devisExistant?.id ?? null);
  const [enEnregistrement, setEnEnregistrement] = useState(false);
  const [erreurEnregistrement, setErreurEnregistrement] = useState(null);
  const [devisEnregistre, setDevisEnregistre] = useState(false);

  const mettreAJourClient = (champs) => {
    setDevisEnregistre(false);
    setDevis((d) => ({ ...d, client: { ...d.client, ...champs } }));
  };
  const mettreAJourOuvrage = (champs) => {
    setDevisEnregistre(false);
    setDevis((d) => ({ ...d, ouvrage: { ...d.ouvrage, ...champs } }));
  };
  const mettreAJourFourniture = (champs) => {
    setDevisEnregistre(false);
    setDevis((d) => ({ ...d, fourniture: { ...d.fourniture, ...champs } }));
  };
  const mettreAJourLignePose = (index, champs) => {
    setDevisEnregistre(false);
    setDevis((d) => ({
      ...d,
      pose: { lignes: d.pose.lignes.map((l, i) => (i === index ? { ...l, ...champs } : l)) },
    }));
  };
  const ajouterLignePose = () => {
    setDevisEnregistre(false);
    setDevis((d) => ({ ...d, pose: { lignes: [...d.pose.lignes, ligneVide()] } }));
  };
  const retirerLignePose = (index) => {
    if (devis.pose.lignes.length <= 1) return;
    setDevisEnregistre(false);
    setDevis((d) => ({ ...d, pose: { lignes: d.pose.lignes.filter((_, i) => i !== index) } }));
  };
  const mettreAJourParametre = (cle, valeur) => {
    setDevisEnregistre(false);
    setDevis((d) => ({ ...d, parametres: { ...d.parametres, [cle]: valeur } }));
  };
  const mettreAJourTva = (champs) => {
    setDevisEnregistre(false);
    setDevis((d) => ({ ...d, tva: { ...d.tva, ...champs } }));
  };

  const reinitialiser = () => {
    setDevis(etatInitial(profil));
    setDevisId(null);
    setDevisEnregistre(false);
  };

  const resultat = useMemo(() => {
    // Une ligne de main d'oeuvre par ouvrier, chacun a son propre cout
    // horaire selon sa categorie — le total est la somme de ces lignes,
    // pas un taux moyen qui masquerait la composition reelle de l'equipe.
    const lignesMainOeuvre = devis.pose.lignes.map((ligne) => {
      const coutHoraire = profil.coutHoraire[ligne.categorie] ?? 0;
      const montant = coutMainOeuvre({
        tempsUnitaire: ligne.heures || 0,
        coutHoraire,
        coefficientContexte: 1,
      });
      return { ...ligne, coutHoraire, montant };
    });
    const mainOeuvre = euros(lignesMainOeuvre.reduce((s, l) => s + l.montant, 0));
    const heuresTotal = arrondi(devis.pose.lignes.reduce((s, l) => s + (Number(l.heures) || 0), 0), 2);
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
      lignesMainOeuvre,
      heuresTotal,
      mainOeuvre,
      debourseSec: ds,
      chaine,
      erreurParametres,
      lectureCoefficient: chaine ? lireCoefficient(chaine.coefficient) : null,
      tva,
      totalTTC,
    };
  }, [devis, profil.coutHoraire]);

  /**
   * Enregistre un instantané du devis tel qu'il est au moment de l'appel —
   * pas une référence recalculée plus tard : le prix remis au client ne doit
   * pas bouger si la bibliothèque ou le profil de l'artisan change ensuite.
   */
  const enregistrer = async () => {
    if (!userId || resultat.erreurParametres) return { error: resultat.erreurParametres ?? 'Utilisateur inconnu' };

    setEnEnregistrement(true);
    setErreurEnregistrement(null);

    const champs = {
      artisan_id: userId,
      client_nom: devis.client.nom,
      ouvrage_libelle: devis.ouvrage.libelle,
      fourniture: devis.fourniture,
      pose: devis.pose,
      parametres: devis.parametres,
      tva: devis.tva,
      resultat,
    };

    // Modifie la ligne existante si on est arrivés depuis l'historique, sinon
    // crée une nouvelle ligne — et retient son id pour qu'un second
    // enregistrement sur le même écran mette à jour plutôt que dupliquer.
    const { data, error } = devisId
      ? await supabase.from('devis').update(champs).eq('id', devisId)
      : await supabase.from('devis').insert(champs).select('id').single();

    setEnEnregistrement(false);
    if (error) {
      setErreurEnregistrement(error);
      return { error };
    }
    if (!devisId && data) setDevisId(data.id);
    setDevisEnregistre(true);
    return { error: null };
  };

  return {
    devis,
    resultat,
    enEnregistrement,
    erreurEnregistrement,
    devisEnregistre,
    estModification: Boolean(devisExistant),
    mettreAJourClient,
    mettreAJourOuvrage,
    mettreAJourFourniture,
    mettreAJourLignePose,
    ajouterLignePose,
    retirerLignePose,
    mettreAJourParametre,
    mettreAJourTva,
    reinitialiser,
    enregistrer,
  };
}
