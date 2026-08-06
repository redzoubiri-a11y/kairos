-- Vérification des codes promotionnels (0010_promo_codes.sql).
-- Suppose que business_rules.sql a créé le jeu d'essai.
--
-- L'enjeu : la remise ne doit jamais venir du client. Elle est recalculée en
-- base, et le quota consommé sous verrou.

\set QUIET on
\pset tuples_only on

insert into promo_codes (id, salle_id, code, kind, value, starts_on, ends_on, max_uses, used_count)
values
  ('dddddddd-dddd-dddd-dddd-ddddddddd001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'RENTREE10', 'percent', 10, current_date - 10, current_date + 60, 20, 0),
  ('dddddddd-dddd-dddd-dddd-ddddddddd002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'GROS', 'amount', 999999, null, null, null, 0),
  ('dddddddd-dddd-dddd-dddd-ddddddddd003', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'FINI', 'percent', 15, null, null, 2, 2),
  ('dddddddd-dddd-dddd-dddd-ddddddddd004', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'DEMAIN', 'percent', 10, current_date + 5, null, null, 0),
  ('dddddddd-dddd-dddd-dddd-ddddddddd005', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'PERIME', 'percent', 10, null, current_date - 1, null, 0),
  ('dddddddd-dddd-dddd-dddd-ddddddddd006', 'ffffffff-ffff-ffff-ffff-ffffffffffff',
   'AUTRESALLE', 'percent', 50, null, null, null, 0)
on conflict do nothing;

\pset tuples_only off
\set QUIET off

set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';

-- ── Verdicts ──────────────────────────────────────────────────────────────

select 'P1 code valide accepté' as test,
       (check_promo_code('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'RENTREE10', 35000) ->> 'ok')::boolean
   and (check_promo_code('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'RENTREE10', 35000) ->> 'discount')::numeric = 3500 as ok;

select 'P2 casse et espaces ignorés' as test,
       (check_promo_code('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '  rentree10 ', 35000) ->> 'ok')::boolean as ok;

select 'P3 code inconnu refusé' as test,
       check_promo_code('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'NIMPORTEQUOI', 35000) ->> 'reason' = 'unknown' as ok;

-- Le point : un code d'une autre salle ne doit pas s'appliquer ici
select 'P4 code d''une autre salle refusé' as test,
       check_promo_code('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'AUTRESALLE', 35000) ->> 'reason' = 'unknown' as ok;

select 'P5 code épuisé refusé' as test,
       check_promo_code('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'FINI', 35000) ->> 'reason' = 'exhausted' as ok;

select 'P6 code pas encore ouvert refusé' as test,
       check_promo_code('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'DEMAIN', 35000) ->> 'reason' = 'not_started' as ok;

select 'P7 code périmé refusé' as test,
       check_promo_code('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'PERIME', 35000) ->> 'reason' = 'expired' as ok;

-- La remise ne peut pas dépasser le montant : pas de total négatif
select 'P8 remise bornée au montant' as test,
       (check_promo_code('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'GROS', 35000) ->> 'discount')::numeric = 35000
   and (check_promo_code('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'GROS', 35000) ->> 'total')::numeric = 0 as ok;

select 'P9 vérifier ne consomme rien' as test,
       (select used_count from promo_codes where id = 'dddddddd-dddd-dddd-dddd-ddddddddd001') = 0 as ok;

-- ── Application à une demande ─────────────────────────────────────────────

do $$
declare v_row reservations;
begin
    v_row := create_reservation(
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', current_date + 200, 'mariage', 150,
        'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Amina Cherif', '+213661234567', '',
        'RENTREE10');

    if v_row.discount_amount = 3500 and v_row.total_amount = 31500 then
        raise notice 'P10 remise appliquée au total .... OK';
    else
        raise notice 'P10 remise appliquée au total .... ÉCHEC (remise %, total %)',
            v_row.discount_amount, v_row.total_amount;
    end if;
end $$;

select 'P11 utilisation consommée' as test,
       (select used_count from promo_codes where id = 'dddddddd-dddd-dddd-dddd-ddddddddd001') = 1 as ok;

-- Le client ne choisit pas la remise : elle est recalculée en base à partir
-- du tarif, jamais reprise d'un paramètre.
select 'P12 remise recalculée depuis le tarif' as test,
       (select discount_amount from reservations
        where event_date = current_date + 200 and salle_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
       = round((select price from tarifs where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb') * 0.10) as ok;

do $$
begin
    begin
        perform create_reservation(
            'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', current_date + 201, 'mariage', 150,
            'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Amina Cherif', '+213661234567', '',
            'FINI');
        raise notice 'P13 code épuisé refusé à la demande  ÉCHEC (acceptée)';
    exception when others then
        raise notice 'P13 code épuisé refusé à la demande  %',
            case when sqlerrm like 'PROMO_REFUSED%' then 'OK' else 'ÉCHEC (' || sqlerrm || ')' end;
    end;
end $$;

-- ── Restitution du quota ──────────────────────────────────────────────────

do $$
declare
    v_row   reservations;
    v_avant int;
    v_apres int;
begin
    select used_count into v_avant from promo_codes where id = 'dddddddd-dddd-dddd-dddd-ddddddddd001';

    v_row := create_reservation(
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', current_date + 202, 'fiancailles', 90,
        'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Amina Cherif', '+213661234567', '',
        'RENTREE10');

    perform cancel_reservation(v_row.id);

    select used_count into v_apres from promo_codes where id = 'dddddddd-dddd-dddd-dddd-ddddddddd001';

    if v_apres = v_avant then
        raise notice 'P14 quota rendu à l''annulation ... OK';
    else
        raise notice 'P14 quota rendu à l''annulation ... ÉCHEC (% puis %)', v_avant, v_apres;
    end if;
end $$;

-- ── Cloisonnement ─────────────────────────────────────────────────────────

select 'P15 aucune policy de lecture pour les clients' as test,
       not exists (
           select 1 from pg_policies
           where tablename = 'promo_codes' and cmd in ('SELECT', 'ALL')
             and qual not like '%owner_id = auth.uid()%'
       ) as ok;

set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

select 'P16 le propriétaire voit ses codes' as test,
       (select count(*) from promo_codes
        where salle_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa') >= 5 as ok;

-- Contraintes de table : elles tiennent même si l'application se trompe
do $$
begin
    begin
        insert into promo_codes (salle_id, code, kind, value)
        values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'TROPCHER', 'percent', 150);
        raise notice 'P17 pourcentage > 100 refusé ..... ÉCHEC (accepté)';
    exception when check_violation then
        raise notice 'P17 pourcentage > 100 refusé ..... OK';
    end;

    begin
        insert into promo_codes (salle_id, code, kind, value)
        values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'rentree10', 'percent', 5);
        raise notice 'P18 doublon insensible à la casse . ÉCHEC (accepté)';
    exception when unique_violation then
        raise notice 'P18 doublon insensible à la casse . OK';
    end;

    begin
        insert into promo_codes (salle_id, code, kind, value, starts_on, ends_on)
        values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'ALENVERS', 'percent', 5,
                current_date + 10, current_date);
        raise notice 'P19 dates inversées refusées ...... ÉCHEC (accepté)';
    exception when check_violation then
        raise notice 'P19 dates inversées refusées ...... OK';
    end;
end $$;
