-- Click & Collect : commande à emporter, optionnelle par restaurant,
-- paiement sur place. Panier multi-articles basé sur la table `dishes`
-- déjà existante.

alter table restaurants
  add column if not exists click_collect_enabled boolean not null default false;

create type order_status as enum ('pending', 'confirmed', 'ready', 'collected', 'cancelled');

create table orders (
  id             uuid primary key default gen_random_uuid(),
  restaurant_id  uuid not null references restaurants(id) on delete cascade,
  user_id        uuid not null references users(id) on delete cascade,
  status         order_status not null default 'pending',
  pickup_time    timestamptz,
  notes          text,
  total_amount   integer not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  cancelled_at   timestamptz
);

create table order_items (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null references orders(id) on delete cascade,
  dish_id    uuid references dishes(id) on delete set null,
  dish_name  text not null,
  price      integer not null,
  quantity   integer not null default 1,
  created_at timestamptz not null default now()
);

create index orders_restaurant_id_idx on orders(restaurant_id);
create index orders_user_id_idx on orders(user_id);
create index order_items_order_id_idx on order_items(order_id);

alter table orders enable row level security;
alter table order_items enable row level security;

-- orders : le client voit/gère ses propres commandes
create policy orders_user_select on orders for select
using (user_id in (select id from users where auth_id = auth.uid()));

create policy orders_user_insert on orders for insert
with check (user_id in (select id from users where auth_id = auth.uid()));

create policy orders_user_update on orders for update
using (
  user_id in (select id from users where auth_id = auth.uid())
  and status = 'pending'
);

-- orders : le restaurateur voit/gère les commandes de son restaurant
create policy orders_resto_select on orders for select
using (
  restaurant_id in (select restaurant_id from restaurant_owners where auth_id = auth.uid())
);

create policy orders_resto_update on orders for update
using (
  restaurant_id in (select restaurant_id from restaurant_owners where auth_id = auth.uid())
);

-- order_items : accès aligné sur la commande parente
create policy order_items_select on order_items for select
using (
  order_id in (
    select id from orders where
      user_id in (select id from users where auth_id = auth.uid())
      or restaurant_id in (select restaurant_id from restaurant_owners where auth_id = auth.uid())
  )
);

create policy order_items_insert on order_items for insert
with check (
  order_id in (
    select id from orders where user_id in (select id from users where auth_id = auth.uid())
  )
);
