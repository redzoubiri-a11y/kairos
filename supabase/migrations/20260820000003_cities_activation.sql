create table if not exists cities (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  wilaya_code text not null,
  slug text not null unique,
  target_listings int not null,
  activation_threshold int not null,
  is_live boolean not null default false,
  activated_at timestamptz,
  seasonal boolean not null default false,
  season_start_month int,   -- 1-12, null si non saisonnier
  season_end_month int,
  created_at timestamptz default now()
);

-- Vue de pilotage : où en est chaque ville
create or replace view city_activation_status as
select
  c.name,
  c.is_live,
  c.activation_threshold,
  count(r.id) filter (
    where r.status = 'active'
      and array_length(r.photos, 1) >= 1
      and r.dashboard_first_opened_at is not null
  ) as qualified_count
from cities c
left join restaurants r on r.city_id = c.id
group by c.id;
