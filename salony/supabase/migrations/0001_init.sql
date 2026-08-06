-- ============================================================================
-- SALONY — Schéma Supabase complet
-- App de réservation salons de coiffure / beauté / soins (Algérie & Maghreb)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0. EXTENSIONS
-- ----------------------------------------------------------------------------
create extension if not exists "uuid-ossp";
create extension if not exists postgis; -- géoloc salons

-- ----------------------------------------------------------------------------
-- 1. ENUMS
-- ----------------------------------------------------------------------------
create type user_role as enum ('client', 'pro', 'staff', 'admin');
create type salon_type as enum ('coiffure', 'esthetique', 'spa', 'barbier', 'ongles', 'mixte');
create type salon_statut as enum ('en_attente', 'valide', 'suspendu', 'rejete');
create type booking_statut as enum ('en_attente', 'confirme', 'termine', 'annule', 'no_show');
create type notification_type as enum (
  'rappel_rdv', 'confirmation_rdv', 'annulation_rdv', 'nouvel_avis',
  'nouvelle_reservation', 'salon_valide', 'salon_rejete'
);

-- ----------------------------------------------------------------------------
-- 2. PROFILES (extension de auth.users)
-- ----------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null default 'client',
  nom text,
  prenom text,
  telephone text unique,
  avatar_url text,
  langue text not null default 'fr' check (langue in ('fr', 'ar')),
  score_fiabilite numeric(3,2) not null default 5.0 check (score_fiabilite between 0 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_profiles_role on public.profiles(role);
create index idx_profiles_telephone on public.profiles(telephone);

-- ----------------------------------------------------------------------------
-- 3. SALONS
-- ----------------------------------------------------------------------------
create table public.salons (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  nom text not null,
  description text,
  type salon_type not null default 'coiffure',
  telephone text not null,
  whatsapp text,
  adresse text not null,
  quartier text,
  ville text not null,
  wilaya text not null,
  location geography(Point, 4326), -- longitude/latitude
  photos text[] not null default '{}',
  horaires jsonb not null default '{}',
  -- format horaires: {"lun": {"ouvert": true, "debut": "09:00", "fin": "19:00"}, ...}
  registre_commerce text,
  statut salon_statut not null default 'en_attente',
  note_moyenne numeric(2,1) not null default 0,
  nb_avis integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_salons_owner on public.salons(owner_id);
create index idx_salons_ville on public.salons(ville);
create index idx_salons_type on public.salons(type);
create index idx_salons_statut on public.salons(statut);
create index idx_salons_location on public.salons using gist(location);

-- ----------------------------------------------------------------------------
-- 4. STAFF (praticiens du salon)
-- ----------------------------------------------------------------------------
create table public.staff (
  id uuid primary key default uuid_generate_v4(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete set null, -- null si pas de compte app
  nom text not null,
  photo_url text,
  specialites text[] not null default '{}',
  actif boolean not null default true,
  created_at timestamptz not null default now()
);

create index idx_staff_salon on public.staff(salon_id);

-- ----------------------------------------------------------------------------
-- 5. SERVICES (catalogue de prestations)
-- ----------------------------------------------------------------------------
create table public.services (
  id uuid primary key default uuid_generate_v4(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  nom text not null,
  description text,
  categorie text, -- ex: "Coupe", "Coloration", "Soin visage"
  duree_min integer not null check (duree_min > 0),
  prix numeric(10,2) not null check (prix >= 0),
  acompte_requis numeric(10,2) not null default 0,
  actif boolean not null default true,
  created_at timestamptz not null default now()
);

create index idx_services_salon on public.services(salon_id);

-- liaison staff <-> services (quel praticien fait quelle prestation)
create table public.staff_services (
  staff_id uuid not null references public.staff(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete cascade,
  primary key (staff_id, service_id)
);

-- ----------------------------------------------------------------------------
-- 6. DISPONIBILITÉS RÉCURRENTES
-- ----------------------------------------------------------------------------
create table public.availabilities (
  id uuid primary key default uuid_generate_v4(),
  staff_id uuid not null references public.staff(id) on delete cascade,
  jour_semaine smallint not null check (jour_semaine between 0 and 6), -- 0 = dimanche
  heure_debut time not null,
  heure_fin time not null,
  check (heure_fin > heure_debut)
);

create index idx_availabilities_staff on public.availabilities(staff_id);

-- exceptions ponctuelles (congé, jour férié, absence, horaire spécial)
create table public.availability_exceptions (
  id uuid primary key default uuid_generate_v4(),
  staff_id uuid not null references public.staff(id) on delete cascade,
  date date not null,
  disponible boolean not null default false,
  heure_debut time,
  heure_fin time,
  motif text,
  unique(staff_id, date)
);

-- ----------------------------------------------------------------------------
-- 7. BOOKINGS (réservations)
-- ----------------------------------------------------------------------------
create table public.bookings (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  salon_id uuid not null references public.salons(id) on delete cascade,
  staff_id uuid not null references public.staff(id) on delete restrict,
  date_heure_debut timestamptz not null,
  date_heure_fin timestamptz not null,
  statut booking_statut not null default 'en_attente',
  acompte_montant numeric(10,2) not null default 0,
  acompte_paye boolean not null default false,
  notes_client text,
  notes_pro text,
  annule_par uuid references public.profiles(id),
  motif_annulation text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (date_heure_fin > date_heure_debut)
);

create index idx_bookings_client on public.bookings(client_id);
create index idx_bookings_salon on public.bookings(salon_id);
create index idx_bookings_staff on public.bookings(staff_id);
create index idx_bookings_date on public.bookings(date_heure_debut);
create index idx_bookings_statut on public.bookings(statut);

-- empêche le double-booking d'un même praticien sur un créneau chevauchant
create extension if not exists btree_gist;
alter table public.bookings
  add constraint no_overlap_staff
  exclude using gist (
    staff_id with =,
    tstzrange(date_heure_debut, date_heure_fin) with &&
  )
  where (statut in ('en_attente', 'confirme'));

-- prestations liées à une réservation (snapshot prix/durée au moment du booking)
create table public.booking_services (
  id uuid primary key default uuid_generate_v4(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete restrict,
  nom_snapshot text not null,
  prix_snapshot numeric(10,2) not null,
  duree_snapshot integer not null
);

create index idx_booking_services_booking on public.booking_services(booking_id);

-- ----------------------------------------------------------------------------
-- 8. AVIS
-- ----------------------------------------------------------------------------
create table public.reviews (
  id uuid primary key default uuid_generate_v4(),
  booking_id uuid not null unique references public.bookings(id) on delete cascade,
  client_id uuid not null references public.profiles(id) on delete cascade,
  salon_id uuid not null references public.salons(id) on delete cascade,
  note smallint not null check (note between 1 and 5),
  commentaire text,
  reponse_pro text,
  reponse_pro_date timestamptz,
  created_at timestamptz not null default now()
);

create index idx_reviews_salon on public.reviews(salon_id);

-- ----------------------------------------------------------------------------
-- 9. FAVORIS
-- ----------------------------------------------------------------------------
create table public.favoris (
  client_id uuid not null references public.profiles(id) on delete cascade,
  salon_id uuid not null references public.salons(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (client_id, salon_id)
);

-- ----------------------------------------------------------------------------
-- 10. NOTIFICATIONS
-- ----------------------------------------------------------------------------
create table public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type notification_type not null,
  titre text not null,
  message text not null,
  lu boolean not null default false,
  data jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index idx_notifications_user on public.notifications(user_id, lu);

-- ============================================================================
-- 11. TRIGGERS — updated_at automatique
-- ============================================================================
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger trg_salons_updated_at before update on public.salons
  for each row execute function public.set_updated_at();
create trigger trg_bookings_updated_at before update on public.bookings
  for each row execute function public.set_updated_at();

-- création automatique du profil à l'inscription (auth.users -> profiles)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, telephone)
  values (new.id, new.phone);
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- mise à jour note_moyenne / nb_avis du salon après chaque avis
create or replace function public.update_salon_rating()
returns trigger as $$
begin
  update public.salons
  set
    note_moyenne = (select round(avg(note)::numeric, 1) from public.reviews where salon_id = new.salon_id),
    nb_avis = (select count(*) from public.reviews where salon_id = new.salon_id)
  where id = new.salon_id;
  return new;
end;
$$ language plpgsql;

create trigger trg_review_updates_salon_rating
  after insert or update on public.reviews
  for each row execute function public.update_salon_rating();

-- ============================================================================
-- 12. RPC — MOTEUR DE DISPONIBILITÉ
-- Retourne les créneaux libres pour un staff donné, une date, et une durée totale
-- ============================================================================
create or replace function public.get_available_slots(
  p_staff_id uuid,
  p_date date,
  p_duree_min integer,
  p_pas_min integer default 15 -- granularité des créneaux proposés
)
returns table (slot_debut timestamptz, slot_fin timestamptz) as $$
declare
  v_jour_semaine smallint;
  v_dispo_debut time;
  v_dispo_fin time;
  v_exception record;
begin
  v_jour_semaine := extract(dow from p_date);

  -- vérifie une exception ponctuelle (congé / horaire spécial ce jour-là)
  select * into v_exception
  from public.availability_exceptions
  where staff_id = p_staff_id and date = p_date;

  if found and v_exception.disponible = false then
    return; -- staff absent ce jour-là, aucun créneau
  end if;

  if found and v_exception.disponible = true then
    v_dispo_debut := v_exception.heure_debut;
    v_dispo_fin := v_exception.heure_fin;
  else
    select heure_debut, heure_fin into v_dispo_debut, v_dispo_fin
    from public.availabilities
    where staff_id = p_staff_id and jour_semaine = v_jour_semaine
    limit 1;

    if not found then
      return; -- pas d'horaire défini ce jour-là
    end if;
  end if;

  return query
  with slots as (
    select
      (p_date + v_dispo_debut) + (n * (p_pas_min || ' minutes')::interval) as debut
    from generate_series(
      0,
      (extract(epoch from (v_dispo_fin - v_dispo_debut)) / 60 / p_pas_min)::int
    ) as n
  )
  select
    s.debut,
    s.debut + (p_duree_min || ' minutes')::interval as fin
  from slots s
  where
    s.debut + (p_duree_min || ' minutes')::interval <= (p_date + v_dispo_fin)
    and not exists (
      select 1 from public.bookings b
      where b.staff_id = p_staff_id
        and b.statut in ('en_attente', 'confirme')
        and tstzrange(b.date_heure_debut, b.date_heure_fin) &&
            tstzrange(s.debut, s.debut + (p_duree_min || ' minutes')::interval)
    )
    and (p_date > current_date or s.debut > now()); -- pas de créneau dans le passé pour aujourd'hui
end;
$$ language plpgsql stable;

-- ============================================================================
-- 13. ROW LEVEL SECURITY
-- ============================================================================
alter table public.profiles enable row level security;
alter table public.salons enable row level security;
alter table public.staff enable row level security;
alter table public.services enable row level security;
alter table public.staff_services enable row level security;
alter table public.availabilities enable row level security;
alter table public.availability_exceptions enable row level security;
alter table public.bookings enable row level security;
alter table public.booking_services enable row level security;
alter table public.reviews enable row level security;
alter table public.favoris enable row level security;
alter table public.notifications enable row level security;

-- Fonction utilitaire : l'utilisateur courant est-il propriétaire de ce salon ?
create or replace function public.is_salon_owner(p_salon_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.salons
    where id = p_salon_id and owner_id = auth.uid()
  );
$$ language sql security definer stable;

-- ---- PROFILES ----
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- ---- SALONS ----
create policy "salons_select_public" on public.salons
  for select using (statut = 'valide' or owner_id = auth.uid());
create policy "salons_insert_own" on public.salons
  for insert with check (owner_id = auth.uid());
create policy "salons_update_own" on public.salons
  for update using (owner_id = auth.uid());
create policy "salons_delete_own" on public.salons
  for delete using (owner_id = auth.uid());

-- ---- STAFF ----
create policy "staff_select_public" on public.staff
  for select using (true);
create policy "staff_manage_owner" on public.staff
  for all using (public.is_salon_owner(salon_id))
  with check (public.is_salon_owner(salon_id));

-- ---- SERVICES ----
create policy "services_select_public" on public.services
  for select using (true);
create policy "services_manage_owner" on public.services
  for all using (public.is_salon_owner(salon_id))
  with check (public.is_salon_owner(salon_id));

-- ---- STAFF_SERVICES ----
create policy "staff_services_select_public" on public.staff_services
  for select using (true);
create policy "staff_services_manage_owner" on public.staff_services
  for all using (
    exists (select 1 from public.staff s where s.id = staff_id and public.is_salon_owner(s.salon_id))
  );

-- ---- AVAILABILITIES ----
create policy "availabilities_select_public" on public.availabilities
  for select using (true);
create policy "availabilities_manage_owner" on public.availabilities
  for all using (
    exists (select 1 from public.staff s where s.id = staff_id and public.is_salon_owner(s.salon_id))
  );

-- ---- AVAILABILITY_EXCEPTIONS ----
create policy "availability_exceptions_select_public" on public.availability_exceptions
  for select using (true);
create policy "availability_exceptions_manage_owner" on public.availability_exceptions
  for all using (
    exists (select 1 from public.staff s where s.id = staff_id and public.is_salon_owner(s.salon_id))
  );

-- ---- BOOKINGS ----
create policy "bookings_select_client" on public.bookings
  for select using (client_id = auth.uid() or public.is_salon_owner(salon_id));
create policy "bookings_insert_client" on public.bookings
  for insert with check (client_id = auth.uid());
create policy "bookings_update_client_or_owner" on public.bookings
  for update using (client_id = auth.uid() or public.is_salon_owner(salon_id));

-- ---- BOOKING_SERVICES ----
create policy "booking_services_select" on public.booking_services
  for select using (
    exists (
      select 1 from public.bookings b
      where b.id = booking_id
        and (b.client_id = auth.uid() or public.is_salon_owner(b.salon_id))
    )
  );
create policy "booking_services_insert" on public.booking_services
  for insert with check (
    exists (select 1 from public.bookings b where b.id = booking_id and b.client_id = auth.uid())
  );

-- ---- REVIEWS ----
create policy "reviews_select_public" on public.reviews
  for select using (true);
create policy "reviews_insert_client" on public.reviews
  for insert with check (
    client_id = auth.uid()
    and exists (
      select 1 from public.bookings b
      where b.id = booking_id and b.client_id = auth.uid() and b.statut = 'termine'
    )
  );
create policy "reviews_update_reponse_owner" on public.reviews
  for update using (public.is_salon_owner(salon_id));

-- ---- FAVORIS ----
create policy "favoris_all_own" on public.favoris
  for all using (client_id = auth.uid()) with check (client_id = auth.uid());

-- ---- NOTIFICATIONS ----
create policy "notifications_select_own" on public.notifications
  for select using (user_id = auth.uid());
create policy "notifications_update_own" on public.notifications
  for update using (user_id = auth.uid());

-- ============================================================================
-- FIN DU SCHÉMA
-- ============================================================================
