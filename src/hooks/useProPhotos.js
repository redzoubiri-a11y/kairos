import { useState, useCallback, useEffect } from 'react';
import { Linking, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { supabase } from '../../supabase';

// Le picker compresse (quality) mais ne redimensionne jamais : une photo de
// 12 Mpx reste lourde meme a qualite reduite. On la ramene a 1600 px de large
// avant l'envoi — invisible sur une fiche restaurant, et decisif sur une
// connexion algerienne. Sans ca, une photo trop lourde etait simplement
// refusee, et le restaurateur n'avait aucun moyen de la reduire lui-meme.
const LARGEUR_MAX = 1600;
const QUALITE = 0.7;

async function alleger(asset) {
  // On ne redimensionne QUE vers le bas. `resize: { width: 1600 }` agrandit
  // une image plus petite : le recadrage 4:3 du picker sort souvent en
  // 1152 px, qui serait gonflee a 1600 — plus lourde et plus floue pour rien.
  const actions = asset.width > LARGEUR_MAX ? [{ resize: { width: LARGEUR_MAX } }] : [];

  // Avec un tableau d'actions vide, l'image est seulement recompressee en
  // JPEG : format normalise et metadonnees EXIF supprimees au passage.
  const { uri } = await ImageManipulator.manipulateAsync(asset.uri, actions, {
    compress: QUALITE,
    format: ImageManipulator.SaveFormat.JPEG,
  });
  return uri;
}

export default function useProPhotos(restaurantId) {
  const [photos,    setPhotos]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error,     setError]     = useState('');

  const fetchPhotos = useCallback(async () => {
    if (!restaurantId) { setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from('restaurants')
      .select('photos')
      .eq('id', restaurantId)
      .maybeSingle();
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
      // On compresse nous-memes juste apres : compresser deja ici degraderait
      // l'image deux fois. On garde tout de meme une marge pour ne pas charger
      // un original plein format en memoire sur un vieux telephone.
      quality: 0.8,
      allowsEditing: true,
      aspect: [4, 3],
    });
    if (result.canceled) return;

    setUploading(true);
    setError('');
    try {
      const path = `${restaurantId}/${Date.now()}.jpg`;

      // Si l'allegement echoue (format exotique, memoire), on tente quand
      // meme l'envoi de l'original plutot que de bloquer le restaurateur.
      const asset = result.assets[0];
      let uri = asset.uri;
      try {
        uri = await alleger(asset);
      } catch (e) {
        console.warn('[photos] redimensionnement impossible, envoi de l\'original', e);
      }

      const response    = await fetch(uri);
      const arrayBuffer = await response.arrayBuffer();

      // Garde-fou : la limite du bucket est de 3 Mo. Apres redimensionnement
      // on en est tres loin, donc y arriver signale une image inhabituelle.
      if (arrayBuffer.byteLength > 3 * 1024 * 1024) {
        setError('Cette image est trop lourde même après réduction. Essayez-en une autre.');
        return;
      }

      const { error: upErr } = await supabase.storage
        .from('restaurant-photos')
        .upload(path, arrayBuffer, { contentType: 'image/jpeg', upsert: false });
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
