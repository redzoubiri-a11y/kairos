-- Fiche client de l'artisan : nom, téléphone, adresse — réutilisable d'un
-- devis à l'autre sans retaper. Volontairement pas de lien vers `devis`
-- (pas de client_id sur la table devis) : chaque devis reste un instantané
-- autonome de la consultation au moment où elle a été faite (voir le
-- commentaire de la table devis dans 0001_init.sql), la fiche client n'est
-- qu'un carnet d'adresses pour pré-remplir plus vite.
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  artisan_id uuid not null references auth.users(id) on delete cascade,
  nom text not null default '',
  telephone text not null default '',
  adresse text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.clients enable row level security;

create policy "un artisan lit ses propres clients"
  on public.clients for select
  using (auth.uid() = artisan_id);

create policy "un artisan cree ses propres clients"
  on public.clients for insert
  with check (auth.uid() = artisan_id);

create policy "un artisan modifie ses propres clients"
  on public.clients for update
  using (auth.uid() = artisan_id);

create policy "un artisan supprime ses propres clients"
  on public.clients for delete
  using (auth.uid() = artisan_id);

create index clients_artisan_id_idx on public.clients (artisan_id, nom);
