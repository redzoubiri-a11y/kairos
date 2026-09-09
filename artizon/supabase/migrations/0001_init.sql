-- Profil d'entreprise d'un artisan : un seul par compte, créé automatiquement
-- à l'inscription (trigger plus bas). Les blocs composés (assurance, coût
-- horaire par catégorie, paramètres par défaut) restent en jsonb : ce sont
-- exactement les formes déjà utilisées côté app (voir useProfilArtisan.js),
-- pas de traduction à faire entre les deux.
create table public.profils_artisans (
  id uuid primary key references auth.users(id) on delete cascade,
  nom_entreprise text not null default '',
  forme_juridique text not null default '',
  siret text not null default '',
  tva_intracommunautaire text not null default '',
  assurance_decennale jsonb not null default '{"assureur":"","contrat":"","couvertureGeographique":"France métropolitaine"}'::jsonb,
  cout_horaire jsonb not null default '{}'::jsonb,
  parametres_defaut jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profils_artisans enable row level security;

create policy "un artisan lit son propre profil"
  on public.profils_artisans for select
  using (auth.uid() = id);

create policy "un artisan modifie son propre profil"
  on public.profils_artisans for update
  using (auth.uid() = id);

create policy "un artisan insere son propre profil"
  on public.profils_artisans for insert
  with check (auth.uid() = id);

-- Un devis produit par l'artisan pour l'un de ses clients. Fourniture, pose,
-- paramètres et résultat en jsonb : c'est un instantané du calcul au moment
-- où le devis a été fait, pas une donnée qu'on recalcule après coup.
create table public.devis (
  id uuid primary key default gen_random_uuid(),
  artisan_id uuid not null references auth.users(id) on delete cascade,
  client_nom text not null default '',
  ouvrage_libelle text not null default '',
  fourniture jsonb not null default '{}'::jsonb,
  pose jsonb not null default '{}'::jsonb,
  parametres jsonb not null default '{}'::jsonb,
  tva jsonb not null default '{}'::jsonb,
  resultat jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.devis enable row level security;

create policy "un artisan lit ses propres devis"
  on public.devis for select
  using (auth.uid() = artisan_id);

create policy "un artisan cree ses propres devis"
  on public.devis for insert
  with check (auth.uid() = artisan_id);

create policy "un artisan modifie ses propres devis"
  on public.devis for update
  using (auth.uid() = artisan_id);

create policy "un artisan supprime ses propres devis"
  on public.devis for delete
  using (auth.uid() = artisan_id);

create index devis_artisan_id_idx on public.devis (artisan_id, created_at desc);

-- Création automatique du profil à l'inscription : l'app n'a jamais à créer
-- la ligne elle-même, donc pas de risque d'oubli ni de course avec la
-- première lecture du profil juste après signup.
create function public.gerer_nouvel_artisan()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profils_artisans (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.gerer_nouvel_artisan();
