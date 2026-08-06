-- ============================================================================
-- SALONY — Migration 0005 : rôle "staff" (compte employé) + stockage des photos
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Le praticien connecté peut voir son propre agenda
--
-- Un employé est rattaché à une fiche `staff` via `staff.profile_id`. Il ne
-- doit voir QUE ses propres rendez-vous — ni ceux des collègues, ni les
-- statistiques du salon (réservées au propriétaire).
-- ----------------------------------------------------------------------------
create or replace function public.current_staff_ids()
returns setof uuid as $$
  select id from public.staff where profile_id = auth.uid();
$$ language sql security definer stable;

-- lecture des réservations qui lui sont assignées
create policy "bookings_select_staff" on public.bookings
  for select using (staff_id in (select public.current_staff_ids()));

-- il peut clôturer / marquer une absence sur ses propres RDV
create policy "bookings_update_staff" on public.bookings
  for update using (staff_id in (select public.current_staff_ids()));

-- il peut lire les prestations liées à ses RDV
create policy "booking_services_select_staff" on public.booking_services
  for select using (
    exists (
      select 1 from public.bookings b
      where b.id = booking_id
        and b.staff_id in (select public.current_staff_ids())
    )
  );

-- ----------------------------------------------------------------------------
-- 2. Rattacher un compte utilisateur à une fiche praticien
--
-- Le propriétaire saisit le téléphone de son employé ; si un profil existe
-- avec ce numéro, la fiche staff lui est rattachée et son rôle passe à
-- 'staff'. On ne touche jamais à un compte déjà 'pro' (un gérant peut être
-- praticien dans son propre salon sans perdre ses droits).
-- ----------------------------------------------------------------------------
create or replace function public.lier_staff_a_profil(
  p_staff_id uuid,
  p_telephone text
)
returns table (lie boolean, message text) as $$
declare
  v_salon_id uuid;
  v_profile_id uuid;
  v_role user_role;
begin
  select salon_id into v_salon_id from public.staff where id = p_staff_id;

  if v_salon_id is null or not public.is_salon_owner(v_salon_id) then
    return query select false, 'Accès refusé.'::text;
    return;
  end if;

  select id, role into v_profile_id, v_role
  from public.profiles where telephone = p_telephone;

  if v_profile_id is null then
    return query select false, 'Aucun compte trouvé avec ce numéro. Demandez à votre employé de s''inscrire d''abord.'::text;
    return;
  end if;

  update public.staff set profile_id = v_profile_id where id = p_staff_id;

  if v_role = 'client' then
    update public.profiles set role = 'staff' where id = v_profile_id;
  end if;

  return query select true, 'Compte rattaché.'::text;
end;
$$ language plpgsql security definer;

-- ----------------------------------------------------------------------------
-- 3. Stockage des photos (salons, praticiens, avatars)
--
-- Bucket public en lecture : les photos de salons doivent être visibles sans
-- authentification. L'écriture est restreinte aux utilisateurs connectés, dans
-- un dossier portant leur identifiant.
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

create policy "photos_lecture_publique" on storage.objects
  for select using (bucket_id = 'photos');

create policy "photos_upload_authentifie" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "photos_suppression_proprietaire" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================================
-- FIN MIGRATION 0005
-- ============================================================================
