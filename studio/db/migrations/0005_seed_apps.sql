-- Kairos Studio — 0005 : la première application connectée.

insert into apps (key, name, connector)
values ('mida', 'Mida', 'mida')
on conflict (key) do nothing;
