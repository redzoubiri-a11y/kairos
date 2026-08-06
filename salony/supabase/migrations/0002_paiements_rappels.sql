-- ============================================================================
-- SALONY — Migration 0002 : paiement d'acompte + suivi des rappels
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. PAIEMENTS (acompte via SATIM CIB/Edahabia, ou espèces au comptoir)
-- ----------------------------------------------------------------------------
create type payment_provider as enum ('satim', 'especes');
create type payment_statut as enum ('en_attente', 'reussi', 'echoue', 'annule');

create table public.payments (
  id uuid primary key default uuid_generate_v4(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  provider payment_provider not null default 'satim',
  montant numeric(10,2) not null check (montant > 0),
  statut payment_statut not null default 'en_attente',
  -- identifiants SATIM (register.do / confirmOrder.do)
  order_id text unique,        -- orderId retourné par register.do
  reference_externe text,       -- approvalCode / RRN retourné par SATIM après paiement
  raw_response jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_payments_booking on public.payments(booking_id);
create index idx_payments_order_id on public.payments(order_id);

create trigger trg_payments_updated_at before update on public.payments
  for each row execute function public.set_updated_at();

alter table public.payments enable row level security;

-- lecture seule côté app : la création/mise à jour passe exclusivement
-- par les Edge Functions (clé service_role, contourne RLS)
create policy "payments_select_client_or_owner" on public.payments
  for select using (
    exists (
      select 1 from public.bookings b
      where b.id = booking_id
        and (b.client_id = auth.uid() or public.is_salon_owner(b.salon_id))
    )
  );

-- ----------------------------------------------------------------------------
-- 2. SUIVI DES RAPPELS (WhatsApp / SMS) — évite les envois en double
-- ----------------------------------------------------------------------------
alter table public.bookings
  add column rappel_24h_envoye boolean not null default false,
  add column rappel_2h_envoye boolean not null default false;

-- ----------------------------------------------------------------------------
-- 3. PLANIFICATION DES RAPPELS (pg_cron + pg_net)
-- Appelle l'Edge Function `send-booking-reminders` toutes les 15 minutes.
-- À exécuter manuellement dans le SQL Editor Supabase après déploiement de
-- la fonction (remplacer <project-ref> et <anon-or-service-key>).
-- ----------------------------------------------------------------------------
-- create extension if not exists pg_cron;
-- create extension if not exists pg_net;
--
-- select cron.schedule(
--   'salony-rappels-rdv',
--   '*/15 * * * *',
--   $$
--   select net.http_post(
--     url := 'https://<project-ref>.supabase.co/functions/v1/send-booking-reminders',
--     headers := jsonb_build_object(
--       'Content-Type', 'application/json',
--       'Authorization', 'Bearer <service-role-key>'
--     ),
--     body := '{}'::jsonb
--   );
--   $$
-- );

-- ============================================================================
-- FIN MIGRATION 0002
-- ============================================================================
