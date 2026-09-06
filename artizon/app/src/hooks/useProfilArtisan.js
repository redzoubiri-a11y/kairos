import { useCallback, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { PARAMETRES_DEFAUT, COUT_HORAIRE } from '../lib/moteur.js';

const CLE_STOCKAGE = '@artizon/profil-artisan';

/**
 * Profil par défaut : les valeurs de la bibliothèque servent de repère au
 * premier lancement, avant que l'artisan ne les remplace par ses propres
 * chiffres. Elles ne représentent jamais "le" bon prix, seulement un point
 * de départ raisonnable — voir SKILL chiffreur-artizon, règle sur les prix
 * sans source.
 */
function profilParDefaut() {
  return {
    entreprise: {
      nom: '',
      forme: '',
      siret: '',
      tvaIntracommunautaire: '',
      assuranceDecennale: {
        assureur: '',
        contrat: '',
        couvertureGeographique: 'France métropolitaine',
      },
    },
    coutHoraire: { ...COUT_HORAIRE },
    parametresDefaut: { ...PARAMETRES_DEFAUT },
  };
}

/** %FG = charges de structure de l'année / chiffre d'affaires de l'année. */
export function calculerFraisGeneraux({ chiffreAffaires, chargesStructure }) {
  const ca = Number(chiffreAffaires);
  const charges = Number(chargesStructure);
  if (!(ca > 0) || !(charges >= 0)) return null;
  return charges / ca;
}

export function useProfilArtisan() {
  const [profil, setProfil] = useState(null);
  const [enChargement, setEnChargement] = useState(true);
  const [enSauvegarde, setEnSauvegarde] = useState(false);
  const [erreur, setErreur] = useState(null);

  useEffect(() => {
    let annule = false;

    AsyncStorage.getItem(CLE_STOCKAGE)
      .then((brut) => {
        if (annule) return;
        setProfil(brut ? JSON.parse(brut) : profilParDefaut());
      })
      .catch((e) => {
        if (annule) return;
        setErreur(e);
        setProfil(profilParDefaut());
      })
      .finally(() => {
        if (!annule) setEnChargement(false);
      });

    return () => {
      annule = true;
    };
  }, []);

  const mettreAJourEntreprise = useCallback((champs) => {
    setProfil((p) => ({ ...p, entreprise: { ...p.entreprise, ...champs } }));
  }, []);

  const mettreAJourAssurance = useCallback((champs) => {
    setProfil((p) => ({
      ...p,
      entreprise: {
        ...p.entreprise,
        assuranceDecennale: { ...p.entreprise.assuranceDecennale, ...champs },
      },
    }));
  }, []);

  const mettreAJourCoutHoraire = useCallback((categorie, valeur) => {
    setProfil((p) => ({
      ...p,
      coutHoraire: { ...p.coutHoraire, [categorie]: valeur },
    }));
  }, []);

  const mettreAJourParametre = useCallback((cle, valeur) => {
    setProfil((p) => ({
      ...p,
      parametresDefaut: { ...p.parametresDefaut, [cle]: valeur },
    }));
  }, []);

  const sauvegarder = useCallback(async () => {
    if (!profil) return;
    setEnSauvegarde(true);
    setErreur(null);
    try {
      await AsyncStorage.setItem(CLE_STOCKAGE, JSON.stringify(profil));
    } catch (e) {
      setErreur(e);
    } finally {
      setEnSauvegarde(false);
    }
  }, [profil]);

  const reinitialiser = useCallback(() => {
    setProfil(profilParDefaut());
  }, []);

  const estComplet = useMemo(() => {
    if (!profil) return false;
    return Boolean(profil.entreprise.nom && profil.entreprise.siret);
  }, [profil]);

  return {
    profil,
    enChargement,
    enSauvegarde,
    erreur,
    estComplet,
    mettreAJourEntreprise,
    mettreAJourAssurance,
    mettreAJourCoutHoraire,
    mettreAJourParametre,
    sauvegarder,
    reinitialiser,
  };
}
