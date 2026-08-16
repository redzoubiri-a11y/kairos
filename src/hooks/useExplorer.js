import { useState, useEffect, useMemo, useCallback } from 'react';
import * as Location from 'expo-location';
import { supabase } from '../../supabase';
import { computePromoStatus } from '../utils/promoStatus';

export const QUARTIER_COORDS = {
  'hydra':{ latitude:36.7539, longitude:3.0427 },
  'bab el oued':{ latitude:36.7900, longitude:3.0573 },
  'el biar':{ latitude:36.7614, longitude:3.0364 },
  'centre':{ latitude:36.7625, longitude:3.0521 },
  'ben aknoun':{ latitude:36.7611, longitude:3.0157 },
  'bir mourad raïs':{ latitude:36.7381, longitude:3.0521 },
  'chéraga':{ latitude:36.7669, longitude:2.9605 },
  'dely ibrahim':{ latitude:36.7608, longitude:2.9843 },
  'sidi fredj':{ latitude:36.7760, longitude:2.9102 },
  'pins maritimes':{ latitude:36.7522, longitude:3.0980 },
  'casbah':{ latitude:36.7866, longitude:3.0601 },
  'centre-ville':{ latitude:35.6973, longitude:-0.6342 },
  'les falaises':{ latitude:35.7273, longitude:-0.6462 },
  'bir el djir':{ latitude:35.6889, longitude:-0.5882 },
  'la corniche':{ latitude:35.7384, longitude:-0.6718 },
  'sidi el houari':{ latitude:35.7094, longitude:-0.6531 },
  'eckmuhl':{ latitude:35.6923, longitude:-0.6291 },
  'médina jedida':{ latitude:35.7065, longitude:-0.6422 },
  'le plateau':{ latitude:35.7012, longitude:-0.6178 },
  'aïn turk':{ latitude:35.7582, longitude:-0.7685 },
  "sidi m'cid":{ latitude:36.3800, longitude:6.6100 },
  'médina':{ latitude:36.3700, longitude:6.6050 },
  'mansourah':{ latitude:36.3500, longitude:6.5950 },
  'faubourg lamy':{ latitude:36.3620, longitude:6.6200 },
  'el kantara':{ latitude:36.3450, longitude:6.6000 },
  'daksi':{ latitude:36.3750, longitude:6.6400 },
  'zouaghi':{ latitude:36.3300, longitude:6.5800 },
  'port de tipaza':{ latitude:36.5943, longitude:2.4460 },
};

const ALGER_DEFAULT = { latitude: 36.7538, longitude: 3.0588 };

// Centre de chaque ville — filet de sécurité avant de retomber sur Alger,
// pour les restos sans latitude/longitude ET dont le quartier n'est pas
// dans QUARTIER_COORDS (ex. Tipaza : 'Chenoua'/'Parc de Loisirs' absents).
const CITY_COORDS = {
  alger:       { latitude: 36.7538, longitude: 3.0588 },
  tipaza:      { latitude: 36.5911, longitude: 2.4475 },
  // Alias : certains restos ont "Tipaza Centre" en city (chaîne littérale distincte
  // de "tipaza"), ex. TERRAZA ZIANI'S — tombait sur Alger faute de correspondance exacte.
  tipaza_centre: { latitude: 36.5911, longitude: 2.4475 },
  oran:        { latitude: 35.6969, longitude: -0.6331 },
  constantine: { latitude: 36.3650, longitude: 6.6147 },
  tizi_ouzou:  { latitude: 36.7117, longitude: 4.0450 },
  bejaia:      { latitude: 36.7509, longitude: 5.0564 },
  setif:       { latitude: 36.1898, longitude: 5.4108 },
  annaba:      { latitude: 36.9000, longitude: 7.7667 },
  tlemcen:     { latitude: 34.8828, longitude: -1.3167 },
  blida:       { latitude: 36.4722, longitude: 2.8277 },
};

