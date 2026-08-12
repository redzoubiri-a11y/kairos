-- Ajoute la catégorie de cuisine à la demande d'inscription pro, pour que
-- approve-pro/auto-approve-pro puissent créer le restaurant avec la vraie
-- valeur au lieu du "autre" codé en dur.
alter table public.pro_requests
  add column if not exists cuisine_type text;
