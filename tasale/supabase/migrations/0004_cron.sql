-- ═══════════════════════════════════════════════════════════════════════════
-- Tasale — planification quotidienne
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
