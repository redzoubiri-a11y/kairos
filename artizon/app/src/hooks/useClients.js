import { useCallback, useEffect, useState } from 'react';

import { supabase } from '../lib/supabase.js';

function depuisLigne(ligne) {
  return { id: ligne.id, nom: ligne.nom, telephone: ligne.telephone, adresse: ligne.adresse };
}

/**
 * Carnet d'adresses de l'artisan — un client enregistré une fois, réutilisé
 * sur chaque nouveau devis sans retaper le nom (voir useDevis.js pour le
 * devis lui-même, qui ne garde qu'un instantané du nom, pas de lien vivant
 * vers cette fiche).
 */
export function useClients(userId) {
  const [clients, setClients] = useState([]);
  const [enChargement, setEnChargement] = useState(true);

  useEffect(() => {
    if (!userId) return undefined;
    let annule = false;
    setEnChargement(true);

    supabase
      .from('clients')
      .select('id, nom, telephone, adresse')
      .eq('artisan_id', userId)
      .order('nom', { ascending: true })
      .then(({ data, error }) => {
        if (annule) return;
        if (!error) setClients((data ?? []).map(depuisLigne));
      })
      .finally(() => {
        if (!annule) setEnChargement(false);
      });

    return () => {
      annule = true;
    };
  }, [userId]);

  const ajouter = useCallback(
    async ({ nom, telephone, adresse }) => {
      if (!userId) return { error: 'Utilisateur inconnu' };
      if (!nom.trim()) return { error: 'Nom requis' };

      const { data, error } = await supabase
        .from('clients')
        .insert({ artisan_id: userId, nom: nom.trim(), telephone: telephone.trim(), adresse: adresse.trim() })
        .select('id, nom, telephone, adresse')
        .single();

      if (error) return { error };

      const client = depuisLigne(data);
      setClients((liste) => [...liste, client].sort((a, b) => a.nom.localeCompare(b.nom)));
      return { error: null, client };
    },
    [userId],
  );

  return { clients, enChargement, ajouter };
}
