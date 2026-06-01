import { useState, useEffect, useMemo, useCallback } from 'react';
import { Alert } from 'react-native';
import * as Location from 'expo-location';
import { supabase } from '../../supabase';

export const CITIES = [
  { id:'alger',       label:'Alger',       emoji:'🏛️', region:{ latitude:36.7538, longitude:3.0588,  latitudeDelta:0.13, longitudeDelta:0.13 } },
  { id:'oran',        label:'Oran',        emoji:'🌊', region:{ latitude:35.6969, longitude:-0.6331, latitudeDelta:0.13, longitudeDelta:0.13 } },
  { id:'constantine', label:'Constantine', emoji:'🌉', region:{ latitude:36.3650, longitude:6.6147,  latitudeDelta:0.13, longitudeDelta:0.13 } },
  { id:'tizi_ouzou',  label:'Tizi Ouzou',  emoji:'⛰️', region:{ latitude:36.7117, longitude:4.0450,  latitudeDelta:0.13, longitudeDelta:0.13 } },
  { id:'bejaia',      label:'Béjaïa',      emoji:'🌅', region:{ latitude:36.7509, longitude:5.0564,  latitudeDelta:0.13, longitudeDelta:0.13 } },
  { id:'setif',       label:'Sétif',       emoji:'🌾', region:{ latitude:36.1898, longitude:5.4108,  latitudeDelta:0.13, longitudeDelta:0.13 } },
  { id:'annaba',      label:'Annaba',      emoji:'🌺', region:{ latitude:36.9000, longitude:7.7667,  latitudeDelta:0.13, longitudeDelta:0.13 } },
  { id:'tlemcen',     label:'Tlemcen',     emoji:'🕌', region:{ latitude:34.8828, longitude:-1.3167, latitudeDelta:0.13, longitudeDelta:0.13 } },
];

export const CUISINE_EMOJI = {
  algerien:'🥘', mediterraneen:'🐟', fast_casual:'☕',
  italien:'🍕', japonais:'🍣', turc:'🍢', libanais:'🌿', francais:'🍷',
  thai:'🍜', indien:'🍛', jordanien:'🧆', marocain:'🥙', egyptien:'🫓',
  autre:'🍽️',
};

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

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function getCoord(r, cityDefault) {
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

export default function useExplorer(initialCity = 'alger') {
  const [city,         setCity]         = useState(initialCity);
  const [mode,         setMode]         = useState('map');
  const [restaurants,  setRestaurants]  = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [selected,     setSelected]     = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [nearMe,       setNearMe]       = useState(false);
  const [locLoading,   setLocLoading]   = useState(false);

  const cityData = useMemo(() => CITIES.find(c => c.id === city) || CITIES[0], [city]);
  const cityDefault = useMemo(
    () => ({ latitude: cityData.region.latitude, longitude: cityData.region.longitude }),
    [cityData],
  );

  useEffect(() => {
    (async () => {
      setLoading(true);
      setSelected(null);
      try {
        const query = supabase
          .from('restaurants')
          .select('id, name, cuisine_type, address, quartier, city, photos, avg_rating, avg_ticket, review_count, capacity')
          .eq('status', 'active')
          .order('avg_rating', { ascending: false });

        if (!nearMe) query.eq('city', city);

        const { data } = await query;
        setRestaurants(data ?? []);
      } finally {
        setLoading(false);
      }
    })();
  }, [city, nearMe]);

  const sortedRestaurants = useMemo(() => {
    if (!nearMe || !userLocation) return restaurants;
    return [...restaurants].sort((a, b) => {
      const ca = getCoord(a, cityDefault);
      const cb = getCoord(b, cityDefault);
      const da = haversineKm(userLocation.latitude, userLocation.longitude, ca.latitude, ca.longitude);
      const db = haversineKm(userLocation.latitude, userLocation.longitude, cb.latitude, cb.longitude);
      return da - db;
    });
  }, [restaurants, nearMe, userLocation, cityDefault]);

  const requestNearMe = useCallback(async () => {
    setLocLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Localisation refusée',
          'Activez la localisation dans les Réglages pour voir les restaurants près de vous.',
        );
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setUserLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      setNearMe(true);
    } catch (_) {
      Alert.alert('Erreur', 'Impossible de récupérer votre position.');
    } finally {
      setLocLoading(false);
    }
  }, []);

  const selectCity = useCallback((c) => {
    setCity(c);
    setNearMe(false);
    setUserLocation(null);
  }, []);

  return {
    city, setCity: selectCity, mode, setMode,
    restaurants: sortedRestaurants,
    loading, selected, setSelected,
    cityData, cityDefault,
    userLocation, nearMe, locLoading, requestNearMe,
  };
}
