-- ============================================================================
-- SALONY — Migration 0004 : annulation de réservation + remboursement d'acompte
--
-- Politique par défaut : annulation gratuite jusqu'à N heures avant le RDV
-- (configurable par salon). Passé ce délai, l'acompte reste acquis au salon —
-- c'est précisément sa raison d'être (protection contre le no-show).
-- Le salon peut toujours forcer un remboursement de geste commercial.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Politique d'annulation par salon
-- ----------------------------------------------------------------------------
alter table public.salons
  add column delai_annulation_h integer not null default 24
    check (delai_annulation_h >= 0);

comment on column public.salons.delai_annulation_h is
  'Nombre d''heures avant le RDV en deçà desquelles l''acompte n''est plus remboursable.';

-- ----------------------------------------------------------------------------
-- 2. Statut de remboursement sur les paiements
--
-- NB : la nouvelle valeur d'enum n'est utilisable qu'une fois la transaction
-- courante validée (contrainte PostgreSQL). Elle n'est référencée ici que par
-- l'Edge Function `refund-satim`, exécutée plus tard — donc aucun souci si ce
-- fichier est joué d'un bloc dans le SQL Editor.
-- ----------------------------------------------------------------------------
alter type payment_statut add value if not exists 'rembourse';

alter table public.payments
  add column rembourse_le timestamptz,
  add column remboursement_motif text;

-- ----------------------------------------------------------------------------
-- 3. RPC — annulation d'une réservation
--
-- Sécurité : SECURITY INVOKER (défaut) — les RLS de `bookings` s'appliquent,
-- donc seul le client concerné ou le propriétaire du salon peut annuler.
-- Retourne si l'acompte est remboursable, afin que l'appelant sache s'il doit
-- déclencher le remboursement SATIM.
-- ----------------------------------------------------------------------------
create or replace function public.cancel_booking(
  p_booking_id uuid,
  p_motif text default null
)
returns table (
  annule boolean,
  acompte_remboursable boolean,
  message text
) as $$
declare
  v_booking record;
  v_delai_h integer;
  v_heures_restantes numeric;
  v_remboursable boolean;
begin
  select b.*, s.delai_annulation_h
    into v_booking
  from public.bookings b
  join public.salons s on s.id = b.salon_id
  where b.id = p_booking_id;

  if not found then
    return query select false, false, 'Réservation introuvable ou accès refusé.'::text;
    return;
  end if;

  if v_booking.statut in ('annule', 'termine', 'no_show') then
    return query select false, false, 'Cette réservation ne peut plus être annulée.'::text;
    return;
  end if;

  v_delai_h := v_booking.delai_annulation_h;
  v_heures_restantes := extract(epoch from (v_booking.date_heure_debut - now())) / 3600;

  -- acompte remboursable seulement s'il a été payé ET que le délai est respecté
  v_remboursable := v_booking.acompte_paye and v_heures_restantes >= v_delai_h;

  update public.bookings
  set statut = 'annule',
      annule_par = auth.uid(),
      motif_annulation = p_motif
  where id = p_booking_id;

  return query select
    true,
    v_remboursable,
    case
      when not v_booking.acompte_paye then 'Réservation annulée.'
      when v_remboursable then 'Réservation annulée, votre acompte sera remboursé.'
      else format('Réservation annulée. L''acompte n''est pas remboursable à moins de %s h du rendez-vous.', v_delai_h)
    end::text;
end;
$$ language plpgsql;

-- ----------------------------------------------------------------------------
-- 4. Pénalisation du score de fiabilité en cas de no-show
--
-- Le score sert au pro à repérer les clients à risque (pratique courante).
-- -0.5 par absence, plancher à 0 ; une réservation honorée regagne +0.1.
-- ----------------------------------------------------------------------------
create or replace function public.update_score_fiabilite()
returns trigger as $$
begin
  if new.statut = 'no_show' and old.statut is distinct from 'no_show' then
    update public.profiles
    set score_fiabilite = greatest(0, score_fiabilite - 0.5)
    where id = new.client_id;
  elsif new.statut = 'termine' and old.statut is distinct from 'termine' then
    update public.profiles
    set score_fiabilite = least(5, score_fiabilite + 0.1)
    where id = new.client_id;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_booking_score_fiabilite
  after update on public.bookings
  for each row execute function public.update_score_fiabilite();

-- ============================================================================
-- FIN MIGRATION 0004
-- ============================================================================
