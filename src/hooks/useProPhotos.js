import { useState, useCallback, useEffect } from 'react';
import { Linking, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../supabase';

export default function useProPhotos(restaurantId) {
  const [photos,    setPhotos]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error,     setError]     = useState('');

  const fetchPhotos = useCallback(async () => {
    if (!restaurantId) return;
    setLoading(true);
    const { data } = await supabase
      .from('restaurants')
      .select('photos')
      .eq('id', restaurantId)
      .single();
    setPhotos(data?.photos || []);
    setLoading(false);
  }, [restaurantId]);

  useEffect(() => { fetchPhotos(); }, [fetchPhotos]);

  const addPhoto = useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        'Accès photos refusé',
        'Autorisez l\'accès aux photos dans Réglages > Expo Go > Photos.',
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Ouvrir Réglages', onPress: () => Linking.openSettings() },
        ],
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.5,
      allowsEditing: true,
      aspect: [4, 3],
    });
    if (result.canceled) return;

    setUploading(true);
    setError('');
    try {
      const uri  = result.assets[0].uri;
      const path = `${restaurantId}/${Date.now()}.jpg`;

      const response = await fetch(uri);
      const blob     = await response.blob();

      if (blob.size > 3 * 1024 * 1024) {
        setError('Photo trop lourde (max 3 Mo). Choisissez une image plus petite.');
        return;
      }

      const { error: upErr } = await supabase.storage
        .from('restaurant-photos')
        .upload(path, blob, { contentType: 'image/jpeg', upsert: false });
      if (upErr) { setError(upErr.message); return; }

      const { data: { publicUrl } } = supabase.storage
        .from('restaurant-photos')
        .getPublicUrl(path);

      const newPhotos = [...photos, publicUrl];
      await supabase.from('restaurants').update({ photos: newPhotos }).eq('id', restaurantId);
      setPhotos(newPhotos);
    } catch (e) {
      setError('Erreur lors de l\'upload');
    } finally {
      setUploading(false);
    }
  }, [restaurantId, photos]);

  const removePhoto = useCallback(async (url) => {
    const path = url.split('/restaurant-photos/')[1];
    if (!path) return;
    await supabase.storage.from('restaurant-photos').remove([path]);
    const newPhotos = photos.filter(p => p !== url);
    await supabase.from('restaurants').update({ photos: newPhotos }).eq('id', restaurantId);
    setPhotos(newPhotos);
  }, [restaurantId, photos]);

  return { photos, loading, uploading, error, addPhoto, removePhoto };
}
