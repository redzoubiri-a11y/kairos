-- Lot 3 : étendre Click & Collect au mode "à table" (numéro de table au lieu du créneau)
-- + estimation d'attente par tranche horaire (saisie manuelle par le pro).

create type order_mode as enum ('pickup', 'table');

alter table orders
  add column if not exists mode order_mode not null default 'pickup',
  add column if not exists table_number integer;

alter table orders add constraint orders_table_number_check
  check (
    (mode = 'table'  and table_number is not null and table_number > 0)
    or (mode = 'pickup' and table_number is null)
  );

alter table restaurants
  add column if not exists wait_time_estimates jsonb not null default '[]'::jsonb;
-- forme attendue : [{ "from": "12:00", "to": "14:00", "minutes": 20 }, ...]
