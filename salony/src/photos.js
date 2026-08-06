import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system';
import { supabase } from '../supabase';

// Envoie une image locale (URI ImagePicker) vers le bucket "photos" et
// retourne son URL publique, ou null en cas d'échec.
//
// Le fichier est rangé sous <user_id>/<dossier>/<timestamp>.<ext> : les RLS du
// bucket exigent que le premier segment du chemin soit l'id de l'utilisateur.
export async function uploadPhoto(uri, dossier = 'divers') {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const extension = (uri.split('.').pop() ?? 'jpg').toLowerCase().split('?')[0];
    const chemin = `${user.id}/${dossier}/${Date.now()}.${extension}`;

    const { error } = await supabase.storage
      .from('photos')
      .upload(chemin, decode(base64), {
        contentType: `image/${extension === 'jpg' ? 'jpeg' : extension}`,
        upsert: false,
      });

    if (error) return null;

    const { data } = supabase.storage.from('photos').getPublicUrl(chemin);
    return data.publicUrl;
  } catch {
    return null;
  }
}
