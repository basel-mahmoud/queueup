-- ============================================================================
-- ROLLBACK for 0001–0004 (Section 9.10 — Rollback Plan)
-- ----------------------------------------------------------------------------
-- Tested down path. Release rollback order: roll back the APP deploy first
-- (Vercel instant rollback), then run this only if the schema must also revert.
-- Destructive — back up data first (see README Rollback Runbook).
-- ============================================================================

-- Realtime (0002)
alter publication supabase_realtime drop table if exists public.activity;
alter publication supabase_realtime drop table if exists public.queues;
alter publication supabase_realtime drop table if exists public.queue_entries;

-- Customer RPCs
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

-- Private helper schema (0003)
drop schema if exists private cascade;

-- Enums
drop type if exists public.entry_status;
drop type if exists public.member_role;
