-- Vérification des règles métier §10 directement en base.
-- Exécution : psql -d mawsim -v ON_ERROR_STOP=1 -f supabase/tests/business_rules.sql
--
-- Ces règles doivent tenir côté serveur : un client modifié ne doit pas
-- pouvoir confirmer deux réservations le même jour ni signer sans le bon PIN.

\set QUIET on
\pset tuples_only on

-- ── Jeu d'essai ───────────────────────────────────────────────────────────

insert into auth.users (id) values
    ('11111111-1111-1111-1111-111111111111'),  -- pro
    ('22222222-2222-2222-2222-222222222222'),  -- client A
    ('33333333-3333-3333-3333-333333333333');  -- client B

insert into users (id, phone, full_name, role) values
    ('11111111-1111-1111-1111-111111111111', '+213555100001', 'Karim Belkacem', 'pro'),
    ('22222222-2222-2222-2222-222222222222', '+213661234567', 'Amina Cherif', 'client'),
    ('33333333-3333-3333-3333-333333333333', '+213770998877', 'Yacine Haddad', 'client');

insert into salles (id, owner_id, name, city, capacity_max, status)
values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        '11111111-1111-1111-1111-111111111111', 'Salle El Widad', 'Alger', 450, 'active');

insert into tarifs (id, salle_id, name, price, sort_order)
values ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Location salle seule', 35000, 0);

insert into subscriptions (pro_id, salle_id, trial_ends_at)
values ('11111111-1111-1111-1111-111111111111',
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', current_date + 90);

\pset tuples_only off
\set QUIET off

-- ── 1. Création d'une demande (§9.3) ──────────────────────────────────────

set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';

select 'T1 référence générée' as test,
       (create_reservation(
           'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', current_date + 30, 'mariage',
           320, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Amina Cherif',
           '+213661234567', 'Décoration blanc et doré')).reference ~ '^MAW-\d{4}-\d{4}$'
       as ok;

-- Les deux notifications (client + pro) doivent exister
select 'T2 notifications créées' as test, count(*) = 2 as ok
from notifications where type in ('reservation_sent', 'reservation_new');

-- ── 2. Une demande en attente réserve le jour 48 h (§10.1) ────────────────

select 'T3 jour en attente' as test, state = 'held' as ok
from salle_availability('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
                        current_date + 30, current_date + 30);

select 'T4 jours passés grisés' as test, state = 'past' as ok
from salle_availability('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
                        current_date - 1, current_date - 1);

-- ── 3. Signature PIN (§10.1) ──────────────────────────────────────────────

set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
select set_pro_pin('1234');

-- Un PIN erroné doit être rejeté
do $$
declare v_id uuid;
begin
    select id into v_id from reservations limit 1;
    begin
        perform pro_confirm_reservation(v_id, 12000, '00214587', '9999');
        raise notice 'T5 PIN erroné rejeté ....... ÉCHEC (aucune erreur levée)';
    exception when others then
        if sqlerrm = 'WRONG_PIN' then
            raise notice 'T5 PIN erroné rejeté ....... OK';
        else
            raise notice 'T5 PIN erroné rejeté ....... ÉCHEC (%)', sqlerrm;
        end if;
    end;
end $$;

-- Le bon PIN confirme et horodate la signature
do $$
declare v_id uuid; v_row reservations;
begin
    select id into v_id from reservations limit 1;
    v_row := pro_confirm_reservation(v_id, 12000, '00214587', '1234');
    if v_row.status = 'confirmed' and v_row.signed_at is not null then
        raise notice 'T6 confirmation signée ..... OK';
    else
        raise notice 'T6 confirmation signée ..... ÉCHEC';
    end if;
end $$;

select 'T7 acompte notifié' as test, count(*) = 1 as ok
from notifications where type = 'deposit_requested';

select 'T8 jour désormais réservé' as test, state = 'booked' as ok
from salle_availability('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
                        current_date + 30, current_date + 30);

-- ── 4. Une seule réservation confirmée par jour (§10.1) ───────────────────

set request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';

do $$
begin
    begin
        perform create_reservation(
            'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', current_date + 30, 'fiancailles',
            180, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Yacine Haddad',
            '+213770998877', '');
        raise notice 'T9 jour déjà pris refusé ... ÉCHEC (aucune erreur levée)';
    exception when others then
        if sqlerrm = 'DAY_TAKEN' then
            raise notice 'T9 jour déjà pris refusé ... OK';
        else
            raise notice 'T9 jour déjà pris refusé ... ÉCHEC (%)', sqlerrm;
        end if;
    end;
end $$;

-- ── 5. Délai de 48 h avant dépôt d'un avis (§10.2) ────────────────────────

set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';

do $$
declare v_id uuid;
begin
    select id into v_id from reservations limit 1;
    begin
        perform create_review(v_id, 5, 5, 5, 5, 5, 'Parfait', '[]'::jsonb);
        raise notice 'T10 avis trop tôt refusé .... ÉCHEC (aucune erreur levée)';
    exception when others then
        if sqlerrm = 'TOO_EARLY' then
            raise notice 'T10 avis trop tôt refusé .... OK';
        else
            raise notice 'T10 avis trop tôt refusé .... ÉCHEC (%)', sqlerrm;
        end if;
    end;
end $$;

-- Un événement passé et terminé autorise l'avis, avec badge « client confirmé »
do $$
declare v_id uuid; v_row reviews;
begin
    update reservations set event_date = current_date - 5, status = 'completed'
    where id = (select id from reservations limit 1)
    returning id into v_id;

    v_row := create_review(v_id, 5, 5, 4, 5, 4, 'Une soirée parfaite.', '[]'::jsonb);
    if v_row.is_verified and v_row.status = 'pending' then
        raise notice 'T11 avis vérifié en attente . OK';
    else
        raise notice 'T11 avis vérifié en attente . ÉCHEC';
    end if;
end $$;

-- ── 6. Publication automatique après 24 h (§10.2) ─────────────────────────

select 'T12 avis masqué avant 24 h' as test, count(*) = 0 as ok from reviews_public;

update reviews set created_at = now() - interval '25 hours';
select 'T13 publication auto 24 h' as test, count(*) = 1 as ok from reviews_public;

-- La note publique de la salle reflète l'avis publié
select 'T14 note salle recalculée' as test, rating = 5.0 as ok
from salles_public where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

-- ── 7. Agrégats du tableau de bord (§9.7) ─────────────────────────────────

set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

select 'T15 dashboard complet' as test,
       (pro_dashboard() ? 'kpis')
   and (pro_dashboard() ? 'revenueSeries')
   and jsonb_array_length(pro_dashboard() -> 'revenueSeries') = 6 as ok;

select 'T16 stats complètes' as test,
       (pro_stats() ? 'eventTypes') and (pro_stats() ? 'occupancy')
   and jsonb_array_length(pro_stats() -> 'occupancy') = 6 as ok;

-- ── 8. Un pro ne peut pas supprimer un avis (§10.2) ───────────────────────

select 'T17 pas de policy DELETE sur reviews' as test,
       count(*) = 0 as ok
from pg_policies
where tablename = 'reviews' and cmd = 'DELETE';
