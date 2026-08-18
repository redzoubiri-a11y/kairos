-- Vérification du multi-salles (0008_multi_salles.sql).
-- Suppose que business_rules.sql a créé le jeu d'essai.

\set QUIET on
\pset tuples_only on

-- Une seconde salle pour le même propriétaire
insert into salles (id, owner_id, name, city, capacity_max, status, created_at)
values ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
        '11111111-1111-1111-1111-111111111111', 'Espace Andalous', 'Alger', 300, 'active',
        now() + interval '1 day')
on conflict (id) do update set owner_id = '11111111-1111-1111-1111-111111111111';

-- Une salle appartenant à quelqu'un d'autre
insert into auth.users (id) values ('88888888-8888-8888-8888-888888888888') on conflict do nothing;
insert into users (id, phone, full_name, role)
values ('88888888-8888-8888-8888-888888888888', '+213555100099', 'Autre Pro', 'pro')
on conflict (id) do nothing;

insert into salles (id, owner_id, name, city, capacity_max, status)
values ('ffffffff-ffff-ffff-ffff-ffffffffffff',
        '88888888-8888-8888-8888-888888888888', 'Salle Concurrente', 'Oran', 400, 'active')
on conflict (id) do update set owner_id = '88888888-8888-8888-8888-888888888888';

\pset tuples_only off
\set QUIET off

set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

-- ── Résolution de la salle ────────────────────────────────────────────────

select 'M1 sans identifiant → première salle' as test,
       my_salle() = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' as ok;

select 'M2 salle désignée acceptée' as test,
       my_salle('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee')
       = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee' as ok;

-- Le point qui compte : la salle d'un autre est inaccessible
do $$
begin
    begin
        perform my_salle('ffffffff-ffff-ffff-ffff-ffffffffffff');
        raise notice 'M3 salle d''autrui refusée ........ ÉCHEC (aucune erreur levée)';
    exception when others then
        raise notice 'M3 salle d''autrui refusée ........ %',
            case when sqlerrm = 'FORBIDDEN' then 'OK' else 'ÉCHEC (' || sqlerrm || ')' end;
    end;
end $$;

do $$
begin
    begin
        perform pro_dashboard('ffffffff-ffff-ffff-ffff-ffffffffffff');
        raise notice 'M4 tableau de bord d''autrui refusé  ÉCHEC (aucune erreur levée)';
    exception when others then
        raise notice 'M4 tableau de bord d''autrui refusé  %',
            case when sqlerrm = 'FORBIDDEN' then 'OK' else 'ÉCHEC (' || sqlerrm || ')' end;
    end;
end $$;

-- ── Agrégats séparés par salle ────────────────────────────────────────────

select 'M5 tableau de bord de la salle désignée' as test,
       (pro_dashboard('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee') -> 'salle' ->> 'name')
       = 'Espace Andalous' as ok;

select 'M6 réservations non mélangées' as test,
       (pro_dashboard('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee') ->> 'pendingCount')::int = 0 as ok;

select 'M7 statistiques par salle' as test,
       jsonb_array_length(pro_stats('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee') -> 'occupancy') = 6 as ok;

-- ── Facturation par propriétaire ──────────────────────────────────────────

select 'M8 un seul abonnement par propriétaire' as test, count(*) = 1 as ok
from subscriptions where pro_id = '11111111-1111-1111-1111-111111111111';

select 'M9 l''essai est partagé par les deux salles' as test,
       (pro_dashboard('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa') ->> 'trialDaysLeft')
       = (pro_dashboard('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee') ->> 'trialDaysLeft') as ok;

-- Un second abonnement pour le même pro doit être impossible
do $$
begin
    begin
        insert into subscriptions (pro_id, salle_id, trial_ends_at)
        values ('11111111-1111-1111-1111-111111111111',
                'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', current_date + 90);
        raise notice 'M10 double abonnement refusé ...... ÉCHEC (insertion acceptée)';
    exception when unique_violation then
        raise notice 'M10 double abonnement refusé ...... OK';
    when others then
        raise notice 'M10 double abonnement refusé ...... ÉCHEC (%)', sqlerrm;
    end;
end $$;
