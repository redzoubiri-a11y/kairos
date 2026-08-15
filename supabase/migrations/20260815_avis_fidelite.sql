-- Lot 2 : durcir la création d'avis (réservation honorée obligatoire) + socle fidélité.
-- Pas de nouvelle table "avis" : `reviews` existe déjà (unique par réservation), seule
-- la policy INSERT est remplacée pour vérifier reservations.status = 'arrived'.

drop policy if exists reviews_insert on reviews;
create policy reviews_insert on reviews for insert to public
with check (
  user_id in (select id from users where auth_id = auth.uid())
  and exists (
    select 1 from reservations
    where id = reservation_id
      and user_id = reviews.user_id
      and restaurant_id = reviews.restaurant_id
      and status = 'arrived'
  )
);

-- Fidélité
create table points (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  motif text not null check (motif in ('reservation_honoree', 'commande', 'avis')),
  montant integer not null,
  reference_id uuid,
  created_at timestamptz not null default now()
);

alter table points enable row level security;

create policy points_select on points for select to authenticated
  using (user_id in (select id from users where auth_id = auth.uid()));
-- Aucune policy INSERT/UPDATE/DELETE pour anon/authenticated : écriture réservée
-- aux fonctions SECURITY DEFINER ci-dessous (jamais depuis le client).

-- Un seul crédit par réservation/avis/commande, garanti par index unique partiel
-- (pas par une vérification applicative dans le trigger).
create unique index points_reservation_honoree_once on points (reference_id) where motif = 'reservation_honoree';
create unique index points_avis_once               on points (reference_id) where motif = 'avis';
create unique index points_commande_once            on points (reference_id) where motif = 'commande';

create or replace function award_points_reservation_honoree()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'arrived' and old.status is distinct from 'arrived' then
    insert into points (user_id, motif, montant, reference_id)
    values (new.user_id, 'reservation_honoree', 10, new.id)
    on conflict do nothing;
  end if;
  return new;
end; $$;

create trigger trg_award_points_reservation_honoree
  after update on reservations
  for each row execute function award_points_reservation_honoree();

create or replace function award_points_avis()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into points (user_id, motif, montant, reference_id)
  values (new.user_id, 'avis', 5, new.reservation_id)
  on conflict do nothing;
  return new;
end; $$;

create trigger trg_award_points_avis
  after insert on reviews
  for each row execute function award_points_avis();

create or replace function award_points_commande()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'collected' and old.status is distinct from 'collected' then
    insert into points (user_id, motif, montant, reference_id)
    values (new.user_id, 'commande', 10, new.id)
    on conflict do nothing;
  end if;
  return new;
end; $$;

create trigger trg_award_points_commande
  after update on orders
  for each row execute function award_points_commande();
