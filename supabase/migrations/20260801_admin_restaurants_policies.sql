-- Un compte avec app_metadata.role = 'admin' peut voir et modifier tous
-- les restaurants (y compris pending/suspended), pour l'écran de
-- validation admin. Les policies existantes (public: status='active',
-- pro: son propre restaurant) restent inchangées.

create policy restaurants_admin_select
on restaurants
for select
using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy restaurants_admin_update
on restaurants
for update
using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
