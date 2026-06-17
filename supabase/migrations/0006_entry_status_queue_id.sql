-- Add queue_id to the customer status snapshot so the public status page can
-- subscribe to a PII-free broadcast channel keyed by queue (instant updates).
drop function if exists public.entry_status(uuid);

create function public.entry_status(p_join_token uuid)
returns table (
  status public.entry_status, people_ahead integer, eta_minutes integer,
  position_in_line integer, queue_id uuid, queue_name text, business_name text,
  customer_name text, created_at timestamptz
)
language plpgsql stable security definer set search_path = public as $$
declare
  v_entry public.queue_entries;
  v_queue public.queues;
  v_biz public.businesses;
begin
  select * into v_entry from public.queue_entries where join_token = p_join_token limit 1;
  if not found then
    raise exception 'not_found' using errcode = 'P0002';
  end if;
  select * into v_queue from public.queues where id = v_entry.queue_id;
  select * into v_biz from public.businesses where id = v_entry.business_id;
  return query
  select v_entry.status, public.people_ahead(v_entry),
         public.people_ahead(v_entry) * v_queue.avg_service_minutes, v_entry.position,
         v_entry.queue_id, v_queue.name, v_biz.name, v_entry.customer_name, v_entry.created_at;
end;
$$;

revoke all on function public.entry_status(uuid) from public, anon, authenticated;
grant execute on function public.entry_status(uuid) to service_role;
