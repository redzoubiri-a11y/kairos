import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../supabase';

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
};

const ALGER_DEFAULT = { latitude: 36.7538, longitude: 3.0588 };

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
  const base = QUARTIER_COORDS[key] || cityDefault;
  const seed = typeof r.id === 'string'
    ? r.id.charCodeAt(0) + r.id.charCodeAt(r.id.length - 1)
    : (r.id || 0);
  return {
    latitude:  base.latitude  + (((seed * 7919) % 1000) / 1000 - 0.5) * 0.006,
    longitude: base.longitude + (((seed * 6271) % 1000) / 1000 - 0.5) * 0.006,
  };
}

export default function useExplorer() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [query,       setQuery]       = useState('');
  const [sortBy,      setSortBy]      = useState('pertinence'); // 'pertinence' | 'note'

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data } = await supabase
          .from('restaurants')
          .select('id, name, cuisine_type, address, quartier, city, photos, avg_rating, avg_ticket, review_count, capacity, latitude, longitude, opening_hours, phone')
          .eq('status', 'active')
          .order('avg_rating', { ascending: false });
        setRestaurants(data ?? []);
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
    ));
    if (sortBy === 'note') {
      list = [...list].sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0));
    }
    return list;
  }, [restaurants, query, sortBy]);

  return {
    restaurants: filteredRestaurants,
    loading,
    query, setQuery,
    sortBy, setSortBy,
  };
}
