-- Vérification des tâches de cycle de vie (0002_lifecycle.sql).
-- Exécution : psql -d tasale -v ON_ERROR_STOP=1 -f supabase/tests/lifecycle.sql
-- Suppose que business_rules.sql a déjà créé le jeu d'essai.

\set QUIET on
\pset tuples_only on

-- Une réservation confirmée hier, une autre demain, une terminée il y a 5 jours
insert into auth.users (id) values ('44444444-4444-4444-4444-444444444444')
on conflict do nothing;

insert into users (id, phone, full_name, role) values
    ('44444444-4444-4444-4444-444444444444', '+213555999888', 'Test Cycle', 'client')
on conflict do nothing;

insert into reservations (reference, client_id, client_name, salle_id, event_date,
                          event_type, guest_count, total_amount, status)
values
    ('TAS-2026-9001', '44444444-4444-4444-4444-444444444444', 'Test Cycle',
     'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', current_date - 1, 'mariage', 100, 50000, 'confirmed'),
    ('TAS-2026-9002', '44444444-4444-4444-4444-444444444444', 'Test Cycle',
     'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', current_date + 1, 'anniversaire', 50, 30000, 'confirmed'),
    ('TAS-2026-9003', '44444444-4444-4444-4444-444444444444', 'Test Cycle',
     'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', current_date - 5, 'fiancailles', 80, 40000, 'confirmed');

\pset tuples_only off
\set QUIET off

-- ── Clôture des événements passés ─────────────────────────────────────────

select 'L1 clôture des dates passées' as test, close_past_reservations() = 2 as ok;

select 'L2 l''événement à venir est intact' as test, status = 'confirmed' as ok
from reservations where reference = 'TAS-2026-9002';

select 'L3 relance sans effet (idempotence)' as test, close_past_reservations() = 0 as ok;

-- ── Rappel J-1 ────────────────────────────────────────────────────────────

select 'L4 rappel pour demain' as test, send_event_reminders() = 1 as ok;
select 'L5 pas de rappel en double' as test, send_event_reminders() = 0 as ok;

-- ── Demande d'avis à J+48 h ───────────────────────────────────────────────

-- Seule TAS-2026-9003 (il y a 5 jours) remplit le délai ; celle d'hier est trop récente
select 'L6 demande d''avis après 48 h' as test, request_pending_reviews() = 1 as ok;
select 'L7 pas de relance d''avis' as test, request_pending_reviews() = 0 as ok;

select 'L8 la bonne réservation est ciblée' as test,
       (data ->> 'reservation_id')::uuid =
       (select id from reservations where reference = 'TAS-2026-9003') as ok
from notifications where type = 'review_request';

-- Une réservation déjà évaluée ne redemande pas d'avis
insert into reviews (reservation_id, client_id, salle_id, rating_overall, status)
select id, client_id, salle_id, 5, 'approved'
from reservations where reference = 'TAS-2026-9001';

update reservations set event_date = current_date - 5 where reference = 'TAS-2026-9001';
select 'L9 avis déjà déposé, pas de relance' as test, request_pending_reviews() = 0 as ok;

-- ── Essais gratuits ───────────────────────────────────────────────────────

update subscriptions set trial_ends_at = current_date + 7
where salle_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

select 'L10 rappel à J-7' as test, reminded = 1 as ok from process_trial_subscriptions();
select 'L11 pas de rappel en double' as test, reminded = 0 as ok from process_trial_subscriptions();

update subscriptions set trial_ends_at = current_date + 3
where salle_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
select 'L12 nouveau rappel à J-3' as test, reminded = 1 as ok from process_trial_subscriptions();

-- Essai échu sans moyen de paiement → expiré
update subscriptions set trial_ends_at = current_date - 1, payment_method = null
where salle_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
select 'L13 essai échu expiré' as test, expired = 1 as ok from process_trial_subscriptions();

-- Essai échu avec moyen de paiement → abonnement actif
update subscriptions set status = 'trial', trial_ends_at = current_date - 1,
                         payment_method = 'ccp'
where salle_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
select 'L14 essai payé devient actif' as test, expired = 0 as ok
from process_trial_subscriptions();

select 'L15 période de facturation ouverte' as test,
       status = 'active' and current_period_end = current_date + 30 as ok
from subscriptions where salle_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

-- ── Orchestration ─────────────────────────────────────────────────────────

select 'L16 maintenance quotidienne complète' as test,
       (run_daily_maintenance() ?& array['closed','reminders','review_requests','trials_expired','ran_at']) as ok;
