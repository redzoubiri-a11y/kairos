-- ═══════════════════════════════════════════════════════════════════════════
-- Tasale — cycle de vie automatique
--
-- Sans ces tâches, rien n'avance tout seul : une réservation passée reste
-- « confirmée », aucune demande d'avis ne part (§7.1), aucun rappel n'est
-- envoyé (§6.2) et les essais gratuits n'expirent jamais (§10.3).
--
-- Chaque fonction est idempotente : la relancer ne produit pas de doublon.
-- ═══════════════════════════════════════════════════════════════════════════

-- Une notification de ce type existe-t-elle déjà pour cette réservation ?
create or replace function notification_exists(p_user uuid, p_type text, p_reservation uuid)
returns boolean
language sql
stable
as $$
    select exists (
        select 1 from notifications
        where user_id = p_user
          and type = p_type
          and (data ->> 'reservation_id')::uuid = p_reservation
    );
$$;

-- ── 1. Clôture des événements passés ──────────────────────────────────────
-- Une réservation confirmée dont la date est passée devient « terminée ».
-- C'est ce statut qui ouvre le droit à l'avis vérifié (§7.4).

create or replace function close_past_reservations()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare v_count int;
begin
    with closed as (
        update reservations
           set status = 'completed', updated_at = now()
         where status = 'confirmed'
           and event_date < current_date
        returning 1
    )
    select count(*) into v_count from closed;

    return v_count;
end;
$$;

-- ── 2. Rappel la veille de l'événement (§6.2) ─────────────────────────────

create or replace function send_event_reminders()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare v_count int := 0; r record;
begin
    for r in
        select res.id, res.client_id, res.event_type, res.event_date, s.name as salle_name
        from reservations res
        join salles s on s.id = res.salle_id
        where res.status = 'confirmed'
          and res.event_date = current_date + 1
          and not notification_exists(res.client_id, 'reminder_24h', res.id)
    loop
        insert into notifications (user_id, type, title, body, data, channel, sent_at)
        values (
            r.client_id, 'reminder_24h', 'Votre événement, c''est demain',
            'Votre ' || r.event_type || ' à ' || r.salle_name || ' a lieu demain.',
            jsonb_build_object('reservation_id', r.id), 'push', now()
        );
        v_count := v_count + 1;
    end loop;

    return v_count;
end;
$$;

-- ── 3. Demande d'avis 48 h après l'événement (§7.1) ───────────────────────

create or replace function request_pending_reviews()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare v_count int := 0; r record;
begin
    for r in
        select res.id, res.client_id, res.event_type, s.name as salle_name
        from reservations res
        join salles s on s.id = res.salle_id
        where res.status = 'completed'
          and res.event_date <= current_date - 2      -- 48 h révolues
          and not exists (select 1 from reviews rev where rev.reservation_id = res.id)
          and not notification_exists(res.client_id, 'review_request', res.id)
    loop
        insert into notifications (user_id, type, title, body, data, channel, sent_at)
        values (
            r.client_id, 'review_request', 'Votre avis compte',
            'Votre ' || r.event_type || ' à ' || r.salle_name ||
            ' s''est bien passé ? Partagez votre avis.',
            jsonb_build_object('reservation_id', r.id), 'push', now()
        );
        v_count := v_count + 1;
    end loop;

    return v_count;
end;
$$;

-- ── 4. Essais gratuits : rappels puis expiration (§10.3) ──────────────────
-- Rappels à 7, 3 et 1 jour de la fin, puis passage en « expiré » si aucune
-- méthode de paiement n'a été configurée.

create or replace function process_trial_subscriptions()
returns table (reminded int, expired int)
language plpgsql
security definer
set search_path = public
as $$
declare v_reminded int := 0; v_expired int := 0; r record; v_days int;
begin
    for r in
        select sub.id, sub.pro_id, sub.trial_ends_at,
               sub.trial_ends_at - current_date as days_left
        from subscriptions sub
        where sub.status = 'trial'
          and sub.trial_ends_at - current_date in (7, 3, 1)
    loop
        v_days := r.days_left;

        -- Un seul rappel par échéance : le palier est inscrit dans `data`
        if not exists (
            select 1 from notifications
            where user_id = r.pro_id
              and type = 'subscription_reminder'
              and (data ->> 'days_left')::int = v_days
              and (data ->> 'subscription_id')::uuid = r.id
        ) then
            insert into notifications (user_id, type, title, body, data, channel, sent_at)
            values (
                r.pro_id, 'subscription_reminder', 'Fin de votre essai gratuit',
                'Il vous reste ' || v_days || ' jour(s) d''essai. ' ||
                'Configurez votre paiement pour rester visible.',
                jsonb_build_object('subscription_id', r.id, 'days_left', v_days),
                'push', now()
            );
            v_reminded := v_reminded + 1;
        end if;
    end loop;

    -- Expiration : sans moyen de paiement, la salle passe en non prioritaire
    with gone as (
        update subscriptions
           set status = 'expired'
         where status = 'trial'
           and trial_ends_at < current_date
           and payment_method is null
        returning 1
    )
    select count(*) into v_expired from gone;

    -- Avec un moyen de paiement configuré, l'abonnement démarre
    update subscriptions
       set status = 'active',
           current_period_start = current_date,
           current_period_end = current_date + 30
     where status = 'trial'
       and trial_ends_at < current_date
       and payment_method is not null;

    reminded := v_reminded;
    expired := v_expired;
    return next;
end;
$$;

-- ── Orchestration ─────────────────────────────────────────────────────────
-- Une seule fonction à planifier, dans l'ordre qui compte : il faut clore les
-- événements avant de pouvoir en demander l'avis.

create or replace function run_daily_maintenance()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare v_closed int; v_reminders int; v_reviews int; v_trials record;
begin
    v_closed := close_past_reservations();
    v_reminders := send_event_reminders();
    v_reviews := request_pending_reviews();
    select * into v_trials from process_trial_subscriptions();

    return jsonb_build_object(
        'closed', v_closed,
        'reminders', v_reminders,
        'review_requests', v_reviews,
        'trial_reminders', v_trials.reminded,
        'trials_expired', v_trials.expired,
        'ran_at', now()
    );
end;
$$;
