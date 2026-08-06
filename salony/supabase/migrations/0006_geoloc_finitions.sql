-- ============================================================================
-- SALONY — Migration 0006 : géolocalisation exploitable + finitions
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Latitude / longitude exposables par l'API
--
-- PostgREST sérialise une colonne `geography` en WKB hexadécimal, illisible
-- côté client (l'app attendait à tort du GeoJSON). On stocke donc les
-- coordonnées en clair et on maintient `location` par trigger : l'app lit des
-- nombres simples, PostGIS reste disponible pour les recherches par distance.
-- ----------------------------------------------------------------------------
alter table public.salons
  add column latitude numeric(9,6),
  add column longitude numeric(9,6);

create or replace function public.sync_salon_location()
returns trigger as $$
begin
  if new.latitude is not null and new.longitude is not null then
    new.location := st_setsrid(st_makepoint(new.longitude, new.latitude), 4326)::geography;
  else
    new.location := null;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_salons_sync_location
  before insert or update of latitude, longitude on public.salons
  for each row execute function public.sync_salon_location();

-- reprise des salons déjà géolocalisés (si location avait été remplie à la main)
update public.salons
set latitude = st_y(location::geometry),
    longitude = st_x(location::geometry)
where location is not null and latitude is null;

-- ----------------------------------------------------------------------------
-- 2. Recherche de salons par proximité
--
-- Retourne les salons validés dans un rayon donné, du plus proche au plus
-- loin. Utilisé par l'écran carte et la recherche « autour de moi ».
-- ----------------------------------------------------------------------------
create or replace function public.salons_a_proximite(
  p_latitude numeric,
  p_longitude numeric,
  p_rayon_km numeric default 10,
  p_type salon_type default null
)
returns table (
  id uuid,
  nom text,
  type salon_type,
  ville text,
  quartier text,
  photos text[],
  note_moyenne numeric,
  nb_avis integer,
  latitude numeric,
  longitude numeric,
  distance_km numeric
) as $$
  select
    s.id, s.nom, s.type, s.ville, s.quartier, s.photos,
    s.note_moyenne, s.nb_avis, s.latitude, s.longitude,
    round((st_distance(
      s.location,
      st_setsrid(st_makepoint(p_longitude, p_latitude), 4326)::geography
    ) / 1000)::numeric, 2) as distance_km
  from public.salons s
  where s.statut = 'valide'
    and s.location is not null
    and (p_type is null or s.type = p_type)
    and st_dwithin(
      s.location,
      st_setsrid(st_makepoint(p_longitude, p_latitude), 4326)::geography,
      p_rayon_km * 1000
    )
  order by distance_km;
$$ language sql stable;

-- ----------------------------------------------------------------------------
-- 3. Le client doit pouvoir relire son propre avis pour le modifier
-- ----------------------------------------------------------------------------
create policy "reviews_update_own" on public.reviews
  for update using (client_id = auth.uid());

-- ----------------------------------------------------------------------------
-- 4. Réservations éligibles à un avis
--
-- Un avis n'est possible qu'après un rendez-vous honoré, et une seule fois
-- par réservation (contrainte unique sur reviews.booking_id).
-- ----------------------------------------------------------------------------
create or replace function public.bookings_a_noter()
returns table (
  booking_id uuid,
  salon_id uuid,
  salon_nom text,
  date_heure_debut timestamptz
) as $$
  select b.id, b.salon_id, s.nom, b.date_heure_debut
  from public.bookings b
  join public.salons s on s.id = b.salon_id
  where b.client_id = auth.uid()
    and b.statut = 'termine'
    and not exists (select 1 from public.reviews r where r.booking_id = b.id)
  order by b.date_heure_debut desc;
$$ language sql stable;

-- ============================================================================
-- FIN MIGRATION 0006
-- ============================================================================
