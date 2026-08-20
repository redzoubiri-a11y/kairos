-- Vérification du parrainage (0011_referrals.sql).
-- Suppose que business_rules.sql a créé le jeu d'essai.
--
-- L'enjeu : la récompense est versée par la base, à la validation par un
-- administrateur, une seule fois, et plafonnée.

\set QUIET on
\pset tuples_only on

-- Un parrain (le pro existant), un filleul, un administrateur.
insert into auth.users (id) values
    ('77777777-7777-7777-7777-777777777777'),
    ('66666666-6666-6666-6666-666666666666')
on conflict do nothing;

insert into users (id, phone, full_name, role, referral_code) values
    ('77777777-7777-7777-7777-777777777777', '+213555100077', 'Filleul Test', 'pro', 'FIL777'),
    ('66666666-6666-6666-6666-666666666666', '+213555000066', 'Admin Test', 'admin', null)
on conflict (id) do nothing;

update users set referral_code = 'PAR111'
where id = '11111111-1111-1111-1111-111111111111';

insert into salles (id, owner_id, name, city, capacity_max, status)
values ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeee77',
        '77777777-7777-7777-7777-777777777777', 'Salle du filleul', 'Alger', 200, 'pending')
on conflict (id) do update set status = 'pending';

insert into subscriptions (pro_id, trial_ends_at)
values ('77777777-7777-7777-7777-777777777777', current_date + 90)
on conflict (pro_id) do update set trial_ends_at = current_date + 90;

update subscriptions set trial_ends_at = current_date + 45, current_period_end = null
where pro_id = '11111111-1111-1111-1111-111111111111';

delete from referrals;

\pset tuples_only off
\set QUIET off

-- ── Verdicts ──────────────────────────────────────────────────────────────

set request.jwt.claim.sub = '77777777-7777-7777-7777-777777777777';

select 'R1 code valide accepté' as test,
       (check_referral_code('PAR111') ->> 'ok')::boolean
   and check_referral_code('PAR111') ->> 'referrer_name' = 'Karim Belkacem' as ok;

select 'R2 saisie normalisée' as test,
       (check_referral_code(' par-111 ') ->> 'ok')::boolean as ok;

select 'R3 code inconnu refusé' as test,
       check_referral_code('ZZZZZZ') ->> 'reason' = 'unknown' as ok;

-- Le contournement le plus évident : doubler son propre essai
select 'R4 auto-parrainage refusé' as test,
       check_referral_code('FIL777') ->> 'reason' = 'self' as ok;

-- ── Nouage du lien, puis récompense ───────────────────────────────────────

do $$
declare v_lien referrals;
begin
    v_lien := attach_referral('PAR111');
    if v_lien.status = 'pending' and v_lien.days_granted = 0 then
        raise notice 'R5 lien noué en attente ......... OK';
    else
        raise notice 'R5 lien noué en attente ......... ÉCHEC (% / %)', v_lien.status, v_lien.days_granted;
    end if;
end $$;

select 'R6 second parrainage refusé' as test,
       check_referral_code('PAR111') ->> 'reason' = 'already_referred' as ok;

-- Tant que la salle n'est pas validée, rien n'est versé
select 'R7 rien avant validation' as test,
       (select trial_ends_at from subscriptions where pro_id = '11111111-1111-1111-1111-111111111111')
       = current_date + 45 as ok;

set request.jwt.claim.sub = '66666666-6666-6666-6666-666666666666';

do $$
begin
    perform admin_review_salle('eeeeeeee-eeee-eeee-eeee-eeeeeeeeee77', true);
    raise notice 'R8 validation par l''admin ....... OK';
exception when others then
    raise notice 'R8 validation par l''admin ....... ÉCHEC (%)', sqlerrm;
end $$;

-- Les jours s'ajoutent à l'échéance, pas à aujourd'hui : le parrain ne perd
-- pas les 45 jours qui lui restaient.
select 'R9 parrain crédité sur son échéance' as test,
       (select trial_ends_at from subscriptions where pro_id = '11111111-1111-1111-1111-111111111111')
       = current_date + 75 as ok;

