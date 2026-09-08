/**
 * Client du projet Supabase « studio » — le seul que le moteur écrit.
 *
 * La clé service_role contourne RLS, ce qui est voulu : les tables du studio
 * sont fermées (0004_storage_rls.sql), et rien d'autre que ce moteur ne s'y
 * connecte. Elle ne doit jamais atteindre un navigateur.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { studioSupabase } from './config.ts';

let client: SupabaseClient | null = null;

export function studioDb(): SupabaseClient {
  if (client) return client;
  const { url, serviceRoleKey } = studioSupabase();
  client = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}

export const BUCKET_VISUALS = 'campaign-visuals';
export const BUCKET_TEXTS = 'campaign-texts';
