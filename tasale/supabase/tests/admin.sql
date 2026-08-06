-- Vérification de la console d'administration (0006_admin.sql).
-- Le point essentiel : un non-administrateur ne doit rien pouvoir faire,
-- même en appelant les fonctions directement.
-- Suppose que business_rules.sql a créé le jeu d'essai.

\set QUIET on
\pset tuples_only on

insert into auth.users (id) values ('99999999-9999-9999-9999-999999999999')
on conflict do nothing;

insert into users (id, phone, full_name, role) values
    ('99999999-9999-9999-9999-999999999999', '+213555000000', 'Équipe Tasalle', 'admin')
on conflict (id) do update set role = 'admin';

-- Une salle en attente de validation
insert into salles (id, owner_id, name, city, capacity_max, status)
values ('cccccccc-cccc-cccc-cccc-cccccccccccc',
        '11111111-1111-1111-1111-111111111111', 'Salle Ryad El Feth', 'Boumerdès', 260, 'pending')
on conflict (id) do update set status = 'pending';

-- Un avis signalé par le propriétaire
insert into reviews (id, client_id, salle_id, rating_overall, comment, status)
values ('dddddddd-dddd-dddd-dddd-dddddddddddd',
        '22222222-2222-2222-2222-222222222222',
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 1, 'Avis contesté', 'flagged')
on conflict (id) do update set status = 'flagged';

\pset tuples_only off
\set QUIET off

-- ── Le rôle décide, pas l'application ─────────────────────────────────────

set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';  -- un client

select 'A1 client non reconnu admin' as test, is_admin() = false as ok;

do $$
begin
    begin
        perform admin_overview();
        raise notice 'A2 chiffres refusés au client .... ÉCHEC (aucune erreur levée)';
    exception when others then
        raise notice 'A2 chiffres refusés au client .... %',
            case when sqlerrm = 'FORBIDDEN' then 'OK' else 'ÉCHEC (' || sqlerrm || ')' end;
    end;
end $$;

-- Le point critique : un pro ne doit pas pouvoir valider sa propre salle
set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';  -- le propriétaire

do $$
begin
    begin
        perform admin_review_salle('cccccccc-cccc-cccc-cccc-cccccccccccc', true);
        raise notice 'A3 auto-validation refusée ....... ÉCHEC (aucune erreur levée)';
    exception when others then
        raise notice 'A3 auto-validation refusée ....... %',
            case when sqlerrm = 'FORBIDDEN' then 'OK' else 'ÉCHEC (' || sqlerrm || ')' end;
    end;
end $$;

select 'A4 la salle est restée en attente' as test, status = 'pending' as ok
from salles where id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

-- ── Actions de l'administrateur ───────────────────────────────────────────

set request.jwt.claim.sub = '99999999-9999-9999-9999-999999999999';

select 'A5 admin reconnu' as test, is_admin() = true as ok;

select 'A6 chiffres complets' as test,
       (admin_overview() ?& array['salles','users','reservations','reviews','subscriptions']) as ok;

select 'A7 une salle en attente comptée' as test,
       (admin_overview() -> 'salles' ->> 'pending')::int >= 1 as ok;

select 'A8 validation de la salle' as test,
       (admin_review_salle('cccccccc-cccc-cccc-cccc-cccccccccccc', true)).status = 'active' as ok;

select 'A9 le propriétaire est prévenu' as test, count(*) = 1 as ok
from notifications where type = 'salle_approved';

-- ── Arbitrage des avis ────────────────────────────────────────────────────

select 'A10 avis restauré' as test,
       (admin_resolve_review('dddddddd-dddd-dddd-dddd-dddddddddddd', 'restore')).status = 'approved' as ok;

select 'A11 décision horodatée' as test, moderated_at is not null as ok
from reviews where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd';

select 'A12 avis retiré sans suppression' as test,
       (admin_resolve_review('dddddddd-dddd-dddd-dddd-dddddddddddd', 'remove')).status = 'rejected' as ok;

select 'A13 la ligne existe toujours' as test, count(*) = 1 as ok
from reviews where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd';

do $$
begin
    begin
        perform admin_resolve_review('dddddddd-dddd-dddd-dddd-dddddddddddd', 'supprimer');
        raise notice 'A14 action inconnue refusée ...... ÉCHEC (aucune erreur levée)';
    exception when others then
        raise notice 'A14 action inconnue refusée ...... %',
            case when sqlerrm = 'INVALID_ACTION' then 'OK' else 'ÉCHEC (' || sqlerrm || ')' end;
    end;
end $$;
