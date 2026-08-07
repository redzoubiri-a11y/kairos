-- ═══════════════════════════════════════════════════════════════════════════
-- Tasalle — parrainage entre propriétaires (§12 Phase 4)
--
-- Un propriétaire en parraine un autre ; tous deux gagnent des jours
-- d'abonnement. Les familles ne paient rien, il n'y a donc rien à leur offrir.
--
-- La récompense est versée par la base, à la validation de la salle par un
-- administrateur. Elle ne dépend jamais d'un appel du client.
-- ═══════════════════════════════════════════════════════════════════════════

create type referral_status as enum ('pending', 'rewarded', 'rejected');

alter table users add column if not exists referral_code varchar(12);
create unique index if not exists uniq_referral_code on users (referral_code) where referral_code is not null;

create table referrals (
    id           uuid primary key default gen_random_uuid(),
    referrer_id  uuid not null references users(id) on delete cascade,
    -- Un filleul n'est parrainé qu'une fois : sans cette unicité, changer de
    -- parrain rejouerait la récompense.
    referred_id  uuid not null unique references users(id) on delete cascade,
    code         varchar(12) not null,
    status       referral_status not null default 'pending',
    days_granted int not null default 0,
    rewarded_at  timestamptz,
    created_at   timestamptz not null default now(),

    constraint referral_pas_soi_meme check (referrer_id <> referred_id)
);

create index idx_referrals_parrain on referrals (referrer_id);

alter table referrals enable row level security;

-- Chacun voit les liens qui le concernent, et personne n'écrit directement :
-- la création passe par register_salle, la récompense par l'administration.
create policy referrals_lecture on referrals for select
    using (referrer_id = auth.uid() or referred_id = auth.uid());

-- ── Attribution des codes ─────────────────────────────────────────────────

/**
 * Code lisible, sans caractères ambigus : il se dicte au téléphone et se
 * recopie depuis un SMS. Ni 0/O ni 1/I/L.
 */
create or replace function generate_referral_code()
returns varchar(12)
language plpgsql
as $$
declare
    v_alphabet constant text := '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
    v_code     text;
begin
    for _ in 1..50 loop
        v_code := '';
        for _ in 1..6 loop
            v_code := v_code || substr(v_alphabet, 1 + floor(random() * length(v_alphabet))::int, 1);
        end loop;
        if not exists (select 1 from users where referral_code = v_code) then
            return v_code;
        end if;
    end loop;
    raise exception 'REFERRAL_CODE_EXHAUSTED';
end;
$$;

-- Les propriétaires déjà inscrits en reçoivent un.
update users set referral_code = generate_referral_code()
where role = 'pro' and referral_code is null;

