-- ═══════════════════════════════════════════════════════════════════════════
-- Tasalle — schéma initial
-- Correspond aux spécifications §8 (modèle de données), §8.2 (index),
-- §9 (endpoints, ici exposés en RPC) et §10 (règles métier, appliquées en base).
--
-- Les règles sensibles (unicité du jour confirmé, signature PIN, délai d'avis)
-- sont implémentées côté serveur : un client compromis ne peut pas les
-- contourner, contrairement à une validation faite uniquement dans l'app.
-- ═══════════════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto;

-- ── Types énumérés (§8.1) ─────────────────────────────────────────────────

create type user_role          as enum ('client', 'pro', 'admin');
create type user_language      as enum ('fr', 'ar');
create type salle_status       as enum ('active', 'inactive', 'pending');
create type event_type         as enum ('mariage', 'fiancailles', 'anniversaire', 'conference', 'autre');
create type reservation_status as enum ('pending', 'confirmed', 'cancelled', 'completed');
create type review_status      as enum ('pending', 'approved', 'rejected', 'flagged');
create type subscription_status as enum ('trial', 'active', 'cancelled', 'expired');
create type payment_method     as enum ('ccp', 'baridimob', 'edahabia');
create type notification_channel as enum ('push', 'sms', 'email', 'in_app');

-- ── Utilisateurs ──────────────────────────────────────────────────────────
-- L'id référence auth.users : l'authentification par OTP SMS est déléguée
-- à Supabase Auth (§2.3).

create table users (
    id                 uuid primary key references auth.users(id) on delete cascade,
    phone              varchar(20) unique not null,
    email              varchar(255),
    full_name          varchar(255),
    role               user_role default 'client',
    preferred_language user_language default 'fr',
    ccp                varchar(64),
    pin_hash           text,                -- §10.1 — jamais le PIN en clair
    created_at         timestamptz default now(),
    updated_at         timestamptz default now()
);

-- ── Salles ────────────────────────────────────────────────────────────────

create table salles (
    id             uuid primary key default gen_random_uuid(),
    owner_id       uuid not null references users(id) on delete cascade,
    name           varchar(255) not null,
    city           varchar(100) not null,
    address        text,
    capacity_max   int check (capacity_max >= 0),
    parking_places int check (parking_places >= 0),
    description    text,
    amenities      jsonb not null default '[]',
    photos         jsonb not null default '[]',
    status         salle_status default 'pending',
    is_premium     boolean default false,
    created_at     timestamptz default now()
);

create table tarifs (
    id          uuid primary key default gen_random_uuid(),
    salle_id    uuid not null references salles(id) on delete cascade,
    name        varchar(255) not null,
    description text,
    price       numeric(10,2) not null check (price >= 0),
    currency    varchar(3) default 'DZD',
    sort_order  int default 0
);

-- Jours rendus indisponibles manuellement par le propriétaire (§5.3)
create table blocked_days (
    salle_id uuid not null references salles(id) on delete cascade,
    day      date not null,
    primary key (salle_id, day)
);

-- ── Réservations ──────────────────────────────────────────────────────────

create sequence reservation_seq;

create table reservations (
    id               uuid primary key default gen_random_uuid(),
    reference        varchar(20) unique not null,
    client_id        uuid not null references users(id) on delete cascade,
    client_name      varchar(255),
    client_phone     varchar(20),
    salle_id         uuid not null references salles(id) on delete cascade,
    event_date       date not null,
    event_type       event_type not null,
    guest_count      int check (guest_count >= 0),
    formula_id       uuid references tarifs(id) on delete set null,
    total_amount     numeric(10,2),
    deposit_amount   numeric(10,2),
    deposit_paid     boolean default false,
    deposit_paid_at  timestamptz,
    deposit_declared boolean default false,
    status           reservation_status default 'pending',
    client_message   text,
    pro_notes        text,
    source           varchar(20) default 'app',
    signed_at        timestamptz,             -- horodatage de la signature PIN
    created_at       timestamptz default now(),
    updated_at       timestamptz default now()
);

-- §10.1 — une seule réservation confirmée par jour et par salle.
-- L'index partiel rend la règle inviolable, y compris en cas de course.
create unique index uniq_confirmed_day
    on reservations (salle_id, event_date)
    where status = 'confirmed';

-- ── Avis ──────────────────────────────────────────────────────────────────

create table reviews (
    id              uuid primary key default gen_random_uuid(),
    reservation_id  uuid unique references reservations(id) on delete set null,
    client_id       uuid not null references users(id) on delete cascade,
    client_name     varchar(255),
    salle_id        uuid not null references salles(id) on delete cascade,
    event_type      event_type,
    rating_overall  int not null check (rating_overall between 1 and 5),
    rating_salle    int check (rating_salle between 1 and 5),
    rating_traiteur int check (rating_traiteur between 1 and 5),
    rating_proprete int check (rating_proprete between 1 and 5),
    rating_value    int check (rating_value between 1 and 5),
    comment         text,
    photos          jsonb not null default '[]',
    is_verified     boolean default false,
    status          review_status default 'pending',
    pro_reply       text,
    pro_replied_at  timestamptz,
    created_at      timestamptz default now()
);

-- ── Abonnements & facturation ─────────────────────────────────────────────

create table subscriptions (
    id                   uuid primary key default gen_random_uuid(),
    pro_id               uuid not null references users(id) on delete cascade,
    salle_id             uuid not null references salles(id) on delete cascade,
    status               subscription_status default 'trial',
    trial_started_at     date default current_date,
    trial_ends_at        date,
    current_period_start date,
    current_period_end   date,
    amount               numeric(10,2) default 500.00,
    payment_method       payment_method,
    payment_details      jsonb,
    created_at           timestamptz default now(),
    unique (salle_id)
);

create table invoices (
    id          uuid primary key default gen_random_uuid(),
    salle_id    uuid not null references salles(id) on delete cascade,
    period      varchar(64),
    description text,
    amount      numeric(10,2) default 0,
    status      varchar(20) default 'pending',
    issued_at   date default current_date
);

-- ── Messagerie & notifications ────────────────────────────────────────────

create table messages (
    id             uuid primary key default gen_random_uuid(),
    reservation_id uuid not null references reservations(id) on delete cascade,
    sender_id      uuid not null references users(id) on delete cascade,
    content        text not null,
    attachments    jsonb not null default '[]',
    is_read        boolean default false,
    created_at     timestamptz default now()
);

create table notifications (
    id         uuid primary key default gen_random_uuid(),
    user_id    uuid not null references users(id) on delete cascade,
    type       varchar(50) not null,
    title      varchar(255),
    body       text,
    data       jsonb,
    channel    notification_channel default 'in_app',
    is_read    boolean default false,
    sent_at    timestamptz,
    created_at timestamptz default now()
);

create table favorites (
    user_id  uuid not null references users(id) on delete cascade,
    salle_id uuid not null references salles(id) on delete cascade,
    primary key (user_id, salle_id)
);

-- ── Index (§8.2) ──────────────────────────────────────────────────────────

create index idx_reservations_client on reservations(client_id);
create index idx_reservations_salle  on reservations(salle_id);
create index idx_reservations_date   on reservations(event_date);
create index idx_reservations_status on reservations(status);
create index idx_reviews_salle       on reviews(salle_id);
create index idx_messages_reservation on messages(reservation_id);
create index idx_notifications_user  on notifications(user_id, is_read);
create index idx_salles_city         on salles(city);
create index idx_tarifs_salle        on tarifs(salle_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- Fonctions utilitaires
-- ═══════════════════════════════════════════════════════════════════════════

-- Un avis passe en publication automatique 24 h après son dépôt (§10.2).
create or replace function review_is_public(r reviews)
returns boolean
language sql
immutable
as $$
    select r.status = 'approved'
        or (r.status = 'pending' and r.created_at < now() - interval '24 hours');
$$;

create or replace function is_salle_owner(p_salle uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select exists (
        select 1 from salles where id = p_salle and owner_id = auth.uid()
    );
$$;

create or replace function next_reference()
returns varchar
language sql
as $$
    select 'TAS-' || to_char(now(), 'YYYY') || '-' ||
           lpad(nextval('reservation_seq')::text, 4, '0');
$$;

-- ═══════════════════════════════════════════════════════════════════════════
-- Vues publiques
-- ═══════════════════════════════════════════════════════════════════════════

-- Note et nombre d'avis calculés à partir des seuls avis publiés.
create view salles_public
with (security_invoker = on)
as
select
    s.*,
    agg.rating,
    coalesce(agg.reviews_count, 0) as reviews_count
from salles s
left join lateral (
    select round(avg(r.rating_overall)::numeric, 1) as rating,
           count(*) as reviews_count
    from reviews r
    where r.salle_id = s.id and review_is_public(r)
) agg on true;

create view reviews_public
with (security_invoker = on)
as
select id, salle_id, client_name, event_type, rating_overall, rating_salle,
       rating_traiteur, rating_proprete, rating_value, comment, photos,
       is_verified, pro_reply, pro_replied_at, created_at
from reviews r
where review_is_public(r);

-- ═══════════════════════════════════════════════════════════════════════════
-- RPC — §9
-- ═══════════════════════════════════════════════════════════════════════════

-- §2.3 — le PIN de signature est haché, jamais stocké en clair.
create or replace function set_pro_pin(p_pin text)
returns void
language sql
security definer
set search_path = public
as $$
    update users set pin_hash = crypt(p_pin, gen_salt('bf')), updated_at = now()
    where id = auth.uid();
$$;

-- §9.2 — état de chaque jour sur une période.
create or replace function salle_availability(p_salle uuid, p_from date, p_to date)
returns table (day date, state text)
language sql
stable
security definer
set search_path = public
as $$
    select d::date as day,
        case
            when d::date < current_date then 'past'
            when exists (select 1 from blocked_days b
                         where b.salle_id = p_salle and b.day = d::date) then 'blocked'
            when exists (select 1 from reservations r
                         where r.salle_id = p_salle and r.event_date = d::date
                           and r.status = 'confirmed') then 'booked'
            -- Une demande en attente réserve le jour pendant 48 h (§10.1)
            when exists (select 1 from reservations r
                         where r.salle_id = p_salle and r.event_date = d::date
                           and r.status = 'pending'
                           and r.created_at > now() - interval '48 hours') then 'held'
            else 'available'
        end as state
    from generate_series(p_from, p_to, interval '1 day') d;
$$;

-- §9.3 — création d'une demande de réservation.
create or replace function create_reservation(
    p_salle uuid, p_event_date date, p_event_type event_type,
    p_guest_count int, p_formula uuid, p_client_name text,
    p_client_phone text, p_message text
)
returns reservations
language plpgsql
security definer
set search_path = public
as $$
declare
    v_row   reservations;
    v_price numeric(10,2);
    v_salle salles;
begin
    if auth.uid() is null then
        raise exception 'NOT_AUTHENTICATED';
    end if;

    select * into v_salle from salles where id = p_salle;
    if not found then
        raise exception 'SALLE_NOT_FOUND';
    end if;

    -- §10.1 — le jour ne doit pas déjà porter une réservation confirmée
    if exists (select 1 from reservations
               where salle_id = p_salle and event_date = p_event_date
                 and status = 'confirmed') then
        raise exception 'DAY_TAKEN';
    end if;

    select price into v_price from tarifs where id = p_formula;

    insert into reservations (
        reference, client_id, client_name, client_phone, salle_id,
        event_date, event_type, guest_count, formula_id, total_amount, client_message
    ) values (
        next_reference(), auth.uid(), p_client_name, p_client_phone, p_salle,
        p_event_date, p_event_type, p_guest_count, p_formula, v_price, p_message
    ) returning * into v_row;

    -- §4.4 — notification au client et au propriétaire
    insert into notifications (user_id, type, title, body, data, channel, sent_at)
    values
      (auth.uid(), 'reservation_sent', 'Demande transmise',
       'Votre demande pour ' || v_salle.name || ' le ' || p_event_date ||
       ' a été transmise. Réf. ' || v_row.reference || '.',
       jsonb_build_object('reservation_id', v_row.id), 'push', now()),
      (v_salle.owner_id, 'reservation_new', 'Nouvelle demande de réservation',
       p_client_name || ' souhaite réserver le ' || p_event_date || '.',
       jsonb_build_object('reservation_id', v_row.id), 'push', now());

    return v_row;
end;
$$;

-- §9.3 — annulation par le client, gratuite tant que la demande est en attente.
create or replace function cancel_reservation(p_reservation uuid)
returns reservations
language plpgsql
security definer
set search_path = public
as $$
declare v_row reservations;
begin
    select * into v_row from reservations
    where id = p_reservation and client_id = auth.uid();

    if not found then raise exception 'RESERVATION_NOT_FOUND'; end if;
    if v_row.status <> 'pending' then raise exception 'NOT_CANCELLABLE'; end if;

    update reservations set status = 'cancelled', updated_at = now()
    where id = p_reservation returning * into v_row;

    insert into notifications (user_id, type, title, body, data, channel, sent_at)
    select s.owner_id, 'reservation_cancelled', 'Demande annulée',
           v_row.client_name || ' a annulé sa demande du ' || v_row.event_date || '.',
           jsonb_build_object('reservation_id', v_row.id), 'push', now()
    from salles s where s.id = v_row.salle_id;

    return v_row;
end;
$$;

-- §9.4 / §10.1 — confirmation signée par PIN, avec demande d'acompte.
create or replace function pro_confirm_reservation(
    p_reservation uuid, p_deposit numeric, p_ccp text, p_pin text
)
returns reservations
language plpgsql
security definer
set search_path = public
as $$
declare
    v_row   reservations;
    v_user  users;
    v_salle salles;
begin
    select * into v_user from users where id = auth.uid();
    if not found then raise exception 'NOT_AUTHENTICATED'; end if;

    select r.* into v_row
    from reservations r join salles s on s.id = r.salle_id
    where r.id = p_reservation and s.owner_id = auth.uid();
    if not found then raise exception 'RESERVATION_NOT_FOUND'; end if;

    select * into v_salle from salles where id = v_row.salle_id;

    -- Premier usage : le PIN saisi devient le PIN de référence
    if v_user.pin_hash is null then
        perform set_pro_pin(p_pin);
    elsif v_user.pin_hash <> crypt(p_pin, v_user.pin_hash) then
        raise exception 'WRONG_PIN';
    end if;

    if p_ccp is not null then
        update users set ccp = p_ccp where id = auth.uid();
    end if;

    -- L'index partiel uniq_confirmed_day lève une violation si le jour est pris
    update reservations
       set status = 'confirmed', deposit_amount = p_deposit,
           signed_at = now(), updated_at = now()
     where id = p_reservation
    returning * into v_row;

    insert into notifications (user_id, type, title, body, data, channel, sent_at)
    values (v_row.client_id, 'reservation_confirmed', 'Réservation confirmée',
            'Votre réservation le ' || v_row.event_date || ' est confirmée. Réf. ' ||
            v_row.reference || '.',
            jsonb_build_object('reservation_id', v_row.id), 'push', now());

    if p_deposit is not null then
        insert into notifications (user_id, type, title, body, data, channel, sent_at)
        values (v_row.client_id, 'deposit_requested', 'Acompte demandé',
                'Un acompte de ' || p_deposit || ' DA est demandé. CCP : ' ||
                coalesce(p_ccp, v_user.ccp, '—') || '.',
                jsonb_build_object('reservation_id', v_row.id), 'push', now());
    end if;

    return v_row;
exception
    when unique_violation then
        raise exception 'DAY_TAKEN';
end;
$$;

create or replace function pro_cancel_reservation(p_reservation uuid, p_reason text)
returns reservations
language plpgsql
security definer
set search_path = public
as $$
declare v_row reservations;
begin
    if not exists (
        select 1 from reservations r join salles s on s.id = r.salle_id
        where r.id = p_reservation and s.owner_id = auth.uid()
    ) then raise exception 'RESERVATION_NOT_FOUND'; end if;

    update reservations
       set status = 'cancelled', pro_notes = p_reason, updated_at = now()
     where id = p_reservation returning * into v_row;

    insert into notifications (user_id, type, title, body, data, channel, sent_at)
    values (v_row.client_id, 'reservation_cancelled', 'Demande refusée',
            'Votre demande du ' || v_row.event_date || ' n''a pas pu être retenue.',
            jsonb_build_object('reservation_id', v_row.id), 'push', now());

    return v_row;
end;
$$;

create or replace function pro_verify_deposit(p_reservation uuid)
returns reservations
language plpgsql
security definer
set search_path = public
as $$
declare v_row reservations;
begin
    if not exists (
        select 1 from reservations r join salles s on s.id = r.salle_id
        where r.id = p_reservation and s.owner_id = auth.uid()
    ) then raise exception 'RESERVATION_NOT_FOUND'; end if;

    update reservations
       set deposit_paid = true, deposit_paid_at = now(), updated_at = now()
     where id = p_reservation returning * into v_row;

    insert into notifications (user_id, type, title, body, data, channel, sent_at)
    values (v_row.client_id, 'deposit_verified', 'Acompte reçu',
            'La réception de votre acompte est confirmée. Réf. ' || v_row.reference || '.',
            jsonb_build_object('reservation_id', v_row.id), 'push', now());

    return v_row;
end;
$$;

-- §9.6 / §10.2 — dépôt d'un avis, au plus tôt 48 h après l'événement.
create or replace function create_review(
    p_reservation uuid, p_overall int, p_salle int, p_traiteur int,
    p_proprete int, p_value int, p_comment text, p_photos jsonb
)
returns reviews
language plpgsql
security definer
set search_path = public
as $$
declare
    v_resa reservations;
    v_row  reviews;
    v_name text;
begin
    select * into v_resa from reservations
    where id = p_reservation and client_id = auth.uid();
    if not found then raise exception 'RESERVATION_NOT_FOUND'; end if;

    if now() < (v_resa.event_date + interval '48 hours') then
        raise exception 'TOO_EARLY';
    end if;

    select full_name into v_name from users where id = auth.uid();

    insert into reviews (
        reservation_id, client_id, client_name, salle_id, event_type,
        rating_overall, rating_salle, rating_traiteur, rating_proprete,
        rating_value, comment, photos, is_verified
    ) values (
        p_reservation, auth.uid(), v_name, v_resa.salle_id, v_resa.event_type,
        p_overall, p_salle, p_traiteur, p_proprete, p_value, p_comment,
        coalesce(p_photos, '[]'::jsonb),
        -- §7.4 — badge « client confirmé »
        v_resa.status = 'completed'
    ) returning * into v_row;

    insert into notifications (user_id, type, title, body, data, channel, sent_at)
    select s.owner_id, 'review_pending', 'Nouvel avis en attente',
           'Un avis a été déposé. Vous avez 24 h pour le modérer.',
           jsonb_build_object('review_id', v_row.id), 'push', now()
    from salles s where s.id = v_resa.salle_id;

    return v_row;
end;
$$;

create or replace function pro_reply_review(p_review uuid, p_reply text)
returns reviews
language plpgsql
security definer
set search_path = public
as $$
declare v_row reviews;
begin
    if not exists (
        select 1 from reviews r join salles s on s.id = r.salle_id
        where r.id = p_review and s.owner_id = auth.uid()
    ) then raise exception 'REVIEW_NOT_FOUND'; end if;

    update reviews
       set pro_reply = p_reply, pro_replied_at = now(),
           status = case when status = 'pending' then 'approved' else status end
     where id = p_review returning * into v_row;

    return v_row;
end;
$$;

-- §9.7 — KPI du tableau de bord, renvoyés en un seul aller-retour.
create or replace function pro_dashboard()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
    v_salle       salles;
    v_this_month  date := date_trunc('month', current_date)::date;
    v_prev_month  date := (date_trunc('month', current_date) - interval '1 month')::date;
    v_result      jsonb;
begin
    select * into v_salle from salles where owner_id = auth.uid() limit 1;
    if not found then raise exception 'NO_SALLE'; end if;

    select jsonb_build_object(
        'salle', to_jsonb(sp.*),
        'kpis', jsonb_build_object(
            'reservations', jsonb_build_object(
                'value', cur.cnt,
                'delta', cur.cnt - prev.cnt
            ),
            'revenue', jsonb_build_object(
                'value', cur.revenue,
                'delta', case when prev.revenue > 0
                              then round(((cur.revenue - prev.revenue) / prev.revenue) * 100)
                              else 0 end
            ),
            'confirmRate', jsonb_build_object(
                'value', cur.confirm_rate,
                'delta', coalesce(cur.confirm_rate, 0) - coalesce(prev.confirm_rate, 0)
            ),
            'rating', jsonb_build_object('value', sp.rating, 'count', sp.reviews_count)
        ),
        'revenueSeries', (
            select coalesce(jsonb_agg(jsonb_build_object(
                       'key', to_char(m, 'YYYY-MM'),
                       'month', extract(month from m)::int - 1,
                       'value', coalesce((
                           select sum(r.total_amount) from reservations r
                           where r.salle_id = v_salle.id
                             and r.status in ('confirmed', 'completed')
                             and date_trunc('month', r.event_date) = m
                       ), 0)
                   ) order by m), '[]'::jsonb)
            from generate_series(
                date_trunc('month', current_date) - interval '5 months',
                date_trunc('month', current_date), interval '1 month'
            ) m
        ),
        'pendingCount', (select count(*) from reservations
                         where salle_id = v_salle.id and status = 'pending'),
        'pendingReviews', (select count(*) from reviews r
                           where r.salle_id = v_salle.id and not review_is_public(r)),
        'trialDaysLeft', greatest(0, coalesce(
            (select trial_ends_at - current_date from subscriptions
             where salle_id = v_salle.id), 0)),
        'subscriptionStatus', coalesce(
            (select status::text from subscriptions where salle_id = v_salle.id), 'trial'),
        'upcoming', (
            select coalesce(jsonb_agg(to_jsonb(u.*) order by u.event_date), '[]'::jsonb)
            from (
                select r.* from reservations r
                where r.salle_id = v_salle.id
                  and r.event_date >= current_date
                  and r.status <> 'cancelled'
                order by r.event_date limit 6
            ) u
        )
    ) into v_result
    from salles_public sp,
    lateral (
        select count(*) as cnt,
               coalesce(sum(total_amount) filter (where status in ('confirmed','completed')), 0) as revenue,
               case when count(*) filter (where status <> 'pending') > 0
                    then round(100.0 * count(*) filter (where status in ('confirmed','completed'))
                                     / count(*) filter (where status <> 'pending'))
               end as confirm_rate
        from reservations
        where salle_id = v_salle.id and date_trunc('month', event_date) = v_this_month
    ) cur,
    lateral (
        select count(*) as cnt,
               coalesce(sum(total_amount) filter (where status in ('confirmed','completed')), 0) as revenue,
               case when count(*) filter (where status <> 'pending') > 0
                    then round(100.0 * count(*) filter (where status in ('confirmed','completed'))
                                     / count(*) filter (where status <> 'pending'))
               end as confirm_rate
        from reservations
        where salle_id = v_salle.id and date_trunc('month', event_date) = v_prev_month
    ) prev
    where sp.id = v_salle.id;

    return v_result;
end;
$$;

-- §9.7 — statistiques détaillées (§5.6).
create or replace function pro_stats()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
    v_salle uuid;
    v_total int;
begin
    select id into v_salle from salles where owner_id = auth.uid() limit 1;
    if v_salle is null then raise exception 'NO_SALLE'; end if;

    select greatest(count(*), 1) into v_total
    from reservations where salle_id = v_salle and status <> 'cancelled';

    return jsonb_build_object(
        'eventTypes', (
            select coalesce(jsonb_agg(jsonb_build_object(
                'type', event_type, 'count', c,
                'percent', round(100.0 * c / v_total)
            ) order by c desc), '[]'::jsonb)
            from (select event_type, count(*) c from reservations
                  where salle_id = v_salle and status <> 'cancelled'
                  group by event_type) x
        ),
        'sources', (
            select coalesce(jsonb_agg(jsonb_build_object(
                'source', source, 'count', c,
                'percent', round(100.0 * c / v_total)
            ) order by c desc), '[]'::jsonb)
            from (select coalesce(source, 'other') source, count(*) c from reservations
                  where salle_id = v_salle and status <> 'cancelled'
                  group by 1) y
        ),
        'occupancy', (
            select coalesce(jsonb_agg(jsonb_build_object(
                'key', to_char(m, 'YYYY-MM'),
                'month', extract(month from m)::int - 1,
                'percent', round(100.0 * (
                    select count(*) from reservations r
                    where r.salle_id = v_salle and r.status <> 'cancelled'
                      and date_trunc('month', r.event_date) = m
                ) / extract(day from (m + interval '1 month' - interval '1 day')))
            ) order by m), '[]'::jsonb)
            from generate_series(
                date_trunc('month', current_date) - interval '5 months',
                date_trunc('month', current_date), interval '1 month') m
        ),
        'revenueSeries', (
            select coalesce(jsonb_agg(jsonb_build_object(
                'key', to_char(m, 'YYYY-MM'),
                'month', extract(month from m)::int - 1,
                'value', coalesce((
                    select sum(r.total_amount) from reservations r
                    where r.salle_id = v_salle and r.status <> 'cancelled'
                      and date_trunc('month', r.event_date) = m), 0)
            ) order by m), '[]'::jsonb)
            from generate_series(
                date_trunc('month', current_date) - interval '5 months',
                date_trunc('month', current_date), interval '1 month') m
        )
    );
end;
$$;

-- §9.5 — liste des conversations, côté client comme côté pro.
create or replace function list_conversations()
returns table (
    reservation_id uuid, reference varchar, title text,
    subtitle text, last_message text, last_at timestamptz, unread bigint
)
language sql
stable
security definer
set search_path = public
as $$
    select r.id,
           r.reference,
           case when s.owner_id = auth.uid() then r.client_name else s.name end,
           r.event_type::text || ' · ' || r.event_date::text,
           (select m.content from messages m where m.reservation_id = r.id
            order by m.created_at desc limit 1),
           coalesce((select max(m.created_at) from messages m
                     where m.reservation_id = r.id), r.created_at),
           (select count(*) from messages m
            where m.reservation_id = r.id and not m.is_read and m.sender_id <> auth.uid())
    from reservations r
    join salles s on s.id = r.salle_id
    where r.client_id = auth.uid() or s.owner_id = auth.uid()
    order by 6 desc;
$$;

-- ═══════════════════════════════════════════════════════════════════════════
-- Row Level Security
-- ═══════════════════════════════════════════════════════════════════════════

alter table users         enable row level security;
alter table salles        enable row level security;
alter table tarifs        enable row level security;
alter table blocked_days  enable row level security;
alter table reservations  enable row level security;
alter table reviews       enable row level security;
alter table subscriptions enable row level security;
alter table invoices      enable row level security;
alter table messages      enable row level security;
alter table notifications enable row level security;
alter table favorites     enable row level security;

-- Utilisateurs : chacun ne voit et ne modifie que sa propre fiche.
-- `pin_hash` n'est jamais exposé : il n'est lu que par les fonctions
-- SECURITY DEFINER ci-dessus.
create policy users_select_self on users for select using (id = auth.uid());
create policy users_insert_self on users for insert with check (id = auth.uid());
create policy users_update_self on users for update using (id = auth.uid());

-- Salles : lecture publique des salles actives, écriture réservée au propriétaire.
create policy salles_select_public on salles for select
    using (status = 'active' or owner_id = auth.uid());
create policy salles_insert_owner on salles for insert with check (owner_id = auth.uid());
create policy salles_update_owner on salles for update using (owner_id = auth.uid());
create policy salles_delete_owner on salles for delete using (owner_id = auth.uid());

create policy tarifs_select_public on tarifs for select
    using (exists (select 1 from salles s where s.id = salle_id
                   and (s.status = 'active' or s.owner_id = auth.uid())));
create policy tarifs_write_owner on tarifs for all
    using (is_salle_owner(salle_id)) with check (is_salle_owner(salle_id));

-- Jours bloqués : information interne au propriétaire.
-- Les clients y accèdent indirectement via salle_availability().
create policy blocked_days_owner on blocked_days for all
    using (is_salle_owner(salle_id)) with check (is_salle_owner(salle_id));

-- Réservations : le client voit les siennes, le pro celles de ses salles.
create policy reservations_select on reservations for select
    using (client_id = auth.uid() or is_salle_owner(salle_id));
create policy reservations_update_client on reservations for update
    using (client_id = auth.uid()) with check (client_id = auth.uid());

-- Avis : lecture publique une fois publiés ; l'auteur et le pro voient aussi
-- ceux en attente. Un pro ne peut jamais supprimer un avis (§10.2).
create policy reviews_select on reviews for select
    using (review_is_public(reviews) or client_id = auth.uid() or is_salle_owner(salle_id));
create policy reviews_update_pro on reviews for update
    using (is_salle_owner(salle_id)) with check (is_salle_owner(salle_id));

create policy subscriptions_owner on subscriptions for all
    using (pro_id = auth.uid()) with check (pro_id = auth.uid());
create policy invoices_owner on invoices for select using (is_salle_owner(salle_id));

-- Messagerie : uniquement les deux parties de la réservation.
create policy messages_select on messages for select
    using (exists (select 1 from reservations r join salles s on s.id = r.salle_id
                   where r.id = reservation_id
                     and (r.client_id = auth.uid() or s.owner_id = auth.uid())));
create policy messages_insert on messages for insert
    with check (sender_id = auth.uid()
        and exists (select 1 from reservations r join salles s on s.id = r.salle_id
                    where r.id = reservation_id
                      and (r.client_id = auth.uid() or s.owner_id = auth.uid())));
create policy messages_update on messages for update
    using (exists (select 1 from reservations r join salles s on s.id = r.salle_id
                   where r.id = reservation_id
                     and (r.client_id = auth.uid() or s.owner_id = auth.uid())));

create policy notifications_own on notifications for select using (user_id = auth.uid());
create policy notifications_update_own on notifications for update using (user_id = auth.uid());

create policy favorites_own on favorites for all
    using (user_id = auth.uid()) with check (user_id = auth.uid());
