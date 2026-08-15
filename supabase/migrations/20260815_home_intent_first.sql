alter table restaurants
  add column if not exists espace_famille boolean not null default false,
  add column if not exists terrasse      boolean not null default false,
  add column if not exists parking       boolean not null default false,
  add column if not exists salle_fete    boolean not null default false,
  add column if not exists view_count    integer not null default 0;

create or replace function increment_restaurant_views(p_restaurant_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update restaurants set view_count = view_count + 1 where id = p_restaurant_id;
$$;

grant execute on function increment_restaurant_views(uuid) to anon, authenticated;
