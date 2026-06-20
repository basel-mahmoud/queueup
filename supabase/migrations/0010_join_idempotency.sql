-- Idempotent + race-safe customer join.
alter table public.queue_entries
  add column if not exists idempotency_key uuid;

create unique index if not exists queue_entries_idem_idx
  on public.queue_entries (queue_id, idempotency_key)
  where idempotency_key is not null;

create or replace function public.join_queue(
  p_queue_id uuid, p_name text, p_party integer,
  p_phone text default null, p_idem uuid default null
)
returns table (
  join_token uuid, status public.entry_status, people_ahead integer,
  eta_minutes integer, position_in_line integer
)
language plpgsql volatile security definer set search_path = public as $$
declare
  v_queue public.queues;
  v_entry public.queue_entries;
  v_next_pos integer;
begin
  -- Idempotent replay: the same key returns the same entry, never a duplicate.
  if p_idem is not null then
    select * into v_entry from public.queue_entries
      where queue_id = p_queue_id and idempotency_key = p_idem limit 1;
    if found then
      select q.* into v_queue from public.queues q where q.id = p_queue_id;
      return query select v_entry.join_token, v_entry.status, public.people_ahead(v_entry),
        public.people_ahead(v_entry) * coalesce(v_queue.avg_service_minutes, 0), v_entry.position;
      return;
    end if;
  end if;

  select q.* into v_queue from public.queues q
    join public.businesses b on b.id = q.business_id
    where q.id = p_queue_id and q.is_open and b.is_active limit 1;
  if not found then raise exception 'queue_unavailable' using errcode = 'P0001'; end if;
  if p_name is null or char_length(trim(p_name)) < 1 or char_length(p_name) > 80 then
    raise exception 'invalid_name' using errcode = 'P0001'; end if;
  if p_party < 1 or p_party > 20 then raise exception 'invalid_party' using errcode = 'P0001'; end if;

  -- Serialize joins per queue so concurrent inserts can't collide on position.
  perform pg_advisory_xact_lock(hashtextextended(p_queue_id::text, 0));

  select coalesce(max(qe.position), 0) + 1 into v_next_pos
    from public.queue_entries qe where qe.queue_id = p_queue_id;

  insert into public.queue_entries
    (queue_id, business_id, customer_name, party_size, customer_phone, position, idempotency_key)
  values (p_queue_id, v_queue.business_id, trim(p_name), p_party,
          nullif(trim(coalesce(p_phone, '')), ''), v_next_pos, p_idem)
  on conflict (queue_id, idempotency_key) where idempotency_key is not null do nothing
  returning * into v_entry;

  if v_entry.id is null then
    -- lost a race with a concurrent identical submit; return the winning row
    select * into v_entry from public.queue_entries
      where queue_id = p_queue_id and idempotency_key = p_idem limit 1;
  else
    insert into public.activity (business_id, actor_id, type, payload)
    values (v_queue.business_id, null, 'entry_joined',
            jsonb_build_object('queue_id', p_queue_id, 'party_size', p_party));
  end if;

  return query select v_entry.join_token, v_entry.status, public.people_ahead(v_entry),
    public.people_ahead(v_entry) * v_queue.avg_service_minutes, v_entry.position;
end;
$$;

revoke all on function public.join_queue(uuid, text, integer, text, uuid) from public, anon, authenticated;
grant execute on function public.join_queue(uuid, text, integer, text, uuid) to service_role;
