-- Alerte fondateur : email (et WhatsApp si ALERT_WHATSAPP_TO est pose) a
-- chaque nouvelle reservation et chaque nouvelle commande.
--
-- Pourquoi : MIDA n'a aucune vue de supervision. Sans ca, la premiere vraie
-- reservation passe inapercue jusqu'a ce que quelqu'un interroge la base a la
-- main. On veut apprendre l'evenement quand il arrive, pas aller le chercher.
--
-- L'appel est fait sans en-tete d'authentification, exactement comme les jobs
-- pg_cron `auto-approve-pro` et `send-reminders` appellent deja leurs Edge
-- Functions sur ce projet (toutes deployees avec verify_jwt = false).

create or replace function public.alert_founder()
returns trigger
language plpgsql
security definer
set search_path = public, net, extensions
as $$
declare
  v_kind text := tg_argv[0];
begin
  -- net.http_post est asynchrone : la requete part dans la file de pg_net,
  -- l'INSERT n'attend pas la reponse de l'Edge Function.
  perform net.http_post(
    url     := 'https://rghjgyzpdadapmktislv.supabase.co/functions/v1/notify-founder',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body    := jsonb_build_object('kind', v_kind, 'id', new.id),
    timeout_milliseconds := 5000
  );

  return new;
exception
  -- Une alerte cassee ne doit jamais faire echouer la reservation elle-meme.
  when others then
    raise warning '[alerte] envoi impossible: %', sqlerrm;
    return new;
end;
$$;

comment on function public.alert_founder() is
  'Trigger AFTER INSERT : previent le fondateur via l''Edge Function notify-founder. Best-effort, n''echoue jamais.';

revoke execute on function public.alert_founder() from public, anon, authenticated;

drop trigger if exists alert_new_reservation on public.reservations;
create trigger alert_new_reservation
  after insert on public.reservations
  for each row execute function public.alert_founder('reservation');

drop trigger if exists alert_new_order on public.orders;
create trigger alert_new_order
  after insert on public.orders
  for each row execute function public.alert_founder('order');
