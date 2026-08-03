-- ============================================================
-- notification_logs — historique d'envoi des rappels (WhatsApp/push)
-- 2026-08-03
--
-- Référencée par supabase/functions/send-reminders/index.ts depuis
-- le début, mais jamais créée en prod (la migration
-- add_reminder_fields.sql qui la définissait n'a jamais été
-- appliquée) → les insert() échouaient silencieusement, aucun
-- historique d'envoi disponible.
-- ============================================================

CREATE TABLE IF NOT EXISTS notification_logs (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID        REFERENCES reservations(id) ON DELETE CASCADE,
  channel        TEXT        NOT NULL CHECK (channel IN ('whatsapp', 'push')),
  status         TEXT        NOT NULL CHECK (status IN ('sent', 'failed')),
  error_message  TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notification_logs_reservation ON notification_logs(reservation_id);
CREATE INDEX idx_notification_logs_channel     ON notification_logs(reservation_id, channel);

-- ------------------------------------------------------------
-- RLS — même politique que reservation_modifications :
-- écriture uniquement via service_role (Edge Function),
-- lecture réservée au propriétaire du restaurant concerné.
-- ------------------------------------------------------------

ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY nl_owner_select ON notification_logs
  FOR SELECT USING (
    reservation_id IN (
      SELECT res.id FROM reservations res
      JOIN restaurants r    ON r.id = res.restaurant_id
      JOIN restaurant_owners o ON o.restaurant_id = r.id
      WHERE o.auth_id = auth.uid()
    )
  );
