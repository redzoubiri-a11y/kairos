-- Reproduit sur un PostgreSQL nu le peu que Supabase fournit d'office, afin de
-- rejouer migrations et tests sans projet Supabase :
--
--   createdb tasale
--   psql -d tasale -v ON_ERROR_STOP=1 -f supabase/tests/_bootstrap_local.sql
--   psql -d tasale -v ON_ERROR_STOP=1 -f supabase/migrations/0001_init.sql   # …0008
--   psql -d tasale -f supabase/tests/business_rules.sql                      # puis les autres
--
-- À NE PAS appliquer sur Supabase : les objets y existent déjà, en mieux.
-- Le fichier est rejouable.

-- ── Rôles ─────────────────────────────────────────────────────────────────
-- Les `grant … to authenticated` des migrations échouent sans ces rôles.

do $$
begin
    if not exists (select 1 from pg_roles where rolname = 'anon') then
        create role anon nologin;
    end if;
    if not exists (select 1 from pg_roles where rolname = 'authenticated') then
        create role authenticated nologin;
    end if;
    if not exists (select 1 from pg_roles where rolname = 'service_role') then
        create role service_role nologin bypassrls;
    end if;
end $$;

-- ── Schéma auth ───────────────────────────────────────────────────────────

create schema if not exists auth;

-- `users.id` référence cette table : seule la clé primaire nous intéresse.
create table if not exists auth.users (
    id uuid primary key
);

/**
 * Identité de l'appelant.
 *
 * Supabase la tire du JWT ; ici on lit le paramètre de session que les tests
 * positionnent (`set request.jwt.claim.sub = '…'`). Le second argument de
 * current_setting rend l'absence de valeur silencieuse : hors session
 * authentifiée, auth.uid() vaut NULL, comme sur Supabase.
 */
create or replace function auth.uid()
returns uuid
language sql
stable
as $$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;

grant usage on schema auth to anon, authenticated, service_role;
