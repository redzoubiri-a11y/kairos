import { useState, useCallback, useMemo } from 'react';
import { Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../supabase';
import { computePromoStatus } from '../utils/promoStatus';
import { typeErreur } from '../utils/typeErreur';

export const PROMO_TYPES = [
  { id: 'percent', icon: '%',   label: 'Réduction %',  desc: "Ex : −20% sur l'addition" },
  { id: 'fixed',   icon: 'DA',  label: 'Montant fixe', desc: 'Ex : −500 DA offerts' },
  { id: 'free',    icon: '🎁',  label: 'Offert',        desc: 'Ex : Dessert offert' },
  { id: '2for1',   icon: '2×1', label: '2 pour 1',     desc: 'Le moins cher offert' },
];
export const PERCENTS = ['10%', '15%', '20%', '25%', '30%'];

export const STATUS_LABEL = {
  active:    'ACTIVE',
  scheduled: 'PROGRAMMÉE',
  ended:     'TERMINÉE',
  paused:    'SUSPENDUE',
};

export default function useProPromos() {
  const [view,       setView]       = useState('list');
  const [restaurant, setRestaurant] = useState(null);
  const [promos,     setPromos]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [erreur,     setErreur]     = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErreur(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Sous coupure réseau, c'est cette requête qui échoue en premier :
      // sans lecture de son erreur, la fonction sortait ici sans jamais
      // atteindre le chargement des promotions plus bas.
      const { data: ownerRows, error: ownerErr } = await supabase
        .from('restaurant_owners')
        .select('restaurant_id')
        .eq('auth_id', session.user.id)
        .limit(1);
      if (ownerErr) { setErreur(typeErreur(ownerErr)); setPromos([]); return; }
      const restaurantId = ownerRows?.[0]?.restaurant_id;
      if (!restaurantId) return;

      const { data: resto, error: restoErr } = await supabase
        .from('restaurants').select('id, name').eq('id', restaurantId).maybeSingle();
      if (restoErr) { setErreur(typeErreur(restoErr)); setPromos([]); return; }
      if (resto) setRestaurant(resto);

      const { data: promoRows, error } = await supabase
        .from('promotions')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false });
      if (error) { setErreur(typeErreur(error)); setPromos([]); return; }
      setPromos((promoRows ?? []).map(p => ({ ...p, status: computePromoStatus(p) })));
    } catch (e) {
      setErreur(typeErreur(e));
      setPromos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const goList   = useCallback(() => setView('list'),   []);
  const goCreate = useCallback(() => setView('create'), []);
  const goActive = useCallback(() => setView('active'), []);

  const createPromo = useCallback(async (fields) => {
    if (!restaurant?.id) return null;
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('promotions')
        .insert({ restaurant_id: restaurant.id, ...fields })
        .select().single();
      if (error) throw error;
      await load();
      return data;
    } finally {
      setSaving(false);
    }
  }, [restaurant, load]);

  const togglePause = useCallback(async (promo) => {
    const nextPaused = !promo.is_paused;
    // L'écran affichait « en pause » même quand l'écriture échouait : le
    // restaurateur croyait avoir coupé une promo qui restait active en base.
    const { error } = await supabase.from('promotions').update({ is_paused: nextPaused }).eq('id', promo.id);
    if (error) { Alert.alert('Erreur', "L'état de la promotion n'a pas pu être mis à jour. Vérifiez votre connexion et réessayez."); return; }
    setPromos(prev => prev.map(p => p.id === promo.id
      ? { ...p, is_paused: nextPaused, status: computePromoStatus({ ...p, is_paused: nextPaused }) }
      : p));
  }, []);

  const incrementUse = useCallback(async (promo) => {
    const next = (promo.use_count || 0) + 1;
    const { error } = await supabase.from('promotions').update({ use_count: next }).eq('id', promo.id);
    if (error) { Alert.alert('Erreur', "Le compteur n'a pas pu être mis à jour. Vérifiez votre connexion et réessayez."); return; }
    setPromos(prev => prev.map(p => p.id === promo.id ? { ...p, use_count: next } : p));
  }, []);

  const activePromo  = useMemo(() => promos.find(p => p.status === 'active') || null, [promos]);
  const otherPromos   = useMemo(() => promos.filter(p => p.id !== activePromo?.id), [promos, activePromo]);

  return {
    view, restaurant, promos, activePromo, otherPromos, loading, saving, erreur, reessayer: load,
    goList, goCreate, goActive, createPromo, togglePause, incrementUse,
  };
}
