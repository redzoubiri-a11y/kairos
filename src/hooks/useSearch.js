import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Keyboard, Alert } from 'react-native';
import * as Location from 'expo-location';
import { supabase } from '../../supabase';

export const CITIES = [
  { id: 'all',         label: 'Toutes' },
  { id: 'alger',       label: 'Alger' },
  { id: 'oran',        label: 'Oran' },
  { id: 'constantine', label: 'Constantine' },
  { id: 'tizi_ouzou',  label: 'Tizi Ouzou' },
  { id: 'bejaia',      label: 'Béjaïa' },
  { id: 'setif',       label: 'Sétif' },
  { id: 'annaba',      label: 'Annaba' },
  { id: 'tlemcen',     label: 'Tlemcen' },
];

export const SUGGESTIONS = [
  { label: 'Couscous',      q: 'algerien',      emoji: '🥘' },
  { label: 'Pizzeria',      q: 'italien',       emoji: '🍕' },
  { label: 'Fruits de mer', q: 'mediterraneen', emoji: '🐟' },
  { label: 'Japonais',      q: 'japonais',      emoji: '🍣' },
  { label: 'Turc',          q: 'turc',          emoji: '🍢' },
  { label: 'Libanais',      q: 'libanais',      emoji: '🌿' },
];

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function useSearch({ initialQuery = '', initialCity = 'alger' } = {}) {
  const inputRef = useRef(null);
  const [query,        setQuery]       = useState(initialQuery);
  const [quartier,     setQuartier]    = useState('');
  const [city,         setCity]        = useState(initialCity);
  const [results,      setResults]     = useState([]);
  const [loading,      setLoading]     = useState(!!initialQuery);
  const [searched,     setSearched]    = useState(!!initialQuery);
  const [userLocation, setUserLocation] = useState(null);
  const [nearMe,       setNearMe]      = useState(false);
  const [locLoading,   setLocLoading]  = useState(false);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 150);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const q = query.trim();
    const qr = quartier.trim();
    if (!q && !qr) { setResults([]); setSearched(false); return; }

    const timer = setTimeout(async () => {
      setLoading(true);
      setSearched(true);
      try {
        let req = supabase
          .from('restaurants')
          .select('id, name, cuisine_type, quartier, city, avg_rating, avg_ticket, photos, latitude, longitude, opening_hours, phone, capacity, address')
          .eq('status', 'active')
          .limit(25);

        if (q) req = req.ilike('name', `%${q}%`);
        if (qr) req = req.ilike('quartier', `%${qr}%`);
        if (!nearMe && city !== 'all') req = req.eq('city', city);

        const { data } = await req;
        setResults(data ?? []);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, quartier, city, nearMe]);

  const sortedResults = useMemo(() => {
    if (!nearMe || !userLocation) return results;
    return [...results].sort((a, b) => {
      const da = (a.latitude && a.longitude)
        ? haversineKm(userLocation.latitude, userLocation.longitude, a.latitude, a.longitude)
        : Infinity;
      const db = (b.latitude && b.longitude)
        ? haversineKm(userLocation.latitude, userLocation.longitude, b.latitude, b.longitude)
        : Infinity;
      return da - db;
    });
  }, [results, nearMe, userLocation]);

  const requestNearMe = useCallback(async () => {
    if (nearMe) { setNearMe(false); setUserLocation(null); return; }
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
  }, [nearMe]);

  const selectCity = useCallback((c) => {
    setCity(c);
    setNearMe(false);
    setUserLocation(null);
  }, []);

  const searchSuggestion = useCallback((q) => {
    setQuery(q);
    Keyboard.dismiss();
  }, []);

  const clearQuery = useCallback(() => {
    setQuery('');
    setQuartier('');
    setResults([]);
    setSearched(false);
    inputRef.current?.focus();
  }, []);

  return {
    inputRef,
    query, setQuery,
    quartier, setQuartier,
    city, setCity: selectCity,
    results: sortedResults, loading, searched,
    nearMe, locLoading, requestNearMe,
    searchSuggestion, clearQuery,
  };
}
