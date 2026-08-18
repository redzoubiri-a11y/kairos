-- ═══════════════════════════════════════════════════════════════════════════
-- Tasalle — console d'administration (§2.1)
--
-- Deux boucles restaient ouvertes : une salle inscrite gardait le statut
-- « pending » sans que personne ne puisse la valider (§5.5), et un avis
-- signalé par un propriétaire (§7.2) n'était arbitré par personne.
--
-- Le contrôle de rôle est ici, pas dans l'application : les fonctions sont
-- `SECURITY DEFINER` et vérifient `is_admin()` avant d'agir. Un client
-- modifié ne peut donc pas valider sa propre salle.
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select exists (select 1 from users where id = auth.uid() and role = 'admin');
$$;

-- Trace des décisions d'arbitrage, pour qu'un signalement abusif reste visible
alter table reviews add column if not exists moderated_at timestamptz;

-- ── Lecture ───────────────────────────────────────────────────────────────

-- Un administrateur voit toutes les salles, y compris celles en attente.
drop policy if exists salles_select_admin on salles;
create policy salles_select_admin on salles for select using (is_admin());

drop policy if exists salles_update_admin on salles;
create policy salles_update_admin on salles for update using (is_admin());

drop policy if exists reviews_select_admin on reviews;
create policy reviews_select_admin on reviews for select using (is_admin());

drop policy if exists users_select_admin on users;
create policy users_select_admin on users for select using (is_admin());

-- ── Chiffres de la plateforme ─────────────────────────────────────────────

create or replace function admin_overview()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
    if not is_admin() then raise exception 'FORBIDDEN'; end if;

    return jsonb_build_object(
        'salles', jsonb_build_object(
            'active',  (select count(*) from salles where status = 'active'),
            'pending', (select count(*) from salles where status = 'pending')
        ),
        'users', jsonb_build_object(
            'total',   (select count(*) from users),
            'clients', (select count(*) from users where role = 'client'),
            'pros',    (select count(*) from users where role = 'pro')
        ),
        'reservations', jsonb_build_object(
            'total',     (select count(*) from reservations),
            'thisMonth', (select count(*) from reservations
                          where date_trunc('month', event_date) = date_trunc('month', current_date)),
            'confirmed', (select count(*) from reservations where status = 'confirmed')
        ),
        'reviews', jsonb_build_object(
            'total',   (select count(*) from reviews),
            'flagged', (select count(*) from reviews where status = 'flagged')
        ),
        'subscriptions', jsonb_build_object(
            'trial',  (select count(*) from subscriptions where status = 'trial'),
            'active', (select count(*) from subscriptions where status = 'active'),
            -- Revenu récurrent mensuel : seuls les abonnements payants comptent
            'mrr',    (select coalesce(sum(amount), 0) from subscriptions where status = 'active')
        )
    );
end;
$$;

-- ── Validation des salles (§5.5) ──────────────────────────────────────────

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

-- ── Arbitrage des avis signalés (§7.2) ────────────────────────────────────

create or replace function admin_resolve_review(p_review uuid, p_action text)
returns reviews
language plpgsql
security definer
set search_path = public
as $$
declare v_row reviews;
begin
    if not is_admin() then raise exception 'FORBIDDEN'; end if;
    if p_action not in ('restore', 'remove') then raise exception 'INVALID_ACTION'; end if;

    -- L'avis n'est jamais supprimé : seul son statut change, pour qu'un
    -- signalement abusif reste traçable.
    update reviews
       set status = case when p_action = 'restore' then 'approved' else 'rejected' end::review_status,
           moderated_at = now()
     where id = p_review
    returning * into v_row;

    if not found then raise exception 'REVIEW_NOT_FOUND'; end if;
    return v_row;
end;
$$;

do $$
begin
    if exists (select 1 from pg_roles where rolname = 'anon') then
        revoke execute on function admin_overview() from anon;
        revoke execute on function admin_review_salle(uuid, boolean) from anon;
        revoke execute on function admin_resolve_review(uuid, text) from anon;
    end if;
end $$;