select 'R10 filleul crédité' as test,
       (select trial_ends_at from subscriptions where pro_id = '77777777-7777-7777-7777-777777777777')
       = current_date + 120 as ok;

select 'R11 lien marqué récompensé' as test,
       (select status::text || ':' || days_granted from referrals
        where referred_id = '77777777-7777-7777-7777-777777777777') = 'rewarded:30' as ok;

select 'R12 les deux comptes sont prévenus' as test,
       (select count(*) from notifications where type = 'referral_rewarded') = 2 as ok;

-- Une salle dépubliée puis republiée ne verse pas deux fois
do $$
begin
    perform admin_review_salle('eeeeeeee-eeee-eeee-eeee-eeeeeeeeee77', false);
    perform admin_review_salle('eeeeeeee-eeee-eeee-eeee-eeeeeeeeee77', true);
end $$;

select 'R13 récompense versée une seule fois' as test,
       (select trial_ends_at from subscriptions where pro_id = '11111111-1111-1111-1111-111111111111')
       = current_date + 75 as ok;

-- ── Plafond ───────────────────────────────────────────────────────────────

-- On simule un parrain proche du plafond : 350 jours déjà acquis.
\set QUIET on
insert into auth.users (id) values ('55555555-5555-5555-5555-555555555555') on conflict do nothing;
insert into users (id, phone, full_name, role) values
    ('55555555-5555-5555-5555-555555555555', '+213555100055', 'Filleul Plafond', 'pro')
on conflict (id) do nothing;
insert into subscriptions (pro_id, trial_ends_at)
values ('55555555-5555-5555-5555-555555555555', current_date + 90)
on conflict (pro_id) do update set trial_ends_at = current_date + 90;

insert into salles (id, owner_id, name, city, capacity_max, status)
values ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeee55',
        '55555555-5555-5555-5555-555555555555', 'Salle plafond', 'Alger', 200, 'pending')
on conflict (id) do update set status = 'pending';

insert into referrals (referrer_id, referred_id, code, status, days_granted)
values ('11111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555555',
        'PAR111', 'pending', 0)
on conflict (referred_id) do update set status = 'pending', days_granted = 0;

-- Historique fictif portant le parrain à 350 jours acquis
update referrals set days_granted = 350
where referred_id = '77777777-7777-7777-7777-777777777777';
\pset tuples_only off
\set QUIET off

do $$
begin
    perform admin_review_salle('eeeeeeee-eeee-eeee-eeee-eeeeeeeeee55', true);
end $$;

select 'R14 dernière récompense rognée au plafond' as test,
       (select days_granted from referrals
        where referred_id = '55555555-5555-5555-5555-555555555555') = 15 as ok;

-- Le filleul, lui, reçoit sa part pleine : c'est sa seule occasion
select 'R15 filleul non concerné par le plafond' as test,
       (select trial_ends_at from subscriptions where pro_id = '55555555-5555-5555-5555-555555555555')
       = current_date + 120 as ok;

-- ── Contraintes et cloisonnement ──────────────────────────────────────────

do $$
begin
    begin
        insert into referrals (referrer_id, referred_id, code)
        values ('11111111-1111-1111-1111-111111111111',
                '11111111-1111-1111-1111-111111111111', 'PAR111');
        raise notice 'R16 auto-parrainage bloqué en base  ÉCHEC (accepté)';
    exception when check_violation then
        raise notice 'R16 auto-parrainage bloqué en base  OK';
    end;

    begin
        insert into referrals (referrer_id, referred_id, code)
        values ('33333333-3333-3333-3333-333333333333',
                '77777777-7777-7777-7777-777777777777', 'AUTRE1');
        raise notice 'R17 filleul unique en base ....... ÉCHEC (accepté)';
    exception when unique_violation then
        raise notice 'R17 filleul unique en base ....... OK';
    end;
end $$;

select 'R18 codes uniques entre propriétaires' as test,
       (select count(*) = count(distinct referral_code) from users where referral_code is not null) as ok;

select 'R19 aucune écriture directe autorisée' as test,
       not exists (
           select 1 from pg_policies
           where tablename = 'referrals' and cmd in ('INSERT', 'UPDATE', 'DELETE', 'ALL')
       ) as ok;
