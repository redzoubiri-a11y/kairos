import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../supabase';

const MOTIF_LABELS = {
  reservation_honoree: 'Réservation honorée',
  commande:            'Commande récupérée',
  avis:                'Avis laissé',
};

// Solde et historique de fidélité (Lot 2) — lecture seule : l'attribution des points
// se fait exclusivement en base (triggers `award_points_*`, cf. migration), jamais ici.
export default function usePoints() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const authId = auth?.user?.id;
      if (!authId) { setHistory([]); return; }

      const { data: row } = await supabase.from('users').select('id').eq('auth_id', authId).maybeSingle();
      if (!row) { setHistory([]); return; }

      const { data } = await supabase.from('points')
        .select('id, motif, montant, reference_id, created_at')
        .eq('user_id', row.id)
        .order('created_at', { ascending: false });

      setHistory((data ?? []).map(p => ({ ...p, label: MOTIF_LABELS[p.motif] || p.motif })));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const balance = useMemo(
    () => history.reduce((sum, p) => sum + p.montant, 0),
    [history],
  );

  return { balance, history, loading, refresh: load };
}
