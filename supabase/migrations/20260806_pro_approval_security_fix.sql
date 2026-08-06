-- ============================================================
-- Fix sécurité — approve-pro / reject-pro non authentifiés
-- 2026-08-06
-- ============================================================
-- Les liens d'approbation/refus n'étaient protégés que par
-- pro_requests.id, connu du demandeur lui-même : useProInscription
-- le récupère depuis son propre insert. N'importe quel utilisateur
-- pouvait donc appeler approve-pro sur sa propre demande et
-- s'auto-promouvoir manager.
--
-- Un jeton distinct, généré côté serveur et jamais transmis au
-- client (seulement inséré par le service_role puis envoyé par
-- email à l'admin), est désormais requis en plus de l'id.
-- ============================================================

CREATE TABLE IF NOT EXISTS pro_request_admin_tokens (
  request_id UUID PRIMARY KEY REFERENCES pro_requests(id) ON DELETE CASCADE,
  token      TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE pro_request_admin_tokens ENABLE ROW LEVEL SECURITY;
-- Aucune policy : seul service_role (edge functions) peut lire/écrire cette table,
-- via le bypass RLS du service_role. anon/authenticated n'y ont aucun accès.
