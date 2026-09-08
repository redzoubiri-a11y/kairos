-- Kairos Studio — 0004 : Storage et fermeture des accès.

-- Deux seaux privés. Privés au sens strict : aucune policy de lecture n'est
-- posée, donc rien n'est servi à anon ni à authenticated. Le studio distribue
-- les pièces par URL signée, à durée limitée — un visuel de campagne non encore
-- publiée ne doit pas être devinable par son chemin.
insert into storage.buckets (id, name, public)
values ('campaign-visuals', 'campaign-visuals', false),
       ('campaign-texts',   'campaign-texts',   false)
on conflict (id) do nothing;

-- Toutes les tables sont fermées : RLS active, aucune policy.
--
-- Ce n'est pas un oubli. Le studio est un moteur serveur : il se connecte avec
-- la clé service_role, qui contourne RLS. Aucun navigateur ne parle à cette
-- base. Le jour où une interface web arrive (Phase 2), elle apportera ses
-- policies avec son modèle d'utilisateurs — d'ici là, tout ce qui n'est pas le
-- moteur n'a rien à y lire.
alter table apps           enable row level security;
alter table entities       enable row level security;
alter table campaigns      enable row level security;
alter table campaign_items enable row level security;
alter table generations    enable row level security;
alter table assets         enable row level security;

-- `updated_at` tenu par la base plutôt que par l'appelant : un UPDATE fait à la
-- main depuis l'éditeur SQL doit compter autant qu'un UPDATE du moteur.
create or replace function touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_campaigns_touch
  before update on campaigns
  for each row execute function touch_updated_at();
