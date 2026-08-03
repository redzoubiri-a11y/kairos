-- ============================================================
-- Fix T5 — colonnes J-1 manquantes + crons cassés
-- 2026-08-03
--
-- Constats :
--   1. reminder_whatsapp_sent / reminder_push_sent (mode J-1) n'ont
--      jamais été créées sur reservations (seules les colonnes _h2_
--      existent) → send-reminders en mode j1 plante sur le .or(...).
--   2. Le cron J-1 déclaré dans config.toml n'a jamais été appliqué
--      en base (absent de cron.job).
--   3. Le cron H-2 existant échoue à chaque exécution depuis son
--      déploiement : ERROR "unrecognized configuration parameter
--      app.supabase_url" (jamais défini via ALTER DATABASE ... SET).
--      Le job auto-approve-pro, lui, fonctionne (200 en continu)
--      avec une URL en dur et sans header Authorization
--      (send-reminders a verify_jwt = false comme auto-approve-pro).
-- ============================================================

-- 1. Colonnes manquantes (mode J-1)
ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS reminder_whatsapp_sent BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS reminder_push_sent     BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Réparer le cron H-2 (supprime la version cassée, recrée avec URL en dur)
SELECT cron.unschedule('send-h2-reminders');

SELECT cron.schedule(
  'send-h2-reminders',
  '*/30 * * * *',
  $$
    SELECT net.http_post(
      url     := 'https://rghjgyzpdadapmktislv.supabase.co/functions/v1/send-reminders',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body    := '{"mode":"h2"}'::jsonb
    );
  $$
);

-- 3. Planifier le cron J-1 (jamais appliqué jusqu'ici malgré config.toml)
SELECT cron.schedule(
  'send-reminders-daily',
  '0 17 * * *',
  $$
    SELECT net.http_post(
      url     := 'https://rghjgyzpdadapmktislv.supabase.co/functions/v1/send-reminders',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body    := '{"mode":"j1"}'::jsonb
    );
  $$
);
