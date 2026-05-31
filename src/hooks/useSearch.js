import { useState, useEffect, useRef, useCallback } from 'react';
import { Keyboard } from 'react-native';
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

export default function useSearch() {
  const inputRef = useRef(null);
  const [query,    setQuery]    = useState('');
  const [city,     setCity]     = useState('all');
  const [results,  setResults]  = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 150);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (!q) { setResults([]); setSearched(false); return; }

    const timer = setTimeout(async () => {
      setLoading(true);
      setSearched(true);
      try {
        let req = supabase
          .from('restaurants')
          .select('id, name, cuisine_type, quartier, city, avg_rating, avg_ticket, photos')
          .eq('status', 'active')
          .or(`name.ilike.%${q}%,cuisine_type.ilike.%${q}%,quartier.ilike.%${q}%`)
          .limit(25);

        if (city !== 'all') req = req.eq('city', city);

        const { data } = await req;
        setResults(data ?? []);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, city]);

  const searchSuggestion = useCallback((q) => {
    setQuery(q);
    Keyboard.dismiss();
  }, []);

  const clearQuery = useCallback(() => {
    setQuery('');
    setResults([]);
    setSearched(false);
    inputRef.current?.focus();
  }, []);

  return {
    inputRef,
    query, setQuery,
    city, setCity,
    results, loading, searched,
    searchSuggestion, clearQuery,
  };
}
