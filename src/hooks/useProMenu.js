import { useState, useCallback, useMemo } from 'react';
import { Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../supabase';

export const DEFAULT_CATS = ['🥗 Entrées', '🍖 Plats', '🍰 Desserts', '🥤 Boissons'];
export const EMPTY_FORM   = { name: '', description: '', price: '', category: '🍖 Plats', isAvailable: true, isDishOfDay: false, hasAllergens: false, photo: '' };

export default function useProMenu() {
  const [restaurant,  setRestaurant]  = useState(null);
  const [dishes,      setDishes]      = useState([]);
  const [categories,  setCategories]  = useState(DEFAULT_CATS);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [view,        setView]        = useState('list');
  const [activeCat,   setActiveCat]   = useState(null);
  const [editingDish, setEditingDish] = useState(null);
  const [acting,      setActing]      = useState(new Set());

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: ownerRows } = await supabase
        .from('restaurant_owners')
        .select('restaurant_id')
        .eq('auth_id', session.user.id)
        .limit(1);
      const ownerRow = ownerRows?.[0] ?? null;

      if (!ownerRow?.restaurant_id) return;

      const { data: resto } = await supabase
        .from('restaurants')
        .select('id, name')
        .eq('id', ownerRow.restaurant_id)
        .maybeSingle();

      if (!resto) return;
      setRestaurant(resto);

      const { data: rows } = await supabase
        .from('dishes')
        .select('id, name, description, price, category, is_available, is_dish_of_day, has_allergens, photo, created_at')
        .eq('restaurant_id', resto.id)
        .order('created_at', { ascending: true });

      const list = rows ?? [];

      // L'ordre des catégories suit l'ordre de création : c'est celui que le
      // restaurateur a suivi en saisissant sa carte, et le trier autrement
      // ferait remonter « Boissons » avant « Entrées ». On le calcule donc
      // avant de réordonner les plats.
      const dishCats = [...new Set(list.map(d => d.category).filter(Boolean))];

      // Affichage : du plus cher au moins cher. `price` arrive en texte depuis
      // Postgres et peut être absent — Number(...) || 0 évite un NaN qui
      // rendrait le tri imprévisible, et pousse les plats sans prix en fin.
      setDishes([...list].sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0)));
      setCategories(prev => [...new Set([...prev, ...dishCats])]);

      if (list.length > 0) {
        setActiveCat(ac => ac || list[0].category || DEFAULT_CATS[1]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const toggleAvailability = useCallback(async (dish) => {
    setActing(p => new Set(p).add(dish.id));
    try {
      await supabase.from('dishes').update({ is_available: !dish.is_available }).eq('id', dish.id);
      setDishes(prev => prev.map(d => d.id === dish.id ? { ...d, is_available: !d.is_available } : d));
    } finally {
      setActing(p => { const next = new Set(p); next.delete(dish.id); return next; });
    }
  }, []);

  const saveDish = useCallback(async (form) => {
    if (!restaurant) {
      Alert.alert('Erreur', 'Restaurant non chargé. Réessayez.');
      return;
    }
    const payload = {
      name:           form.name.trim(),
      description:    form.description.trim(),
      price:          parseInt(form.price, 10) || 0,
      category:       form.category,
      is_available:   form.isAvailable,
      is_dish_of_day: form.isDishOfDay,
      has_allergens:  form.hasAllergens,
      photo:          form.photo || null,
    };
    let err;
    if (editingDish) {
      ({ error: err } = await supabase.from('dishes').update(payload).eq('id', editingDish.id));
    } else {
      ({ error: err } = await supabase.from('dishes').insert({ ...payload, restaurant_id: restaurant.id }));
    }
    if (err) {
      Alert.alert('Erreur sauvegarde', err.message);
      return;
    }
    setView('list');
    setEditingDish(null);
    await load();
  }, [restaurant, editingDish, load]);

  const deleteDish = useCallback(async () => {
    if (!editingDish) return;
    await supabase.from('dishes').delete().eq('id', editingDish.id);
    setDishes(prev => prev.filter(d => d.id !== editingDish.id));
    setView('list');
    setEditingDish(null);
  }, [editingDish]);

  const filtered    = useMemo(() => activeCat ? dishes.filter(d => d.category === activeCat) : dishes, [dishes, activeCat]);
  const activeCount = useMemo(() => dishes.filter(d => d.is_available).length, [dishes]);

  const openAddForm  = useCallback(() => { setEditingDish(null); setView('add'); }, []);
  const cancelForm   = useCallback(() => { setView('list'); setEditingDish(null); }, []);
  const goCategories = useCallback(() => setView('categories'), []);
  const goList       = useCallback(() => setView('list'), []);
  const onRefresh    = useCallback(() => load(true), [load]);
  const addCat       = useCallback(cat => setCategories(prev => [...prev, cat]), []);
  const deleteCat    = useCallback(cat => setCategories(prev => prev.filter(c => c !== cat)), []);

  return {
    restaurant, dishes, categories, loading, refreshing,
    view, activeCat, editingDish, acting,
    setActiveCat, setEditingDish, setView,
    toggleAvailability, saveDish, deleteDish,
    filtered, activeCount,
    openAddForm, cancelForm, goCategories, goList, onRefresh, addCat, deleteCat,
  };
}
