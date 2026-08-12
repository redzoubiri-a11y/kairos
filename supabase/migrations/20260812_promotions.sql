-- Vraie persistance pour les promotions restaurateur (jusqu'ici entièrement
-- factice côté client : hasActive=true codé en dur, PAST_PROMOS en constante).

create table if not exists public.promotions (
  id                uuid primary key default gen_random_uuid(),
  restaurant_id     uuid not null references public.restaurants(id) on delete cascade,
  type              text not null check (type in ('percent','fixed','free','2for1')),
  title             text not null,
  description       text,
  percent_value     integer,
  fixed_value       integer,
  time_start        text,
  time_end          text,
  max_uses_per_day  integer,
  start_date        date,
  end_date          date,
  is_paused         boolean not null default false,
  use_count         integer not null default 0,
  created_at        timestamptz not null default now()
);

alter table public.promotions enable row level security;

create policy "Lecture publique promotions"
  on public.promotions for select
  using (restaurant_id in (select id from public.restaurants where status = 'active'));

create policy "Pro gère ses promotions"
  on public.promotions for all
  using (restaurant_id in (select restaurant_id from public.restaurant_owners where auth_id = auth.uid()))
  with check (restaurant_id in (select restaurant_id from public.restaurant_owners where auth_id = auth.uid()));