/** Verdict sur un code saisi, sans nouer le lien. */
create or replace function check_referral_code(p_code text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare v_parrain users;
begin
    if auth.uid() is null then raise exception 'NOT_AUTHENTICATED'; end if;

    select * into v_parrain from users
    where referral_code = upper(regexp_replace(coalesce(p_code, ''), '[^0-9A-Za-z]', '', 'g'));

    if not found then return jsonb_build_object('ok', false, 'reason', 'unknown'); end if;
    if v_parrain.id = auth.uid() then return jsonb_build_object('ok', false, 'reason', 'self'); end if;
    if exists (select 1 from referrals where referred_id = auth.uid()) then
        return jsonb_build_object('ok', false, 'reason', 'already_referred');
    end if;

    return jsonb_build_object('ok', true, 'referrer_name', v_parrain.full_name);
end;
$$;

/** Noue le lien de parrainage. Appelée à l'inscription du filleul. */
create or replace function attach_referral(p_code text)
returns referrals
language plpgsql
security definer
set search_path = public
as $$
declare
    v_verdict jsonb;
    v_parrain users;
    v_row     referrals;
begin
    v_verdict := check_referral_code(p_code);
    if not (v_verdict ->> 'ok')::boolean then
        raise exception 'REFERRAL_REFUSED: %', v_verdict ->> 'reason';
    end if;

    select * into v_parrain from users
    where referral_code = upper(regexp_replace(p_code, '[^0-9A-Za-z]', '', 'g'));

    insert into referrals (referrer_id, referred_id, code)
    values (v_parrain.id, auth.uid(), v_parrain.referral_code)
    returning * into v_row;

    return v_row;
end;
$$;

-- ── Versement de la récompense ────────────────────────────────────────────

/**
 * Ajoute des jours à l'abonnement d'un propriétaire.
 *
 * Les jours s'ajoutent à l'échéance en cours — fin d'essai tant qu'il dure,
 * fin de période ensuite. S'ils partaient d'aujourd'hui, un parrain récompensé
 * en début d'essai y perdrait ses jours restants.
 */
create or replace function extend_subscription(p_pro uuid, p_days int)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare v_sub subscriptions;
begin
    if p_days <= 0 then return 0; end if;

    select * into v_sub from subscriptions where pro_id = p_pro for update;
    if not found then return 0; end if;

    if v_sub.current_period_end is not null then
        update subscriptions
           set current_period_end = greatest(current_period_end, current_date) + p_days
         where id = v_sub.id;
    else
        update subscriptions
           set trial_ends_at = greatest(trial_ends_at, current_date) + p_days
         where id = v_sub.id;
    end if;

    return p_days;
end;
$$;

/**
 * Verse la récompense due au titre d'un filleul dont la salle vient d'être
 * validée. Sans effet si le lien n'existe pas ou a déjà été honoré — une
 * salle dépubliée puis republiée ne récompense pas deux fois.
 */
create or replace function reward_referral(p_referred uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
    v_lien    referrals;
    v_acquis  int;
    v_parrain int;
    v_filleul constant int := 30;
begin
    select * into v_lien from referrals
    where referred_id = p_referred and status = 'pending'
    for update;
    if not found then return; end if;

    -- Plafond : sans lui, l'engagement envers un parrain très actif serait
    -- sans limite.
    select coalesce(sum(days_granted), 0) into v_acquis from referrals
    where referrer_id = v_lien.referrer_id and status = 'rewarded';

    v_parrain := least(30, greatest(365 - v_acquis, 0));

    perform extend_subscription(v_lien.referrer_id, v_parrain);
    perform extend_subscription(p_referred, v_filleul);

    update referrals
       set status = 'rewarded', days_granted = v_parrain, rewarded_at = now()
     where id = v_lien.id;

    if v_parrain > 0 then
        insert into notifications (user_id, type, title, body, data, channel, sent_at)
        values (v_lien.referrer_id, 'referral_rewarded', 'Parrainage récompensé',
                'Votre filleul est en ligne : ' || v_parrain ||
                ' jours d''abonnement vous sont offerts.',
                jsonb_build_object('referral_id', v_lien.id), 'push', now());
    end if;

    insert into notifications (user_id, type, title, body, data, channel, sent_at)
    values (p_referred, 'referral_rewarded', 'Bienvenue, offert',
            v_filleul || ' jours d''abonnement vous sont offerts grâce à votre parrain.',
            jsonb_build_object('referral_id', v_lien.id), 'push', now());
end;
$$;

-- La validation par l'administrateur déclenche le versement.
create or replace function admin_review_salle(p_salle uuid, p_approved boolean)
returns salles
language plpgsql
security definer
set search_path = public
as $$
declare v_row salles;
begin
    if not is_admin() then raise exception 'FORBIDDEN'; end if;

    update salles
       set status = case when p_approved then 'active' else 'inactive' end::salle_status
     where id = p_salle
    returning * into v_row;

    if not found then raise exception 'SALLE_NOT_FOUND'; end if;

    -- §12 Phase 4 — l'étape humaine est la barrière anti-abus du parrainage.
    if p_approved then
        perform reward_referral(v_row.owner_id);
    end if;

    insert into notifications (user_id, type, title, body, data, channel, sent_at)
    values (
        v_row.owner_id,
        case when p_approved then 'salle_approved' else 'salle_rejected' end,
        case when p_approved then 'Votre salle est en ligne'
             else 'Votre salle n''a pas été validée' end,
        case when p_approved
             then v_row.name || ' est désormais visible par les familles.'
             else v_row.name || ' n''a pas pu être validée. Contactez le support.' end,
        jsonb_build_object('salle_id', v_row.id), 'push', now()
    );

    return v_row;
end;
$$;

-- ── Tableau du parrain ────────────────────────────────────────────────────

create or replace function referral_summary()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
    v_code   text;
    v_acquis int;
begin
    if auth.uid() is null then raise exception 'NOT_AUTHENTICATED'; end if;

    select referral_code into v_code from users where id = auth.uid();

    select coalesce(sum(days_granted), 0) into v_acquis from referrals
    where referrer_id = auth.uid() and status = 'rewarded';

    return jsonb_build_object(
        'code', v_code,
        'daysEarned', v_acquis,
        'daysRemaining', least(30, greatest(365 - v_acquis, 0)),
        'pendingCount', (select count(*) from referrals
                         where referrer_id = auth.uid() and status = 'pending'),
        'filleuls', coalesce((
            select jsonb_agg(jsonb_build_object(
                       'id', r.id,
                       'name', u.full_name,
                       'salle_name', (select s.name from salles s
                                      where s.owner_id = r.referred_id
                                      order by s.created_at limit 1),
                       'status', r.status::text,
                       'days_granted', r.days_granted,
                       'created_at', r.created_at
                   ) order by r.created_at desc)
            from referrals r join users u on u.id = r.referred_id
            where r.referrer_id = auth.uid()
        ), '[]'::jsonb)
    );
end;
$$;

grant execute on function check_referral_code(text) to authenticated;
grant execute on function attach_referral(text) to authenticated;
grant execute on function referral_summary() to authenticated;
