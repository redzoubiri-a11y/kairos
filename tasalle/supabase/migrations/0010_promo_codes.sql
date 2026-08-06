-- ═══════════════════════════════════════════════════════════════════════════
-- Tasalle — codes promotionnels (§12 Phase 4)
--
-- Un propriétaire crée des codes pour ses propres salles ; une famille en
-- saisit un au moment de la demande et la remise s'applique au total.
--
-- Les règles sont réappliquées ici, et non seulement dans l'application : le
-- calcul de la remise et la consommation du quota se font dans la fonction
-- `SECURITY DEFINER`, jamais d'après un montant envoyé par le client.
-- ═══════════════════════════════════════════════════════════════════════════

create type promo_kind as enum ('percent', 'amount');

create table promo_codes (
    id          uuid primary key default gen_random_uuid(),
    salle_id    uuid not null references salles(id) on delete cascade,
    code        varchar(24) not null,
    kind        promo_kind not null,
    value       int not null check (value > 0),
    starts_on   date,
    ends_on     date,
    -- Nul = illimité.
    max_uses    int check (max_uses is null or max_uses >= 1),
    used_count  int not null default 0 check (used_count >= 0),
    active      boolean not null default true,
    created_at  timestamptz not null default now(),

    constraint promo_percent_max check (kind <> 'percent' or value <= 100),
    constraint promo_dates_ordered check (starts_on is null or ends_on is null or ends_on >= starts_on)
);

-- Deux salles peuvent porter le même code ; une seule fois chacune. La casse
-- est ignorée, comme à la saisie.
create unique index uniq_promo_par_salle on promo_codes (salle_id, upper(code));
create index idx_promo_salle on promo_codes (salle_id) where active;

alter table reservations add column if not exists promo_code_id uuid references promo_codes(id) on delete set null;
alter table reservations add column if not exists discount_amount numeric(10,2) not null default 0;

comment on column reservations.discount_amount is
    'Remise accordée. `total_amount` porte déjà le montant net à régler.';

-- ── Lecture ───────────────────────────────────────────────────────────────

alter table promo_codes enable row level security;

-- Le propriétaire gère les codes de ses salles.
create policy promo_owner on promo_codes for all
    using (exists (select 1 from salles s where s.id = promo_codes.salle_id and s.owner_id = auth.uid()))
    with check (exists (select 1 from salles s where s.id = promo_codes.salle_id and s.owner_id = auth.uid()));

-- Aucune policy de lecture pour les clients : un code ne se découvre pas en
-- listant la table, il se saisit. La vérification passe par la fonction
-- ci-dessous, qui ne révèle rien d'autre que le verdict.

-- ── Vérification ──────────────────────────────────────────────────────────

/**
 * Remise accordée par un code, ou NULL si le code ne s'applique pas.
 * Fonction interne : ne vérifie pas l'appelant, seulement les règles.
 */
create or replace function promo_discount(p_promo promo_codes, p_amount numeric)
returns numeric
language sql
immutable
as $$
    select least(
        greatest(
            case when p_promo.kind = 'percent'
                 then round(greatest(p_amount, 0) * p_promo.value / 100.0)
                 else round(p_promo.value) end,
            0),
        greatest(p_amount, 0)
    );
$$;

/**
 * Verdict sur un code saisi par un client, sans rien consommer.
 *
 * Rend { ok, reason, discount, total }. Les raisons sont les mêmes
 * identifiants que côté application, pour que les deux backends donnent le
 * même message.
 */
create or replace function check_promo_code(p_salle uuid, p_code text, p_amount numeric)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
    v_promo    promo_codes;
    v_discount numeric;
