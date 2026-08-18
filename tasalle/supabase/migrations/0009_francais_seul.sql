-- ═══════════════════════════════════════════════════════════════════════════
-- Tasalle — français seul
--
-- L'arabe et le sens de lecture inversé sont retirés de l'application. La
-- préférence de langue n'a donc plus de lecteur : elle valait 'fr' pour tout
-- le monde, et rien n'en dépendait — ni les gabarits SMS, ni les documents.
--
-- La colonne est supprimée plutôt que laissée à l'abandon : une colonne que
-- personne n'écrit ni ne lit finit par être prise pour une donnée vivante.
-- ═══════════════════════════════════════════════════════════════════════════

alter table users drop column if exists preferred_language;

-- Le type n'existe que pour cette colonne ; il part avec elle. La garde évite
-- l'échec si une autre table l'utilisait encore.
do $$
begin
    if not exists (
        select 1 from pg_attribute a
        join pg_type t on t.oid = a.atttypid
        where t.typname = 'user_language' and a.attnum > 0 and not a.attisdropped
    ) then
        drop type if exists user_language;
    end if;
end $$;
