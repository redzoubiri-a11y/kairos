import { useState, useCallback } from 'react';
import { supabase } from '../../supabase';

async function currentUserRowId() {
  const { data } = await supabase.auth.getUser();
  const authId = data?.user?.id;
  if (!authId) return null;
  const { data: row } = await supabase.from('users').select('id').eq('auth_id', authId).maybeSingle();
  return row?.id ?? null;
}

// Avis (Lot 2) — la table `reviews` fait déjà foi (RLS en base impose une réservation
// honorée, cf. migration 20260815_avis_fidelite.sql) : ce hook ne fait qu'aider l'UI à
// proposer les bonnes réservations, il ne remplace pas la contrainte serveur.
export default function useAvis() {
  const [eligible,          setEligible]          = useState([]);
  const [loadingEligibility, setLoadingEligibility] = useState(false);
  const [submitting,        setSubmitting]        = useState(false);
  const [error,             setError]             = useState(null);

  // Réservations honorées (status='arrived') pour ce restaurant, sans avis existant.
  const checkEligibility = useCallback(async (restaurantId) => {
    setLoadingEligibility(true);
    setError(null);
    try {
      const userId = await currentUserRowId();
      if (!userId) { setEligible([]); return []; }

      const { data, error: qErr } = await supabase.from('reservations')
        .select('id, date, time_slot, reviews(id)')
        .eq('user_id', userId)
        .eq('restaurant_id', restaurantId)
        .eq('status', 'arrived')
        .order('date', { ascending: false });

      if (qErr) { setError(qErr.message); setEligible([]); return []; }

      const withoutReview = (data ?? []).filter(r => !r.reviews || r.reviews.length === 0);
      setEligible(withoutReview);
      return withoutReview;
    } finally {
      setLoadingEligibility(false);
    }
  }, []);

  const createAvis = useCallback(async ({ reservationId, restaurantId, rating, comment }) => {
    setSubmitting(true);
    setError(null);
    try {
      const userId = await currentUserRowId();
      if (!userId) throw new Error('Utilisateur introuvable');

      const { data, error: insErr } = await supabase.from('reviews').insert({
        user_id: userId,
        restaurant_id: restaurantId,
        reservation_id: reservationId,
        rating,
        comment: comment || null,
      }).select().maybeSingle();

      if (insErr) throw insErr;
      setEligible(prev => prev.filter(r => r.id !== reservationId));
      return data;
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setSubmitting(false);
    }
  }, []);

  return {
    eligible, loadingEligibility,
    submitting, error,
    checkEligibility, createAvis,
  };
}
