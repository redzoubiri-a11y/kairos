-- ═══════════════════════════════════════════════════════════════════════════
-- Tasalle — planification quotidienne
--
-- `pg_cron` doit d'abord être activé dans le tableau de bord Supabase
-- (Database → Extensions). Le bloc ci-dessous ne fait rien si l'extension
-- est absente, pour que la migration reste rejouable sur une base nue.
--
-- Horaire : 08 h UTC, soit 09 h à Alger (UTC+1). Volontairement après la
-- fenêtre de silence 22 h – 08 h du §10.4, pour que les notifications créées
-- puissent partir dans la foulée.
-- ═══════════════════════════════════════════════════════════════════════════

do $$
begin
    if not exists (select 1 from pg_available_extensions where name = 'pg_cron') then
        raise notice 'pg_cron indisponible — planification ignorée. '
                     'Activez l''extension puis rejouez ce fichier.';
        return;
    end if;

    create extension if not exists pg_cron;

    -- Remplace la tâche si elle existe déjà : le fichier reste rejouable
    perform cron.unschedule('tasale-maintenance-quotidienne')
    where exists (
        select 1 from cron.job where jobname = 'tasale-maintenance-quotidienne'
    );

    perform cron.schedule(
        'tasale-maintenance-quotidienne',
        '0 8 * * *',
        $cron$ select run_daily_maintenance(); $cron$
    );

    raise notice 'Maintenance quotidienne planifiée à 08 h UTC.';
end $$;

-- ── Expédition des notifications, toutes les 5 minutes ────────────────────
--
-- Appelle la fonction Edge `dispatch-notifications`, qui vide la file des
-- messages arrivés à échéance. L'URL et la clé de service ne sont pas
-- écrites ici : elles se déclarent une fois pour toutes avec
--
--   alter database postgres set app.settings.dispatch_url =
--       'https://<ref>.supabase.co/functions/v1/dispatch-notifications';
--   alter database postgres set app.settings.service_key = '<clé service_role>';
--
-- Tant qu'elles manquent, la tâche n'est pas planifiée.

do $$
declare v_url text; v_key text;
begin
    if not exists (select 1 from pg_available_extensions where name = 'pg_cron')
       or not exists (select 1 from pg_available_extensions where name = 'pg_net') then
        raise notice 'pg_cron ou pg_net indisponible — expédition non planifiée.';
        return;
    end if;

    v_url := current_setting('app.settings.dispatch_url', true);
    v_key := current_setting('app.settings.service_key', true);

    if v_url is null or v_key is null then
        raise notice 'app.settings.dispatch_url / service_key non définis — '
                     'expédition non planifiée.';
        return;
    end if;

    create extension if not exists pg_net;

    perform cron.unschedule('tasale-expedition-notifications')
    where exists (
        select 1 from cron.job where jobname = 'tasale-expedition-notifications'
    );

    perform cron.schedule(
        'tasale-expedition-notifications',
        '*/5 * * * *',
        format(
            $cron$ select net.http_post(
                url := %L,
                headers := jsonb_build_object(
                    'Content-Type', 'application/json',
                    'Authorization', 'Bearer ' || %L
                )
            ); $cron$,
            v_url, v_key
        )
    );

    raise notice 'Expédition des notifications planifiée toutes les 5 minutes.';
end $$;
