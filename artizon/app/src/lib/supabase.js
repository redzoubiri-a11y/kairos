import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Projet Supabase dédié à Artizon (organisation redzoubiri-a11y, séparé du
// projet Mida/Kairos et du projet "fennec"). La clé publiable ci-dessous est
// faite pour vivre dans le client — la sécurité vient des politiques RLS
// posées sur chaque table, pas du secret de cette clé.
const supabaseUrl = 'https://qyhxyldbxifcyxyadfgv.supabase.co';
const supabasePublishableKey = 'sb_publishable_2oCcmPrpAqmZz2qVMLtpbg_oLC1p9Bo';

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
