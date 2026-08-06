-- ============================================================================
-- SALONY — Migration 0003 : créneaux au niveau salon ("sans préférence")
--
-- Permet à un client de réserver sans choisir de praticien : la fonction
-- agrège les disponibilités de tous les praticiens éligibles du salon et
-- retourne, pour chaque créneau horaire, le praticien le moins chargé ce
-- jour-là (répartition équitable de la charge dans l'équipe).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Praticiens éligibles pour un ensemble de prestations
--
-- Règle : un praticien est éligible s'il assure TOUTES les prestations
-- demandées (table staff_services). Cas particulier volontaire — un praticien
-- sans AUCUNE liaison staff_services est considéré comme polyvalent (il assure
-- tout). Cela évite qu'un salon qui n'a pas encore configuré la matrice
-- praticien/prestation se retrouve avec zéro créneau réservable.
-- ----------------------------------------------------------------------------
create or replace function public.get_eligible_staff(
  p_salon_id uuid,
  p_service_ids uuid[] default null
)
returns table (staff_id uuid, staff_nom text) as $$
  select s.id, s.nom
  from public.staff s
  where s.salon_id = p_salon_id
    and s.actif = true
    and (
      p_service_ids is null
      or array_length(p_service_ids, 1) is null
      -- praticien polyvalent : aucune liaison définie
      or not exists (select 1 from public.staff_services ss where ss.staff_id = s.id)
      -- sinon : doit couvrir toutes les prestations demandées
      or (
        select count(distinct ss.service_id)
        from public.staff_services ss
        where ss.staff_id = s.id
          and ss.service_id = any(p_service_ids)
      ) = array_length(p_service_ids, 1)
    );
$$ language sql stable;

-- ----------------------------------------------------------------------------
-- 2. Créneaux disponibles au niveau salon
--
-- Retourne un créneau par horaire (pas de doublons si plusieurs praticiens
-- sont libres au même moment) avec le praticien retenu — celui qui a le moins
-- de rendez-vous ce jour-là.
-- ----------------------------------------------------------------------------
create or replace function public.get_salon_available_slots(
  p_salon_id uuid,
  p_date date,
  p_duree_min integer,
  p_service_ids uuid[] default null,
  p_pas_min integer default 15
)
returns table (
  slot_debut timestamptz,
  slot_fin timestamptz,
  staff_id uuid,
  staff_nom text
) as $$
  with eligibles as (
    select * from public.get_eligible_staff(p_salon_id, p_service_ids)
  ),
  charge as (
    -- nombre de RDV déjà pris par praticien pour la journée
    select e.staff_id, count(b.id) as nb_rdv
    from eligibles e
    left join public.bookings b
      on b.staff_id = e.staff_id
      and b.statut in ('en_attente', 'confirme')
      and b.date_heure_debut::date = p_date
    group by e.staff_id
  ),
  tous_slots as (
    select
      s.slot_debut,
      s.slot_fin,
      e.staff_id,
      e.staff_nom,
      coalesce(c.nb_rdv, 0) as nb_rdv
    from eligibles e
    cross join lateral public.get_available_slots(e.staff_id, p_date, p_duree_min, p_pas_min) s
    left join charge c on c.staff_id = e.staff_id
  )
  select distinct on (t.slot_debut)
    t.slot_debut,
    t.slot_fin,
    t.staff_id,
    t.staff_nom
  from tous_slots t
  order by t.slot_debut, t.nb_rdv asc, t.staff_id;
$$ language sql stable;

-- ============================================================================
-- FIN MIGRATION 0003
-- ============================================================================
