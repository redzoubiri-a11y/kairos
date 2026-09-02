import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../supabase';
import { typeErreur } from '../utils/typeErreur';

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
  const [erreur,  setErreur]  = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErreur(null);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const authId = auth?.user?.id;
      if (!authId) { setHistory([]); return; }

      const { data: row } = await supabase.from('users').select('id').eq('auth_id', authId).maybeSingle();
      if (!row) { setHistory([]); return; }

      const { data, error } = await supabase.from('points')
        .select('id, motif, montant, reference_id, created_at')
        .eq('user_id', row.id)
        .order('created_at', { ascending: false });

      // L'erreur était écartée : le solde de points affichait « 0 » sur une
      // coupure réseau, ce qui laisse croire à une perte de points.
      if (error) { setErreur(typeErreur(error)); setHistory([]); return; }
      setHistory((data ?? []).map(p => ({ ...p, label: MOTIF_LABELS[p.motif] || p.motif })));
    } catch (e) {
      setErreur(typeErreur(e));
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const balance = useMemo(
    () => history.reduce((sum, p) => sum + p.montant, 0),
    [history],
  );

  return { balance, history, loading, erreur, refresh: load };
}
