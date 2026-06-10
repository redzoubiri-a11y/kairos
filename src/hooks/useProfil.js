import { useState, useEffect, useCallback, useMemo } from 'react';
import { Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../supabase';
import { colors } from '../theme';

export const STATUS = {
  confirmed: { label:'Confirmée',  color: colors.green   },
  pending:   { label:'En attente', color: colors.accent  },
  cancelled: { label:'Annulée',    color: colors.red     },
  arrived:   { label:'Arrivé',     color: colors.blue    },
  no_show:   { label:'No-show',    color: colors.textDim },
  completed: { label:'Terminée',   color: colors.textDim },
};

export const CUISINE_EMOJI = {
  algerien:'🥘', mediterraneen:'🐟', fast_casual:'☕',
  italien:'🍕', japonais:'🍣', turc:'🍢', libanais:'🌿', francais:'🍷',
  thai:'🍜', indien:'🍛', jordanien:'🧆', marocain:'🥙', egyptien:'🫓',
  autre:'🍽️',
};

export const CARD_BG = ['#1a2e1a','#1a1e2e','#2e2a1a','#2a1a2e','#1a2a2e','#2e1a1a'];

export const SITUATIONS = ['🌙 Dîner calme','👪 En famille','⚡ Déjeuner rapide','🌿 Terrasse','💼 Affaires','🎉 Occasion spéciale'];
export const CUISINES   = ['🥘 Algérien','🐟 Méditerranéen','🍕 Italien','🍣 Japonais','🍢 Turc','🌿 Libanais','🍷 Français','🍜 Thaïlandais','🍛 Indien','🧆 Jordanien','🥙 Marocain','🫓 Égyptien'];

export function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', { weekday:'short', day:'numeric', month:'short' });
}

function todayStr() { return new Date().toISOString().split('T')[0]; }

