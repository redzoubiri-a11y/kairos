import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabase';

export function useMonthlyReport(restaurantId) {
  const [report, setReport]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const fetchReport = useCallback(async () => {
    if (!restaurantId) return;
    setLoading(true);
    setError(null);

    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const endOfMonth   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

      const { data: reservations, error: resError } = await supabase
        .from('reservations')
        .select('id, status, reminder_whatsapp_sent, reminder_push_sent, reminder_h2_whatsapp_sent, reminder_h2_push_sent')
        .eq('restaurant_id', restaurantId)
        .gte('created_at', startOfMonth)
        .lte('created_at', endOfMonth);

      if (resError) throw resError;

      const rows     = reservations ?? [];
      const total    = rows.length;
      const noShows  = rows.filter(r => r.status === 'no_show').length;
      const cancelled = rows.filter(r => r.status === 'cancelled').length;

      // Rappel envoyé ET client venu = no-show évité
      const noShowsAvoided = rows.filter(r =>
        (r.reminder_whatsapp_sent || r.reminder_push_sent ||
         r.reminder_h2_whatsapp_sent || r.reminder_h2_push_sent) &&
        r.status === 'arrived'
      ).length;

      // 3 min de gestion manuelle économisées par réservation traitée
      const hoursSaved = Math.round((total * 3) / 60 * 10) / 10;

      setReport({
        totalReservations:       total,
        noShowsAvoided,
        noShows,
        selfServiceCancellations: cancelled,
        hoursSaved,
        month: now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  return { report, loading, error, refetch: fetchReport };
}
