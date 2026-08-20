-- ═══════════════════════════════════════════════════════════════════════════
-- Tasalle — traiteurs et halouadjis, deux verticales partenaires (§13)
--
-- En Algérie, la salle, le traiteur et le halouadji (pâtissier traditionnel)
-- sont le plus souvent trois prestataires distincts, réservés séparément.
-- Deux nouvelles tables sœurs de `salles` plutôt qu'une table `listings`
-- polymorphe : le schéma existant (RLS, RPCs, vues) est nommé et câblé
-- spécifiquement pour « salle », et le reprendre en profondeur pour deux
-- verticales aurait un risque disproportionné par rapport au gain.
--
-- Contrairement aux salles, pas de réservation à date bloquée : le prix
-- dépend du menu/du nombre d'invités, négocié au cas par cas. Le client
-- envoie une demande de devis (`devis_requests`), le pro répond.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Traiteurs ─────────────────────────────────────────────────────────────

create table traiteurs (
    id          uuid primary key default gen_random_uuid(),
    owner_id    uuid not null references users(id) on delete cascade,
    name        varchar(255) not null,
    city        varchar(100) not null,
    description text,
    specialites jsonb not null default '[]',
    prix_min    numeric(10,2) check (prix_min >= 0),
    prix_max    numeric(10,2) check (prix_max >= 0),
    photos      jsonb not null default '[]',
    status      salle_status default 'pending',
    is_premium  boolean default false,
    created_at  timestamptz default now(),
    constraint traiteurs_prix_coherent check (prix_max is null or prix_min is null or prix_max >= prix_min)
);

-- ── Halouadjis ────────────────────────────────────────────────────────────
-- Même forme que `traiteurs` — dupliquée plutôt que factorisée : deux
-- verticales ne justifient pas encore une table `listings` générique.

create table halouadjis (
    id          uuid primary key default gen_random_uuid(),
    owner_id    uuid not null references users(id) on delete cascade,
    name        varchar(255) not null,
    city        varchar(100) not null,
    description text,
    specialites jsonb not null default '[]',
    prix_min    numeric(10,2) check (prix_min >= 0),
    prix_max    numeric(10,2) check (prix_max >= 0),
    photos      jsonb not null default '[]',
    status      salle_status default 'pending',
    is_premium  boolean default false,
    created_at  timestamptz default now(),
    constraint halouadjis_prix_coherent check (prix_max is null or prix_min is null or prix_max >= prix_min)
);

-- ── Demandes de devis ─────────────────────────────────────────────────────
-- Partagée par les deux verticales : exactement une des deux clés étrangères
-- est renseignée (contrainte ci-dessous), jamais les deux — préféré à un
-- couple libre (partner_type, partner_id) pour garder une vraie intégrité
-- référentielle plutôt qu'une convention non vérifiable par Postgres.

create table devis_requests (
    id            uuid primary key default gen_random_uuid(),
    client_id     uuid not null references users(id) on delete cascade,
    traiteur_id   uuid references traiteurs(id) on delete cascade,
    halouadji_id  uuid references halouadjis(id) on delete cascade,
    event_date    date,
    guest_count   int check (guest_count >= 0),
    message       text,
    status        varchar(20) not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
    pro_reply     text,
    created_at    timestamptz default now(),
    responded_at  timestamptz,
    constraint devis_requests_exactly_one_partner check (
        (traiteur_id is not null)::int + (halouadji_id is not null)::int = 1
    )
);

create index devis_requests_traiteur_idx  on devis_requests (traiteur_id)  where traiteur_id is not null;
create index devis_requests_halouadji_idx on devis_requests (halouadji_id) where halouadji_id is not null;
create index devis_requests_client_idx    on devis_requests (client_id);

-- ── L'abonnement suit déjà le propriétaire, pas la salle (§12 Phase 4) ────
-- `subscriptions.salle_id` est déjà nullable et l'unicité déjà par `pro_id`
-- (0008_multi_salles.sql) : un traiteur/halouadji réutilise directement la
-- même table d'abonnement, `salle_id` restant simplement null.

-- ── RLS ───────────────────────────────────────────────────────────────────

alter table traiteurs enable row level security;
alter table halouadjis enable row level security;
alter table devis_requests enable row level security;

create policy traiteurs_select_public on traiteurs for select
    using (status = 'active' or owner_id = auth.uid());
create policy traiteurs_insert_owner on traiteurs for insert with check (owner_id = auth.uid());
create policy traiteurs_update_owner on traiteurs for update using (owner_id = auth.uid());
create policy traiteurs_delete_owner on traiteurs for delete using (owner_id = auth.uid());
create policy traiteurs_select_admin on traiteurs for select using (is_admin());
create policy traiteurs_update_admin on traiteurs for update using (is_admin());

create policy halouadjis_select_public on halouadjis for select
    using (status = 'active' or owner_id = auth.uid());
create policy halouadjis_insert_owner on halouadjis for insert with check (owner_id = auth.uid());
create policy halouadjis_update_owner on halouadjis for update using (owner_id = auth.uid());
create policy halouadjis_delete_owner on halouadjis for delete using (owner_id = auth.uid());
create policy halouadjis_select_admin on halouadjis for select using (is_admin());
create policy halouadjis_update_admin on halouadjis for update using (is_admin());

