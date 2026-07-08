import { useState, useCallback, useMemo } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../supabase';

// ── Helpers (partagés avec useReservations) ────────────────────────────────
export function fmtShortMR(d) {
  return new Date(d + 'T12:00:00').toLocaleDateString('fr-FR', {
    weekday: 'short', day: 'numeric', month: 'short',
  });
}

function todayStr() { return new Date().toISOString().split('T')[0]; }

// ── Hook ───────────────────────────────────────────────────────────────────

export default function useMyReservations() {
  const [reservations, setReservations] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);
  const [acting,       setActing]       = useState(new Set()); // Set<resaId>
  const [feedback,     setFeedback]     = useState({});        // { [resaId]: ActionResult }

  // ── Chargement ──────────────────────────────────────────────────────────
  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data } = await supabase
        .from('reservations')
        .select(`
          id, date, time_slot, nb_adults, nb_children, status, notes,
          restaurants!restaurant_id (id, name, phone, photos)
        `)
        .order('date',      { ascending: true })
        .order('time_slot', { ascending: true });

      setReservations(data ?? []);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  // ── Appel Edge Function reservation-manage (chemin JWT authentifié) ─────
  const callManage = useCallback(async (resaId, action, payload = {}) => {
    setActing(prev => new Set(prev).add(resaId));
    try {
      const { data, error } = await supabase.functions.invoke('reservation-manage', {
        body: { reservation_id: resaId, action, payload },
      });

      const result = data ?? {
        status: 'refused',
        reason: error?.message || 'Erreur de communication avec le serveur.',
      };

      setFeedback(prev => ({ ...prev, [resaId]: result }));
      return result;
    } catch {
      const result = { status: 'refused', reason: 'Erreur réseau. Vérifiez votre connexion.' };
      setFeedback(prev => ({ ...prev, [resaId]: result }));
      return result;
    } finally {
      setActing(prev => { const s = new Set(prev); s.delete(resaId); return s; });
    }
  }, []);

  // ── Actions ─────────────────────────────────────────────────────────────
  const cancel = useCallback(async (resaId) => {
    const result = await callManage(resaId, 'cancel');
    if (result.status === 'ok') {
      setReservations(prev =>
        prev.map(r => r.id === resaId ? { ...r, status: 'cancelled' } : r)
      );
    }
    return result;
  }, [callManage]);

  const modifyTime = useCallback(async (resaId, date, timeSlot) => {
    const result = await callManage(resaId, 'modify_time', { date, time_slot: timeSlot });
    if (result.status === 'ok') {
      setReservations(prev =>
        prev.map(r => r.id === resaId ? { ...r, date, time_slot: timeSlot } : r)
      );
    }
    return result;
  }, [callManage]);

  const modifyParty = useCallback(async (resaId, nbAdults, nbChildren) => {
    const result = await callManage(resaId, 'modify_party', { nb_adults: nbAdults, nb_children: nbChildren });
    if (result.status === 'ok') {
      setReservations(prev =>
        prev.map(r => r.id === resaId ? { ...r, nb_adults: nbAdults, nb_children: nbChildren } : r)
      );
    }
    return result;
  }, [callManage]);

  const clearFeedback = useCallback((resaId) => {
    setFeedback(prev => { const n = { ...prev }; delete n[resaId]; return n; });
  }, []);

  // ── Dérivés ─────────────────────────────────────────────────────────────
  const today = todayStr();

  const upcomingResas = useMemo(
    () => reservations.filter(r =>
      r.date >= today && ['confirmed', 'pending'].includes(r.status)
    ),
    [reservations, today],
  );

  return {
    reservations,
    upcomingResas,
    loading,
    refreshing,
    acting,
    feedback,
    load,
    cancel,
    modifyTime,
    modifyParty,
    clearFeedback,
  };
}
