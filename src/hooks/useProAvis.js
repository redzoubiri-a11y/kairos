import { useState, useCallback, useMemo } from 'react';
import { Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../supabase';
import { colors } from '../theme';
import { typeErreur } from '../utils/typeErreur';

export const STARS   = [1, 2, 3, 4, 5];
export const FILTERS = ['Tous', 'Sans réponse'];

export function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function initials(first, last) {
  return ((first?.[0] || '') + (last?.[0] || '')).toUpperCase() || '?';
}

export const AVATAR_COLORS = [colors.accent, colors.blue, colors.green, colors.purple || '#9B5AE0', colors.accentDim || colors.accent];

export function avatarColor(name) {
  let h = 0;
  for (let i = 0; i < (name || '').length; i++) h = (h * 31 + name.charCodeAt(i)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[Math.abs(h)];
}

export default function useProAvis() {
  const [reviews,    setReviews]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter,     setFilter]     = useState('Tous');
  const [restaurant, setRestaurant] = useState(null);
  const [erreur,     setErreur]     = useState(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setErreur(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Sous coupure réseau, c'est cette requête qui échoue en premier :
      // sans lecture de son erreur, la fonction sortait ici sans jamais
      // atteindre le chargement des avis plus bas.
      const { data: ownerRows, error: ownerErr } = await supabase
        .from('restaurant_owners')
        .select('restaurant_id')
        .eq('auth_id', session.user.id)
        .limit(1);
      if (ownerErr) { setErreur(typeErreur(ownerErr)); setReviews([]); return; }
      const ownerRow = ownerRows?.[0] ?? null;

      if (!ownerRow?.restaurant_id) return;

      const { data: resto, error: restoErr } = await supabase
        .from('restaurants')
        .select('id, name')
        .eq('id', ownerRow.restaurant_id)
        .maybeSingle();
      if (restoErr) { setErreur(typeErreur(restoErr)); setReviews([]); return; }
      if (resto) setRestaurant(resto);

      const { data, error } = await supabase
        .from('reviews')
        .select('id, rating, comment, created_at, pro_response, moderation_status, users(first_name, last_name)')
        .eq('restaurant_id', ownerRow.restaurant_id)
        .order('created_at', { ascending: false });
      if (error) { setErreur(typeErreur(error)); setReviews([]); return; }

      setReviews(data ?? []);
    } catch (e) {
      setErreur(typeErreur(e));
      setReviews([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleSaveResponse = useCallback((id, text) => {
    setReviews(prev => prev.map(r => r.id === id ? { ...r, pro_response: text } : r));
  }, []);

  const onRefresh = useCallback(() => load(true), [load]);

  const approved = useMemo(() => reviews.filter(r => r.moderation_status === 'approved'), [reviews]);

  const noReply = useMemo(() => approved.filter(r => !r.pro_response).length, [approved]);

  const filtered = useMemo(() => reviews.filter(r => {
    if (filter === 'Sans réponse') return r.moderation_status === 'approved' && !r.pro_response;
    return true;
  }), [reviews, filter]);

  const handleApprove = useCallback(async (id) => {
    // L'écran retirait l'avis de la file de modération même quand
    // l'écriture échouait — il pouvait rester en attente indéfiniment
    // sans que personne ne s'en aperçoive.
    const { error } = await supabase.from('reviews').update({ moderation_status: 'approved' }).eq('id', id);
    if (error) { Alert.alert('Erreur', "L'avis n'a pas pu être approuvé. Vérifiez votre connexion et réessayez."); return; }
    setReviews(prev => prev.map(r => r.id === id ? { ...r, moderation_status: 'approved' } : r));
  }, []);

  const handleReject = useCallback(async (id) => {
    const { error } = await supabase.from('reviews').update({ moderation_status: 'rejected' }).eq('id', id);
    if (error) { Alert.alert('Erreur', "L'avis n'a pas pu être rejeté. Vérifiez votre connexion et réessayez."); return; }
    setReviews(prev => prev.filter(r => r.id !== id));
  }, []);

  return {
    reviews, loading, refreshing, erreur, reessayer: load, filter, setFilter, restaurant,
    handleSaveResponse, handleApprove, handleReject,
    onRefresh, noReply, filtered,
  };
}
