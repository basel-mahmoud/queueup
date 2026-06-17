-- ============================================================================
-- Rate limiting (Section 9.4) — sliding fixed-window counter.
-- Backing store in the non-exposed private schema; the counter function is in
-- public but execute is granted to service_role only, so the edge functions can
-- call it via RPC while anon/authenticated cannot.
-- ============================================================================
create table private.rate_limits (
  bucket   text primary key,
  count    integer not null default 0,
  reset_at timestamptz not null
);

create or replace function public.rate_limit_hit(p_key text, p_limit int, p_window_seconds int)
returns table(allowed boolean, remaining int, retry_after int)
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_now timestamptz := now();
  v_count int;
  v_reset timestamptz;
begin
  insert into private.rate_limits as r (bucket, count, reset_at)
  values (p_key, 1, v_now + make_interval(secs => p_window_seconds))
  on conflict (bucket) do update
    set count = case when r.reset_at < v_now then 1 else r.count + 1 end,
        reset_at = case when r.reset_at < v_now
                        then v_now + make_interval(secs => p_window_seconds)
                        else r.reset_at end
  returning r.count, r.reset_at into v_count, v_reset;

  allowed := v_count <= p_limit;
  remaining := greatest(0, p_limit - v_count);
  retry_after := case when allowed then 0
                      else ceil(extract(epoch from (v_reset - v_now)))::int end;
  return next;
end;
$$;

revoke all on function public.rate_limit_hit(text, int, int) from public, anon, authenticated;
grant execute on function public.rate_limit_hit(text, int, int) to service_role;
