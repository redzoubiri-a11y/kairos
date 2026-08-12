import { useState, useCallback, useMemo } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../supabase';

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

function computeStatus(p) {
  if (p.is_paused) return 'paused';
  const today = new Date().toISOString().slice(0, 10);
  if (p.end_date && p.end_date < today) return 'ended';
  if (p.start_date && p.start_date > today) return 'scheduled';
  return 'active';
}

export default function useProPromos() {
  const [view,       setView]       = useState('list');
  const [restaurant, setRestaurant] = useState(null);
  const [promos,     setPromos]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: ownerRows } = await supabase
        .from('restaurant_owners')
        .select('restaurant_id')
        .eq('auth_id', session.user.id)
        .limit(1);
      const restaurantId = ownerRows?.[0]?.restaurant_id;
      if (!restaurantId) return;

      const { data: resto } = await supabase
        .from('restaurants').select('id, name').eq('id', restaurantId).maybeSingle();
      if (resto) setRestaurant(resto);

      const { data: promoRows } = await supabase
        .from('promotions')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false });
      setPromos((promoRows ?? []).map(p => ({ ...p, status: computeStatus(p) })));
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
    await supabase.from('promotions').update({ is_paused: nextPaused }).eq('id', promo.id);
    setPromos(prev => prev.map(p => p.id === promo.id
      ? { ...p, is_paused: nextPaused, status: computeStatus({ ...p, is_paused: nextPaused }) }
      : p));
  }, []);

  const incrementUse = useCallback(async (promo) => {
    const next = (promo.use_count || 0) + 1;
    await supabase.from('promotions').update({ use_count: next }).eq('id', promo.id);
    setPromos(prev => prev.map(p => p.id === promo.id ? { ...p, use_count: next } : p));
  }, []);

  const activePromo  = useMemo(() => promos.find(p => p.status === 'active') || null, [promos]);
  const otherPromos   = useMemo(() => promos.filter(p => p.id !== activePromo?.id), [promos, activePromo]);

  return {
    view, restaurant, promos, activePromo, otherPromos, loading, saving,
    goList, goCreate, goActive, createPromo, togglePause, incrementUse,
  };
}
