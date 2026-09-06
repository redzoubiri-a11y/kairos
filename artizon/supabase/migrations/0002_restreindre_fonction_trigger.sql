-- La fonction du trigger est SECURITY DEFINER et ne doit être invoquée que
-- par le trigger lui-même, jamais appelée directement via l'API REST
-- (/rest/v1/rpc/gerer_nouvel_artisan). Elle est déjà inappelable en dehors
-- d'un contexte de trigger (Postgres l'interdit pour une fonction
-- `returns trigger`), mais on retire aussi le droit d'exécution pour suivre
-- la recommandation de l'audit de sécurité Supabase.
revoke execute on function public.gerer_nouvel_artisan() from public, anon, authenticated;
