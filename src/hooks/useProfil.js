import { useState, useEffect, useCallback, useMemo } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../supabase';
import { colors } from '../theme';

export const STATUS = {
  confirmed: { label:'Confirmée',  color: colors.green   },
  pending:   { label:'En attente', color: colors.statusPendingText },
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

export const SITUATIONS = ['🌙 Dîner calme','👪 En famille','💼 Affaires'];
export const CUISINES   = ['🥘 Algérien','🐟 Méditerranéen','🍷 Français','🍕 Italien'];

export function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', { weekday:'short', day:'numeric', month:'short' });
}

export default function useProfil() {
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
  const [reservationsCount, setReservationsCount] = useState(0);
  const [favoritesCount,    setFavoritesCount]    = useState(0);
  const [reviewsCount,      setReviewsCount]      = useState(0);
  const [activeSits,     setActiveSits]     = useState([]);
  const [activeCuisines, setActiveCuisines] = useState([]);
  const [isManager,      setIsManager]      = useState(false);
  const [isAdmin,        setIsAdmin]        = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const u = data?.user;
      if (!u) return;
      setAuthId(u.id);
      setUserEmail(u.email || '');
      const role = u.app_metadata?.role || u.user_metadata?.role;
      setIsManager(role === 'manager' || role === 'admin');
      setIsAdmin(role === 'admin');
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
    (async () => {
      const [{ count: resaCount }, { count: favCount }, { count: revCount }] = await Promise.all([
        supabase.from('reservations').select('id', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('favorites').select('id', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('reviews').select('id', { count: 'exact', head: true }).eq('user_id', userId),
      ]);
      setReservationsCount(resaCount ?? 0);
      setFavoritesCount(favCount ?? 0);
      setReviewsCount(revCount ?? 0);
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

  const toggleEditing = useCallback(() => setEditingName(v => !v), []);

  return {
    userEmail, firstName, setFirstName, lastName, setLastName,
    city, phone, setPhone, memberSince, avatarUri, uploading,
    editingName, savingName,
    reservationsCount, favoritesCount, reviewsCount,
    activeSits, setActiveSits, activeCuisines, setActiveCuisines,
    isManager, isAdmin,
    displayName, initial,
    pickAvatar, saveName, signOut, deleteAccount, toggleEditing,
  };
}
