-- Log staff-driven status transitions to the activity feed. actor_id is the
-- acting member (from their JWT) or NULL for customer/edge-driven changes.
create or replace function public.log_entry_status_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'UPDATE' and new.status is distinct from old.status then
    insert into public.activity (business_id, actor_id, type, payload)
    values (new.business_id, nullif(private.current_user_id(), ''),
            'status_' || new.status,
            jsonb_build_object('queue_id', new.queue_id, 'customer', new.customer_name));
  end if;
  return null;
end;
$$;

revoke all on function public.log_entry_status_change() from public, anon, authenticated;

create trigger trg_entries_status_log
  after update on public.queue_entries
  for each row execute function public.log_entry_status_change();
