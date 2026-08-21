import { useState, useEffect } from 'react';
import { supabase } from '../../supabase';

// Villes actives (is_live=true dans `cities`) pour les onglets de zone de l'Accueil.
export default function useLiveCities() {
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('cities')
          .select('id, slug, name')
          .eq('is_live', true)
          .order('name');
        if (!cancelled) setCities(error ? [] : (data ?? []));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return { cities, loading };
}