export const CUISINE_EMOJI = {
  algerien:'🥘', mediterraneen:'🐟', fast_casual:'☕',
  italien:'🍕', japonais:'🍣', turc:'🍢', libanais:'🌿', francais:'🍷',
  thai:'🍜', indien:'🍛', jordanien:'🧆', marocain:'🥙', egyptien:'🫓',
  autre:'🍽️',
};

export function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function getCoord(r, cityDefault = ALGER_DEFAULT) {
  if (r.latitude && r.longitude) return { latitude: r.latitude, longitude: r.longitude };
  const key  = (r.quartier || '').toLowerCase();
  const cityKey = (r.city || '').toLowerCase().replace(/\s+/g, '_');
  const base = QUARTIER_COORDS[key] || CITY_COORDS[cityKey] || cityDefault;
  const seed = typeof r.id === 'string'
    ? r.id.charCodeAt(0) + r.id.charCodeAt(r.id.length - 1)
    : (r.id || 0);
  return {
    latitude:  base.latitude  + (((seed * 7919) % 1000) / 1000 - 0.5) * 0.006,
    longitude: base.longitude + (((seed * 6271) % 1000) / 1000 - 0.5) * 0.006,
  };
}

// Normalise un nom de ville (accents, espaces) pour matcher la convention
// snake_case sans accent stockée dans restaurants.city (ex. "Tizi Ouzou" → "tizi_ouzou").
const DIACRITICS_RE = new RegExp('[̀-ͯ]', 'g');
function normalizeCity(str) {
  return (str || '')
    .toLowerCase()
    .normalize('NFD').replace(DIACRITICS_RE, '')
    .trim()
    .replace(/\s+/g, '_');
}

export default function useExplorer() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [query,       setQuery]       = useState('');
  const [sortBy,      setSortBy]      = useState('pertinence'); // 'pertinence' | 'note'
  const [activeFilters, setActiveFilters] = useState(new Set());
  const [userLocation, setUserLocation] = useState(null);

  const toggleFilter = (id) => setActiveFilters(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const requestLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setUserLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
    } catch (_) {}
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [{ data }, { data: promoRows }] = await Promise.all([
          supabase
            .from('restaurants')
            .select('id, name, cuisine_type, address, quartier, city, photos, avg_rating, avg_ticket, review_count, capacity, latitude, longitude, opening_hours, phone, terrasse, parking, click_collect_enabled')
            .eq('status', 'active')
            .order('avg_rating', { ascending: false }),
          supabase.from('promotions').select('restaurant_id, title, type, percent_value, fixed_value, start_date, end_date, is_paused'),
        ]);
        // Une seule promo (la plus récente) affichée par resto si plusieurs sont actives.
        const promoByRestaurant = {};
        for (const p of promoRows ?? []) {
          if (computePromoStatus(p) !== 'active') continue;
          if (!promoByRestaurant[p.restaurant_id]) promoByRestaurant[p.restaurant_id] = p;
        }
        setRestaurants((data ?? []).map(r => ({ ...r, promo: promoByRestaurant[r.id] || null })));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filteredRestaurants = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = !q ? restaurants : restaurants.filter(r => (
      r.name?.toLowerCase().includes(q)
      || r.cuisine_type?.toLowerCase().includes(q)
      || r.quartier?.toLowerCase().includes(q)
      || normalizeCity(r.city) === normalizeCity(q)
    ));
    if (activeFilters.has('price')) list = list.filter(r => r.avg_ticket >= 1500 && r.avg_ticket < 3000);
    if (activeFilters.has('note')) list = list.filter(r => (r.avg_rating || 0) >= 4.5);
    if (activeFilters.has('promo')) list = list.filter(r => !!r.promo);
    if (sortBy === 'note') {
      list = [...list].sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0));
    }
    return list;
  }, [restaurants, query, sortBy, activeFilters]);

  return {
    allRestaurants: restaurants,
    activeFilters, toggleFilter,
    restaurants: filteredRestaurants,
    loading,
    query, setQuery,
    sortBy, setSortBy,
    userLocation, requestLocation,
  };
}
