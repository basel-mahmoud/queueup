-- Realtime Broadcast from the database. On any change to a queue's entries, emit
-- a PII-FREE 'changed' ping on the public topic 'queue:<queue_id>'. The anonymous
-- customer status page subscribes to this for instant refreshes; staff use
-- RLS-scoped postgres_changes instead. No row data is ever included.
create or replace function public.broadcast_queue_change()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_queue uuid := coalesce(new.queue_id, old.queue_id);
begin
  perform realtime.send(
    jsonb_build_object('at', extract(epoch from now())),
    'changed',
    'queue:' || v_queue::text,
    false
  );
  return null;
end;
$$;

revoke all on function public.broadcast_queue_change() from public, anon, authenticated;

create trigger trg_entries_broadcast
  after insert or update or delete on public.queue_entries
  for each row execute function public.broadcast_queue_change();
