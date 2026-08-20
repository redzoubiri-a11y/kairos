alter table restaurants
  add column if not exists city_id uuid references cities(id),
  add column if not exists dashboard_first_opened_at timestamptz;
