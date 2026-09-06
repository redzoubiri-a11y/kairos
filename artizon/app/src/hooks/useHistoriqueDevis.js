import { useCallback, useEffect, useState } from 'react';

import { supabase } from '../lib/supabase.js';

/**
 * Liste des devis déjà enregistrés par l'artisan, du plus récent au plus
 * ancien. Chaque ligne garde son `resultat` tel qu'enregistré à l'époque
 * (voir useDevis.js) — l'historique rejoue ce résultat, il ne le recalcule
 * jamais.
 */
export function useHistoriqueDevis(userId) {
  const [devisListe, setDevisListe] = useState([]);
  const [enChargement, setEnChargement] = useState(true);
  const [erreur, setErreur] = useState(null);

  useEffect(() => {
    if (!userId) return undefined;
    let annule = false;
    setEnChargement(true);

    supabase
      .from('devis')
      .select('id, client_nom, ouvrage_libelle, fourniture, pose, parametres, tva, resultat, created_at')
      .eq('artisan_id', userId)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (annule) return;
        if (error) setErreur(error);
        else setDevisListe(data ?? []);
      })
      .finally(() => {
        if (!annule) setEnChargement(false);
      });

    return () => {
      annule = true;
    };
  }, [userId]);

  const supprimer = useCallback(async (id) => {
    const { error } = await supabase.from('devis').delete().eq('id', id);
    if (!error) setDevisListe((liste) => liste.filter((d) => d.id !== id));
    return { error };
  }, []);

  return { devisListe, enChargement, erreur, supprimer };
}
