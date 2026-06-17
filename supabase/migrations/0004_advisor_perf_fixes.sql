-- ============================================================================
-- Performance advisor fixes (get_advisors performance):
--   - 0001 unindexed_foreign_keys: cover activity.actor_id.
--   - 0006 multiple_permissive_policies: scope member-read policies to the
--     authenticated role so anon SELECTs evaluate a single policy.
-- (The "unused index" INFO hints are expected on a fresh DB and refer to the
--  hot-path indexes mandated by Section 9.7 — intentionally retained.)
-- ============================================================================
create index if not exists idx_activity_actor on public.activity (actor_id);

drop policy if exists businesses_select_member on public.businesses;
create policy businesses_select_member on public.businesses
  for select to authenticated using (private.is_member(id));

drop policy if exists queues_select_member on public.queues;
create policy queues_select_member on public.queues
  for select to authenticated using (private.is_member(business_id));