-- Le client voit ses propres demandes ; le pro voit celles adressées à sa
-- fiche (sous-requête sur la table dont la FK est renseignée).
create policy devis_requests_select on devis_requests for select using (
    client_id = auth.uid()
    or exists (select 1 from traiteurs t where t.id = traiteur_id and t.owner_id = auth.uid())
    or exists (select 1 from halouadjis h where h.id = halouadji_id and h.owner_id = auth.uid())
    or is_admin()
);
create policy devis_requests_insert_client on devis_requests for insert with check (client_id = auth.uid());
-- La mise à jour (réponse) passe par la RPC `respond_devis_request`
-- (SECURITY DEFINER) plutôt que par une policy update directe : elle doit
-- aussi horodater `responded_at` et notifier le client en une transaction.

-- ── RPCs ──────────────────────────────────────────────────────────────────

create or replace function respond_devis_request(p_id uuid, p_status text, p_reply text default null)
returns devis_requests
language plpgsql
security definer
set search_path = public
as $$
declare
    v_row devis_requests;
    v_is_owner boolean;
begin
    if p_status not in ('accepted', 'declined') then raise exception 'INVALID_STATUS'; end if;

    select
        exists (select 1 from traiteurs t where t.id = d.traiteur_id and t.owner_id = auth.uid())
        or exists (select 1 from halouadjis h where h.id = d.halouadji_id and h.owner_id = auth.uid())
    into v_is_owner
    from devis_requests d where d.id = p_id;

    if not coalesce(v_is_owner, false) then raise exception 'FORBIDDEN'; end if;

    update devis_requests
       set status = p_status, pro_reply = p_reply, responded_at = now()
     where id = p_id and status = 'pending'
    returning * into v_row;

    if not found then raise exception 'DEVIS_NOT_FOUND_OR_ALREADY_ANSWERED'; end if;

    insert into notifications (user_id, type, title, body, data, channel, sent_at)
    values (
        v_row.client_id,
        case when p_status = 'accepted' then 'devis_accepted' else 'devis_declined' end,
        case when p_status = 'accepted' then 'Devis accepté' else 'Devis refusé' end,
        coalesce(p_reply, case when p_status = 'accepted'
            then 'Le professionnel a accepté votre demande de devis.'
            else 'Le professionnel n''a pas pu donner suite à votre demande.' end),
        jsonb_build_object('devis_id', v_row.id), 'push', now()
    );

    return v_row;
end;
$$;

-- Notifie le pro dès qu'une demande arrive — évite qu'elle passe inaperçue
-- jusqu'à sa prochaine ouverture du tableau de bord.
create or replace function notify_new_devis_request()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare v_owner uuid; v_partner_name text;
begin
    if new.traiteur_id is not null then
        select owner_id, name into v_owner, v_partner_name from traiteurs where id = new.traiteur_id;
    else
        select owner_id, name into v_owner, v_partner_name from halouadjis where id = new.halouadji_id;
    end if;

    insert into notifications (user_id, type, title, body, data, channel, sent_at)
    values (
        v_owner, 'new_devis_request', 'Nouvelle demande de devis',
        'Une nouvelle demande vous attend.',
        jsonb_build_object('devis_id', new.id), 'push', now()
    );
    return new;
end;
$$;

create trigger devis_requests_notify_owner
    after insert on devis_requests
    for each row execute function notify_new_devis_request();

-- Généralise `admin_review_salle` (0006_admin.sql) aux deux nouvelles
-- verticales plutôt que de dupliquer la fonction deux fois.
create or replace function admin_review_partner(p_type text, p_id uuid, p_approved boolean)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare v_owner uuid; v_name text; v_new_status text;
begin
    if not is_admin() then raise exception 'FORBIDDEN'; end if;
    if p_type not in ('traiteur', 'halouadji') then raise exception 'INVALID_TYPE'; end if;

    v_new_status := case when p_approved then 'active' else 'inactive' end;

    if p_type = 'traiteur' then
        update traiteurs set status = v_new_status::salle_status where id = p_id
        returning owner_id, name into v_owner, v_name;
    else
        update halouadjis set status = v_new_status::salle_status where id = p_id
        returning owner_id, name into v_owner, v_name;
    end if;

    if v_owner is null then raise exception 'PARTNER_NOT_FOUND'; end if;

    insert into notifications (user_id, type, title, body, data, channel, sent_at)
    values (
        v_owner,
        case when p_approved then 'partner_approved' else 'partner_rejected' end,
        case when p_approved then 'Votre fiche est en ligne'
             else 'Votre fiche n''a pas été validée' end,
        case when p_approved
             then v_name || ' est désormais visible par les familles.'
             else v_name || ' n''a pas pu être validée. Contactez le support.' end,
        jsonb_build_object('partner_type', p_type, 'partner_id', p_id), 'push', now()
    );

    return jsonb_build_object('id', p_id, 'type', p_type, 'status', v_new_status);
end;
$$;

do $$
begin
    if exists (select 1 from pg_roles where rolname = 'anon') then
        revoke execute on function respond_devis_request(uuid, text, text) from anon;
        revoke execute on function admin_review_partner(text, uuid, boolean) from anon;
    end if;
end $$;
