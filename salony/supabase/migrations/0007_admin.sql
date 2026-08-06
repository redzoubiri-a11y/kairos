-- ============================================================================
-- SALONY — Migration 0007 : rôle administrateur (validation des salons)
--
-- Sans cela, mettre un salon en ligne impose une intervention manuelle en
-- base. Cette migration donne à un compte `admin` de quoi valider, rejeter ou
-- suspendre un salon depuis l'application.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Test d'appartenance au rôle admin
--
-- SECURITY DEFINER : la fonction lit `profiles` sans être bloquée par la RLS
-- de cette table (un utilisateur ne voit que sa propre ligne).
-- ----------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer stable;

-- ----------------------------------------------------------------------------
-- 2. L'admin voit et modifie tous les salons
--
-- Les policies existantes restent en place : PostgreSQL combine les policies
-- permissives avec un OU, il suffit donc d'en ajouter une.
-- ----------------------------------------------------------------------------
create policy "salons_select_admin" on public.salons
  for select using (public.is_admin());

create policy "salons_update_admin" on public.salons
  for update using (public.is_admin());

-- l'admin peut consulter les profils (support client, litiges)
create policy "profiles_select_admin" on public.profiles
  for select using (public.is_admin());

-- ----------------------------------------------------------------------------
-- 3. Changement de statut d'un salon, avec notification au propriétaire
-- ----------------------------------------------------------------------------
create or replace function public.moderer_salon(
  p_salon_id uuid,
  p_statut salon_statut,
  p_motif text default null
)
returns table (ok boolean, message text) as $$
declare
  v_owner_id uuid;
  v_nom text;
begin
  if not public.is_admin() then
    return query select false, 'Réservé aux administrateurs.'::text;
    return;
  end if;

  select owner_id, nom into v_owner_id, v_nom
  from public.salons where id = p_salon_id;

  if v_owner_id is null then
    return query select false, 'Salon introuvable.'::text;
    return;
  end if;

  update public.salons set statut = p_statut where id = p_salon_id;

  insert into public.notifications (user_id, type, titre, message)
  values (
    v_owner_id,
    case when p_statut = 'valide' then 'salon_valide'::notification_type
         else 'salon_rejete'::notification_type end,
    case when p_statut = 'valide' then 'Salon validé' else 'Statut de votre salon' end,
    case
      when p_statut = 'valide' then format('%s est maintenant visible par les clients.', v_nom)
      when p_statut = 'rejete' then format('La demande pour %s n''a pas été retenue. %s', v_nom, coalesce(p_motif, ''))
      when p_statut = 'suspendu' then format('%s a été suspendu. %s', v_nom, coalesce(p_motif, ''))
      else format('Le statut de %s a changé.', v_nom)
    end
  );

  return query select true, 'Statut mis à jour.'::text;
end;
$$ language plpgsql security definer;

-- ----------------------------------------------------------------------------
-- 4. File de modération
-- ----------------------------------------------------------------------------
create or replace function public.salons_a_moderer(
  p_statut salon_statut default 'en_attente'
)
returns table (
  id uuid,
  nom text,
  type salon_type,
  ville text,
  quartier text,
  adresse text,
  telephone text,
  registre_commerce text,
  photos text[],
  statut salon_statut,
  proprietaire text,
  created_at timestamptz
) as $$
  select
    s.id, s.nom, s.type, s.ville, s.quartier, s.adresse, s.telephone,
    s.registre_commerce, s.photos, s.statut,
    coalesce(nullif(trim(concat(p.prenom, ' ', p.nom)), ''), p.telephone) as proprietaire,
    s.created_at
  from public.salons s
  join public.profiles p on p.id = s.owner_id
  where public.is_admin() and s.statut = p_statut
  order by s.created_at;
$$ language sql security definer stable;

-- ----------------------------------------------------------------------------
-- 5. Promouvoir un compte en administrateur
--
-- À exécuter une fois, manuellement, pour créer le premier admin :
--   update public.profiles set role = 'admin' where telephone = '0…';
-- ----------------------------------------------------------------------------

-- ============================================================================
-- FIN MIGRATION 0007
-- ============================================================================