begin
    if auth.uid() is null then raise exception 'NOT_AUTHENTICATED'; end if;

    select * into v_promo from promo_codes
    where salle_id = p_salle and upper(code) = upper(trim(p_code));

    if not found then return jsonb_build_object('ok', false, 'reason', 'unknown'); end if;
    if not v_promo.active then return jsonb_build_object('ok', false, 'reason', 'inactive'); end if;

    if v_promo.starts_on is not null and current_date < v_promo.starts_on then
        return jsonb_build_object('ok', false, 'reason', 'not_started');
    end if;
    if v_promo.ends_on is not null and current_date > v_promo.ends_on then
        return jsonb_build_object('ok', false, 'reason', 'expired');
    end if;
    if v_promo.max_uses is not null and v_promo.used_count >= v_promo.max_uses then
        return jsonb_build_object('ok', false, 'reason', 'exhausted');
    end if;

    v_discount := promo_discount(v_promo, p_amount);

    -- Un code sans effet passerait pour une panne à l'écran.
    if v_discount <= 0 then return jsonb_build_object('ok', false, 'reason', 'no_effect'); end if;

    return jsonb_build_object(
        'ok', true, 'code', v_promo.code, 'kind', v_promo.kind::text,
        'value', v_promo.value, 'discount', v_discount,
        'total', greatest(p_amount - v_discount, 0)
    );
end;
$$;

-- ── Création d'une demande, avec code facultatif ──────────────────────────

-- La signature gagne un paramètre : l'ancienne est remplacée.
drop function if exists create_reservation(uuid, date, event_type, int, uuid, text, text, text);

create or replace function create_reservation(
    p_salle uuid, p_event_date date, p_event_type event_type,
    p_guest_count int, p_formula uuid, p_client_name text,
    p_client_phone text, p_message text, p_promo_code text default null
)
returns reservations
language plpgsql
security definer
set search_path = public
as $$
declare
    v_row      reservations;
    v_price    numeric(10,2);
    v_salle    salles;
    v_promo    promo_codes;
    v_discount numeric := 0;
    v_verdict  jsonb;
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

    -- Le code est revérifié ici, jamais repris tel que l'écran l'a calculé :
    -- entre la saisie et l'envoi, le quota a pu être épuisé par un autre.
    if p_promo_code is not null and length(trim(p_promo_code)) > 0 then
        v_verdict := check_promo_code(p_salle, p_promo_code, v_price);
        if not (v_verdict ->> 'ok')::boolean then
            raise exception 'PROMO_REFUSED: %', v_verdict ->> 'reason';
        end if;

        -- `for update` sérialise deux demandes simultanées sur la dernière
        -- utilisation disponible : sans lui, les deux passeraient.
        select * into v_promo from promo_codes
        where salle_id = p_salle and upper(code) = upper(trim(p_promo_code))
        for update;

        if v_promo.max_uses is not null and v_promo.used_count >= v_promo.max_uses then
            raise exception 'PROMO_REFUSED: exhausted';
        end if;

        v_discount := (v_verdict ->> 'discount')::numeric;
        update promo_codes set used_count = used_count + 1 where id = v_promo.id;
    end if;

    insert into reservations (
        reference, client_id, client_name, client_phone, salle_id,
        event_date, event_type, guest_count, formula_id, total_amount,
        client_message, promo_code_id, discount_amount
    ) values (
        next_reference(), auth.uid(), p_client_name, p_client_phone, p_salle,
        p_event_date, p_event_type, p_guest_count, p_formula,
        coalesce(v_price, 0) - v_discount, p_message, v_promo.id, v_discount
    ) returning * into v_row;

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

-- ── Restitution du quota à l'annulation ───────────────────────────────────

/**
 * Rend l'utilisation consommée par une demande annulée.
 *
 * Sans cela, quelques demandes créées puis annulées épuiseraient un code pour
 * tout le monde. Le déclencheur couvre les deux chemins d'annulation, client
 * et propriétaire, plutôt que de dupliquer la règle dans chacun.
 */
create or replace function promo_release_on_cancel()
returns trigger
language plpgsql
as $$
begin
    if new.status = 'cancelled' and old.status <> 'cancelled' and new.promo_code_id is not null then
        update promo_codes
           set used_count = greatest(used_count - 1, 0)
         where id = new.promo_code_id;
    end if;
    return new;
end;
$$;

drop trigger if exists trg_promo_release on reservations;
create trigger trg_promo_release
    after update of status on reservations
    for each row execute function promo_release_on_cancel();

grant execute on function check_promo_code(uuid, text, numeric) to authenticated;
