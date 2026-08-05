import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Vrai uniquement si les deux variables sont présentes et non factices.
 * Sinon l'application bascule sur le backend local de démonstration.
 */
export const hasSupabase = Boolean(
  url && anonKey && url.startsWith('http') && !url.includes('xxxxxxxxxxxx')
);

export const supabase = hasSupabase
  ? createClient(url, anonKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null;
