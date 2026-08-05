-- ═══════════════════════════════════════════════════════════════════════════
-- Tasale — stockage des images
--
-- À exécuter sur Supabase uniquement : le schéma `storage` n'existe pas sur
-- une instance PostgreSQL nue, ce fichier n'est donc pas couvert par les
-- tests locaux.
--
-- Convention de chemin, sur laquelle reposent les règles ci-dessous :
--   salles/<salle_id>/<horodatage>-<alea>.jpg
--   avis/<reservation_id>/<horodatage>-<alea>.jpg
-- Elle est produite par `buildPath()` dans src/lib/storage.js.
-- ═══════════════════════════════════════════════════════════════════════════

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
    ('salles', 'salles', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
    ('avis',   'avis',   true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- Les photos sont publiques : elles s'affichent sur les fiches sans session.
create policy "lecture publique des images"
    on storage.objects for select
    using (bucket_id in ('salles', 'avis'));

-- Un propriétaire ne dépose que dans le dossier de sa propre salle.
create policy "depot des photos de salle par son proprietaire"
    on storage.objects for insert to authenticated
    with check (
        bucket_id = 'salles'
        and is_salle_owner(((storage.foldername(name))[1])::uuid)
    );

create policy "suppression des photos de salle par son proprietaire"
    on storage.objects for delete to authenticated
    using (
        bucket_id = 'salles'
        and is_salle_owner(((storage.foldername(name))[1])::uuid)
    );

-- Un client ne dépose que sur une réservation qui est la sienne.
create policy "depot des photos d avis par le client concerne"
    on storage.objects for insert to authenticated
    with check (
        bucket_id = 'avis'
        and exists (
            select 1 from reservations r
            where r.id = ((storage.foldername(name))[1])::uuid
              and r.client_id = auth.uid()
        )
    );
