-- Corrige l'avertissement de performance auth_rls_initplan (11 policies).
--
-- auth.uid() posé nu dans une policy est réévalué PAR LIGNE candidate — le
-- planificateur ne le hisse pas en InitPlan tout seul. (select auth.uid())
-- force cette évaluation unique. Sans effet observable aujourd'hui vu le
-- volume (profils_artisans : 2 lignes, devis : 10, clients : 1), mais c'est
-- la policy qui grandit avec l'usage réel de l'app, pas les autres tables.
--
-- Chaque policy est reposée à l'identique — même nom, même clause, seule la
-- forme de l'appel change — pour ne rien changer au comportement.

drop policy "un artisan lit son propre profil" on public.profils_artisans;
create policy "un artisan lit son propre profil"
  on public.profils_artisans for select
  using ((select auth.uid()) = id);

drop policy "un artisan modifie son propre profil" on public.profils_artisans;
create policy "un artisan modifie son propre profil"
  on public.profils_artisans for update
  using ((select auth.uid()) = id);

drop policy "un artisan insere son propre profil" on public.profils_artisans;
create policy "un artisan insere son propre profil"
  on public.profils_artisans for insert
  with check ((select auth.uid()) = id);

drop policy "un artisan lit ses propres devis" on public.devis;
create policy "un artisan lit ses propres devis"
  on public.devis for select
  using ((select auth.uid()) = artisan_id);

drop policy "un artisan cree ses propres devis" on public.devis;
create policy "un artisan cree ses propres devis"
  on public.devis for insert
  with check ((select auth.uid()) = artisan_id);

drop policy "un artisan modifie ses propres devis" on public.devis;
create policy "un artisan modifie ses propres devis"
  on public.devis for update
  using ((select auth.uid()) = artisan_id);

drop policy "un artisan supprime ses propres devis" on public.devis;
create policy "un artisan supprime ses propres devis"
  on public.devis for delete
  using ((select auth.uid()) = artisan_id);

drop policy "un artisan lit ses propres clients" on public.clients;
create policy "un artisan lit ses propres clients"
  on public.clients for select
  using ((select auth.uid()) = artisan_id);

drop policy "un artisan cree ses propres clients" on public.clients;
create policy "un artisan cree ses propres clients"
  on public.clients for insert
  with check ((select auth.uid()) = artisan_id);

drop policy "un artisan modifie ses propres clients" on public.clients;
create policy "un artisan modifie ses propres clients"
  on public.clients for update
  using ((select auth.uid()) = artisan_id);

drop policy "un artisan supprime ses propres clients" on public.clients;
create policy "un artisan supprime ses propres clients"
  on public.clients for delete
  using ((select auth.uid()) = artisan_id);
