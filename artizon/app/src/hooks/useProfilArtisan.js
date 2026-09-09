import { useCallback, useEffect, useMemo, useState } from 'react';

import { supabase } from '../lib/supabase.js';
import { PARAMETRES_DEFAUT, COUT_HORAIRE } from '../lib/moteur.js';

/**
 * Traduit la ligne Supabase (colonnes en snake_case, blocs composés en
 * jsonb) vers la forme utilisée par les écrans. Les colonnes jsonb sont
 * vides ('{}') à la création du compte (trigger `gerer_nouvel_artisan`) —
 * on retombe alors sur les valeurs de repère de la bibliothèque, comme au
 * tout premier lancement en local.
 */
function depuisLigne(ligne) {
  return {
    entreprise: {
      nom: ligne.nom_entreprise ?? '',
      forme: ligne.forme_juridique ?? '',
      siret: ligne.siret ?? '',
      tvaIntracommunautaire: ligne.tva_intracommunautaire ?? '',
      assuranceDecennale: {
        assureur: '',
        contrat: '',
        couvertureGeographique: 'France métropolitaine',
        ...ligne.assurance_decennale,
      },
    },
    coutHoraire: Object.keys(ligne.cout_horaire ?? {}).length
      ? ligne.cout_horaire
      : { ...COUT_HORAIRE },
    parametresDefaut: Object.keys(ligne.parametres_defaut ?? {}).length
      ? ligne.parametres_defaut
      : { ...PARAMETRES_DEFAUT },
  };
}

function versLigne(profil) {
  return {
    nom_entreprise: profil.entreprise.nom,
    forme_juridique: profil.entreprise.forme,
    siret: profil.entreprise.siret,
    tva_intracommunautaire: profil.entreprise.tvaIntracommunautaire,
    assurance_decennale: profil.entreprise.assuranceDecennale,
    cout_horaire: profil.coutHoraire,
    parametres_defaut: profil.parametresDefaut,
    updated_at: new Date().toISOString(),
  };
}

/** %FG = charges de structure de l'année / chiffre d'affaires de l'année. */
export function calculerFraisGeneraux({ chiffreAffaires, chargesStructure }) {
  const ca = Number(chiffreAffaires);
  const charges = Number(chargesStructure);
  if (!(ca > 0) || !(charges >= 0)) return null;
  return charges / ca;
}

export function useProfilArtisan(userId) {
  const [profil, setProfil] = useState(null);
  const [enChargement, setEnChargement] = useState(true);
  const [enSauvegarde, setEnSauvegarde] = useState(false);
  const [erreur, setErreur] = useState(null);

  useEffect(() => {
    if (!userId) return undefined;
    let annule = false;
    setEnChargement(true);

    supabase
      .from('profils_artisans')
      .select('*')
      .eq('id', userId)
      .single()
      .then(({ data, error }) => {
        if (annule) return;
        if (error) {
          setErreur(error);
        } else {
          setProfil(depuisLigne(data));
        }
      })
      .finally(() => {
        if (!annule) setEnChargement(false);
      });

    return () => {
      annule = true;
    };
  }, [userId]);

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
    if (!profil || !userId) return { error: 'Profil ou utilisateur manquant' };
    setEnSauvegarde(true);
    setErreur(null);
    const { error } = await supabase.from('profils_artisans').update(versLigne(profil)).eq('id', userId);
    if (error) setErreur(error);
    setEnSauvegarde(false);
    return { error };
  }, [profil, userId]);

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
  };
}
