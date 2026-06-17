-- ============================================================================
-- Realtime: staff dashboards subscribe to Postgres changes on these tables.
-- RLS still applies to realtime, so a client only receives rows it may read.
-- queue_entries carries PII but is members-only by RLS, so this is safe; the
-- public customer flow uses a separate, PII-free broadcast ping instead.
-- ============================================================================
do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
end$$;

alter publication supabase_realtime add table public.queue_entries;
alter publication supabase_realtime add table public.queues;
alter publication supabase_realtime add table public.activity;

-- Ensure UPDATE/DELETE payloads include the full old row for realtime consumers.
alter table public.queue_entries replica identity full;
alter table public.queues replica identity full;
