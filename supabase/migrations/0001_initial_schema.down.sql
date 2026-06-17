-- ============================================================================
-- ROLLBACK for 0001_initial_schema + 0002_realtime (Section 9.10 — Rollback Plan)
-- ----------------------------------------------------------------------------
-- Tested down path. Run order for a release rollback: roll back the APP deploy
-- first (Vercel instant rollback), then run this only if the schema change must
-- also be reverted. Destructive — back up data first (see README Rollback Runbook).
-- ============================================================================

-- Realtime (0002)
alter publication supabase_realtime drop table if exists public.activity;
alter publication supabase_realtime drop table if exists public.queues;
alter publication supabase_realtime drop table if exists public.queue_entries;

-- RPCs
drop function if exists public.leave_queue(uuid);
drop function if exists public.entry_status(uuid);
drop function if exists public.join_queue(uuid, text, integer, text);
drop function if exists public.people_ahead(public.queue_entries);

-- Triggers + trigger functions
drop trigger if exists trg_business_add_owner on public.businesses;
drop function if exists public.add_owner_membership();
drop function if exists public.set_updated_at() cascade;

-- Tables (cascade clears policies, indexes, FKs)
drop table if exists public.activity cascade;
drop table if exists public.queue_entries cascade;
drop table if exists public.queues cascade;
drop table if exists public.business_members cascade;
drop table if exists public.businesses cascade;
drop table if exists public.profiles cascade;

-- Helper functions
drop function if exists public.shares_business(text);
drop function if exists public.is_admin(uuid);
drop function if exists public.is_member(uuid);
drop function if exists public.current_user_id();

-- Enums
drop type if exists public.entry_status;
drop type if exists public.member_role;
