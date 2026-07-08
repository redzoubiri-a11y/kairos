-- ============================================================
-- Migration T5b — Rappels H-2 : colonnes + nouveau cron
-- 2026-07-08
-- ============================================================

-- Nouvelles colonnes sur reservations (symétrique aux colonnes J-1 existantes)
ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS reminder_h2_whatsapp_sent BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS reminder_h2_push_sent     BOOLEAN NOT NULL DEFAULT FALSE;

-- Nouveau cron : toutes les 30 min, appelle send-reminders avec mode=h2
-- (Le cron J-1 existant envoie '{}' → mode par défaut = 'j1', rien à changer)
SELECT cron.schedule(
  'send-h2-reminders',
  '*/30 * * * *',
  $$
    SELECT net.http_post(
      url     := current_setting('app.supabase_url') || '/functions/v1/send-reminders',
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key')
      ),
      body    := '{"mode":"h2"}'::jsonb
    );
  $$
);
