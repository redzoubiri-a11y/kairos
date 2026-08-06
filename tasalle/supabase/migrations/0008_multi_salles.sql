-- ═══════════════════════════════════════════════════════════════════════════
-- Tasalle — un propriétaire, plusieurs salles (§12 Phase 4)
--
-- Le modèle initial supposait une salle par propriétaire : l'abonnement y
-- était rattaché par une contrainte `unique (salle_id)`, et pro_dashboard()
-- prenait « la » salle du pro sans se poser de question.
--
-- Décision de facturation : 500 DA par PROPRIÉTAIRE, pas par salle. Ajouter
-- une deuxième salle ne double donc pas la facture ni ne relance l'essai.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── L'abonnement suit le propriétaire ─────────────────────────────────────

-- Avant de poser l'unicité par pro, on dédoublonne : si un propriétaire avait
-- plusieurs abonnements (un par salle), on conserve le plus ancien, qui porte
-- la date d'essai la plus favorable au client.
delete from subscriptions s
where exists (
    select 1 from subscriptions autre
    where autre.pro_id = s.pro_id
      and (autre.created_at < s.created_at
           or (autre.created_at = s.created_at and autre.id < s.id))
);

alter table subscriptions drop constraint if exists subscriptions_salle_id_key;
alter table subscriptions alter column salle_id drop not null;

-- La salle n'est plus l'objet de l'abonnement, seulement une trace d'origine
comment on column subscriptions.salle_id is
    'Salle à l''origine de l''inscription. L''abonnement porte sur pro_id.';

alter table subscriptions drop constraint if exists subscriptions_pro_unique;
alter table subscriptions add constraint subscriptions_pro_unique unique (pro_id);

-- ── La facturation aussi ──────────────────────────────────────────────────

alter table invoices add column if not exists pro_id uuid references users(id) on delete cascade;

update invoices i
   set pro_id = s.owner_id
  from salles s
 where i.salle_id = s.id and i.pro_id is null;

create index if not exists idx_invoices_pro on invoices(pro_id);

drop policy if exists invoices_owner on invoices;
create policy invoices_owner on invoices for select using (pro_id = auth.uid());

-- ── Les agrégats portent sur une salle désignée ───────────────────────────

/**
 * Vérifie que la salle appartient bien au pro connecté, et renvoie son id.
 * Sans identifiant, retombe sur sa première salle — le cas mono-salle.
 */
create or replace function my_salle(p_salle uuid default null)
returns uuid
language plpgsql
stable
security definer
set search_path = public
as $$
declare v_id uuid;
begin
    if p_salle is null then
        select id into v_id from salles
        where owner_id = auth.uid()
        order by created_at limit 1;

        if v_id is null then raise exception 'NO_SALLE'; end if;
        return v_id;
    end if;

    select id into v_id from salles where id = p_salle and owner_id = auth.uid();
    if v_id is null then raise exception 'FORBIDDEN'; end if;
    return v_id;
end;
$$;

drop function if exists pro_dashboard();
drop function if exists pro_stats();

create or replace function pro_dashboard(p_salle uuid default null)
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
    select * into v_salle from salles where id = my_salle(p_salle);

    select jsonb_build_object(
        'salle', to_jsonb(sp.*),
        'kpis', jsonb_build_object(
            'reservations', jsonb_build_object('value', cur.cnt, 'delta', cur.cnt - prev.cnt),
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
        -- L'abonnement est celui du propriétaire, commun à toutes ses salles
        'trialDaysLeft', greatest(0, coalesce(
            (select trial_ends_at - current_date from subscriptions
             where pro_id = v_salle.owner_id), 0)),
        'subscriptionStatus', coalesce(
            (select status::text from subscriptions where pro_id = v_salle.owner_id), 'trial'),
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

create or replace function pro_stats(p_salle uuid default null)
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
    v_salle := my_salle(p_salle);

    select greatest(count(*), 1) into v_total
    from reservations where salle_id = v_salle and status <> 'cancelled';

    return jsonb_build_object(
        'eventTypes', (
            select coalesce(jsonb_agg(jsonb_build_object(
                'type', event_type, 'count', c, 'percent', round(100.0 * c / v_total)
            ) order by c desc), '[]'::jsonb)
            from (select event_type, count(*) c from reservations
                  where salle_id = v_salle and status <> 'cancelled'
                  group by event_type) x
        ),
        'sources', (
            select coalesce(jsonb_agg(jsonb_build_object(
                'source', source, 'count', c, 'percent', round(100.0 * c / v_total)
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
