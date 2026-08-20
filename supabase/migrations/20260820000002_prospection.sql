-- Table de suivi de la prospection restaurateurs (campagne de revendication des fiches draft).
-- Un restaurant peut avoir plusieurs lignes au fil du temps (relance) -- pas de unicite sur restaurant_id.

create table if not exists prospection (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  ville text not null default 'alger',
  canal text not null default 'whatsapp',
  date_envoi timestamptz,
  date_clic timestamptz,
  statut text not null default 'envoyé',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table prospection
  drop constraint if exists prospection_canal_check;
alter table prospection
  add constraint prospection_canal_check check (canal in ('whatsapp'));

alter table prospection
  drop constraint if exists prospection_statut_check;
alter table prospection
  add constraint prospection_statut_check check (statut in ('envoyé', 'cliqué', 'répondu', 'accord', 'refus', 'sans_suite'));

create index if not exists prospection_restaurant_id_idx on prospection (restaurant_id);
create index if not exists prospection_statut_idx on prospection (statut);

-- RLS : table interne a l'equipe Mida (CRM prospection), jamais lue/modifiee par les
-- restaurateurs ni par le public. Meme pattern que les policies admin existantes sur
-- restaurants (restaurants_admin_select/restaurants_admin_update -- JWT app_metadata.role).
alter table prospection enable row level security;

drop policy if exists prospection_admin_all on prospection;
create policy prospection_admin_all on prospection
  for all
  using (((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) = 'admin'::text)
  with check (((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) = 'admin'::text);

-- Trigger updated_at : reutilise la fonction generique deja presente dans public
-- (update_updated_at_column est dans le schema storage, interne a Supabase -- pas celle-la)
-- plutot que d'en dupliquer une.
drop trigger if exists prospection_set_updated_at on prospection;
create trigger prospection_set_updated_at
  before update on prospection
  for each row
  execute function public.update_updated_at();