export default function useProfil() {
  const [tab,            setTab]            = useState('profil');
  const [authId,         setAuthId]         = useState(null);
  const [userId,         setUserId]         = useState(null);
  const [userEmail,      setUserEmail]      = useState('');
  const [firstName,      setFirstName]      = useState('');
  const [lastName,       setLastName]       = useState('');
  const [city,           setCity]           = useState('');
  const [phone,          setPhone]          = useState('');
  const [memberSince,    setMemberSince]    = useState('');
  const [avatarUri,      setAvatarUri]      = useState(null);
  const [uploading,      setUploading]      = useState(false);
  const [editingName,    setEditingName]    = useState(false);
  const [savingName,     setSavingName]     = useState(false);
  const [reservations,   setReservations]   = useState([]);
  const [resaLoading,    setResaLoading]    = useState(false);
  const [favorites,      setFavorites]      = useState([]);
  const [favLoading,     setFavLoading]     = useState(false);
  const [cancelling,     setCancelling]     = useState(new Set());
  const [activeSits,     setActiveSits]     = useState([]);
  const [activeCuisines, setActiveCuisines] = useState([]);
  const [removing,       setRemoving]       = useState(new Set());

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const u = data?.user;
      if (!u) return;
      setAuthId(u.id);
      setUserEmail(u.email || '');
      if (u.created_at) setMemberSince(
        new Date(u.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
      );
      const { data: row } = await supabase.from('users')
        .select('id, avatar_url, first_name, last_name, city, phone')
        .eq('auth_id', u.id).maybeSingle();
      if (!row) return;
      setUserId(row.id);
      setAvatarUri(row.avatar_url ? `${row.avatar_url}?v=${Date.now()}` : null);
      setFirstName(row.first_name ?? '');
      setLastName(row.last_name  ?? '');
      setCity(row.city ?? '');
      setPhone(row.phone ?? '');
    })();
  }, []);

  useFocusEffect(useCallback(() => {
    if (!userId) return;
    setResaLoading(true);
    setFavLoading(true);
    (async () => {
      try {
        const [{ data: resas }, { data: favs }] = await Promise.all([
          supabase.from('reservations')
            .select('*, restaurants(id, name, cuisine_type, quartier)')
            .eq('user_id', userId).order('date', { ascending: false }).limit(30),
          supabase.from('favorites')
            .select('id, restaurant_id, restaurants(id, name, cuisine_type, quartier, avg_rating, avg_ticket, photos)')
            .eq('user_id', userId).order('created_at', { ascending: false }),
        ]);
        setReservations(resas ?? []);
        setFavorites(favs ?? []);
      } finally {
        setResaLoading(false);
        setFavLoading(false);
      }
    })();
  }, [userId]));

  const pickAvatar = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true, aspect: [1, 1], quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset    = result.assets[0];
    const mimeType = asset.mimeType || 'image/jpeg';
    const ext      = mimeType === 'image/png' ? 'png' : 'jpeg';
    const path     = `${authId}/avatar.${ext}`;
    setUploading(true);
    try {
      const response = await fetch(asset.uri);
      const arrayBuffer = await response.arrayBuffer();
      await supabase.storage.from('avatars').upload(path, arrayBuffer, { upsert: true, contentType: mimeType });
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
      await supabase.from('users').update({ avatar_url: urlData.publicUrl }).eq('auth_id', authId);
      setAvatarUri(`${urlData.publicUrl}?v=${Date.now()}`);
    } catch (e) {
      console.error(e);
    } finally {
      setUploading(false);
    }
  }, [authId]);

  const saveName = useCallback(async () => {
    setSavingName(true);
    try {
      await supabase.from('users')
        .update({ first_name: firstName.trim(), last_name: lastName.trim(), phone: phone.trim() })
        .eq('id', userId);
      setEditingName(false);
    } finally {
      setSavingName(false);
    }
  }, [firstName, lastName, phone, userId]);

  const cancelResa = useCallback((id, restoName) => {
    Alert.alert('Annuler la réservation', `Confirmer l'annulation chez ${restoName} ?`, [
      { text: 'Retour', style: 'cancel' },
      {
        text: 'Annuler', style: 'destructive',
        onPress: async () => {
          setCancelling(p => new Set(p).add(id));
          await supabase.from('reservations')
            .update({ status: 'cancelled', cancelled_at: new Date().toISOString() }).eq('id', id);
          setReservations(p => p.map(r => r.id === id ? { ...r, status: 'cancelled' } : r));
          setCancelling(p => { const next = new Set(p); next.delete(id); return next; });
        },
      },
    ]);
  }, []);

  const removeFav = useCallback(async (favId) => {
    setRemoving(p => new Set(p).add(favId));
    await supabase.from('favorites').delete().eq('id', favId);
    setFavorites(p => p.filter(f => f.id !== favId));
    setRemoving(p => { const next = new Set(p); next.delete(favId); return next; });
  }, []);

  const signOut = useCallback(() => supabase.auth.signOut(), []);

  const deleteAccount = useCallback(async () => {
    await supabase.rpc('delete_my_account');
    await supabase.auth.signOut();
  }, []);

  const displayName = useMemo(
    () => [firstName, lastName].filter(Boolean).join(' ') || userEmail.split('@')[0] || 'Mon profil',
    [firstName, lastName, userEmail],
  );
  const initial = useMemo(() => displayName[0]?.toUpperCase() || '?', [displayName]);
  const today   = useMemo(() => todayStr(), []);

  const upcoming = useMemo(
    () => reservations.filter(r => r.date >= today && ['confirmed', 'pending'].includes(r.status)),
    [reservations, today],
  );
  const history = useMemo(() => {
    const ids = new Set(upcoming.map(r => r.id));
    return reservations.filter(r => !ids.has(r.id));
  }, [reservations, upcoming]);
  const pendingCount = useMemo(
    () => reservations.filter(r => r.status === 'pending').length,
    [reservations],
  );

  const toggleEditing = useCallback(() => setEditingName(v => !v), []);

  return {
    tab, setTab,
    userEmail, firstName, setFirstName, lastName, setLastName,
    city, phone, setPhone, memberSince, avatarUri, uploading,
    editingName, savingName,
    reservations, resaLoading, favorites, favLoading,
    cancelling, activeSits, setActiveSits, activeCuisines, setActiveCuisines,
    removing,
    displayName, initial, upcoming, history, pendingCount,
    pickAvatar, saveName, cancelResa, removeFav, signOut, deleteAccount, toggleEditing,
  };
}
