import { useState, useEffect } from 'react';
import { supabase } from '../../supabase';

export const ALGER = { latitude: 36.7538, longitude: 3.0588 };
export const INITIAL_REGION = { ...ALGER, latitudeDelta: 0.12, longitudeDelta: 0.12 };

export const CUISINE_EMOJI = {
  algerien: '🥘', mediterraneen: '🐟', fast_casual: '☕',
  italien: '🍕', japonais: '🍣', turc: '🍢', libanais: '🌿', francais: '🍷',
  thai: '🍜', indien: '🍛', jordanien: '🧆', marocain: '🥙', egyptien: '🫓',
  autre: '🍽️',
};

export const QUARTIER_COORDS = {
  'hydra':           { latitude: 36.7539, longitude: 3.0427 },
  'bab el oued':     { latitude: 36.7900, longitude: 3.0573 },
  'el biar':         { latitude: 36.7614, longitude: 3.0364 },
  'didouche mourad': { latitude: 36.7625, longitude: 3.0521 },
  'telemly':         { latitude: 36.7700, longitude: 3.0500 },
  'ben aknoun':      { latitude: 36.7611, longitude: 3.0157 },
  'bir mourad rais': { latitude: 36.7381, longitude: 3.0521 },
  'el harrach':      { latitude: 36.7197, longitude: 3.1350 },
  'cheraga':         { latitude: 36.7669, longitude: 2.9605 },
  'dely ibrahim':    { latitude: 36.7608, longitude: 2.9843 },
  'kouba':           { latitude: 36.7186, longitude: 3.0906 },
};

function scatter(id, axis) {
  return (((id * (axis === 0 ? 7919 : 6271)) % 1000) / 1000 - 0.5) * 0.005;
}

export function getCoordinate(r) {
  if (r.latitude && r.longitude) return { latitude: r.latitude, longitude: r.longitude };
  const key  = (r.quartier || '').toLowerCase();
  const base = QUARTIER_COORDS[key] || ALGER;
  const seed = typeof r.id === 'number' ? r.id : 0;
  return {
    latitude:  base.latitude  + scatter(seed, 1),
    longitude: base.longitude + scatter(seed, 0),
  };
}

export default function useMapScreen() {
  const [restaurants, setRestaurants] = useState([]);
  const [selected,    setSelected]    = useState(null);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase
          .from('restaurants')
          .select('id, name, cuisine_type, quartier, avg_rating, avg_ticket, latitude, longitude');
        if (data) setRestaurants(data);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { restaurants, loading, selected, setSelected };
}
