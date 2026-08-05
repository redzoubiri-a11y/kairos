-- ═══════════════════════════════════════════════════════════════════════════
-- Tasale — expédition des notifications
--
-- Jusqu'ici les notifications étaient écrites en base avec leur `sent_at`
-- (l'heure à laquelle elles *doivent* partir, après application des règles
-- §6.3 et §10.4), mais rien ne les expédiait ni ne notait qu'elles étaient
-- parties. Ce fichier ajoute le suivi de livraison et les jetons push.
-- ═══════════════════════════════════════════════════════════════════════════

-- `sent_at`     = heure d'envoi prévue (décidée par les règles métier)
-- `delivered_at` = heure d'envoi réelle, renseignée par le worker
alter table notifications
    add column if not exists delivered_at timestamptz,
    add column if not exists delivery_error text,
    add column if not exists attempts int not null default 0;

-- Index partiel : le worker ne balaie que la file réellement en attente.
create index if not exists idx_notifications_pending
    on notifications (sent_at)
    where delivered_at is null and sent_at is not null;

-- ── Jetons de notification push ───────────────────────────────────────────

create table if not exists push_tokens (
    user_id    uuid not null references users(id) on delete cascade,
    token      text primary key,
    platform   varchar(10),
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create index if not exists idx_push_tokens_user on push_tokens(user_id);

alter table push_tokens enable row level security;

-- `create policy` n'accepte pas `if not exists` : on retire d'abord, pour que
-- le fichier reste rejouable.
drop policy if exists push_tokens_own on push_tokens;
create policy push_tokens_own on push_tokens for all
    using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ── File d'attente ────────────────────────────────────────────────────────

/**
 * Notifications prêtes à partir : l'heure prévue est atteinte, rien n'a
 * encore été livré, et on n'a pas épuisé les tentatives.
 *
 * Les SMS dont `sent_at` est nul ont été écartés par le quota journalier
 * (§10.4) : ils restent en base pour l'historique mais ne partent jamais.
 */
create or replace function due_notifications(p_limit int default 100)
returns setof notifications
language sql
stable
security definer
set search_path = public
as $$
    select *
    from notifications
    where delivered_at is null
      and sent_at is not null
      and sent_at <= now()
      and attempts < 3
      and channel in ('sms', 'push')
    order by sent_at
    limit p_limit;
$$;

create or replace function mark_notification_delivered(p_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
    update notifications
       set delivered_at = now(), delivery_error = null, attempts = attempts + 1
     where id = p_id;
$$;

create or replace function mark_notification_failed(p_id uuid, p_error text)
returns void
language sql
security definer
set search_path = public
as $$
    update notifications
       set delivery_error = left(p_error, 500), attempts = attempts + 1
     where id = p_id;
$$;

/** Jetons push actifs d'un destinataire (un utilisateur peut avoir plusieurs appareils). */
create or replace function push_tokens_of(p_user uuid)
returns setof text
language sql
stable
security definer
set search_path = public
as $$
    select token from push_tokens where user_id = p_user;
$$;

-- Ces fonctions ne sont appelées que par le worker, avec la clé de service.
-- `anon` et `authenticated` sont propres à Supabase : sur une base nue, il
-- n'y a rien à révoquer.
do $$
begin
    if exists (select 1 from pg_roles where rolname = 'anon') then
        revoke execute on function due_notifications(int) from anon, authenticated;
        revoke execute on function mark_notification_delivered(uuid) from anon, authenticated;
        revoke execute on function mark_notification_failed(uuid, text) from anon, authenticated;
        revoke execute on function push_tokens_of(uuid) from anon, authenticated;
    else
        raise notice 'Rôles Supabase absents — révocations ignorées.';
    end if;
end $$;
