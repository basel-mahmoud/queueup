-- ============================================================================
-- Security hardening — resolves every `get_advisors` (security) finding:
--   1. function_search_path_mutable: pin search_path on all functions.
--   2. {anon,authenticated}_security_definer_function_executable: move the RLS
--      helper functions into a PRIVATE schema that PostgREST does not expose, so
--      they can't be invoked via /rest/v1/rpc, and lock down trigger functions.
-- RLS policies are recreated to reference private.* — the policies still work
-- because EXECUTE on the private functions is granted to anon/authenticated, but
-- the functions are no longer reachable through the public API surface.
-- ============================================================================

create schema if not exists private;
grant usage on schema private to anon, authenticated, service_role;

-- Drop policies that reference the helpers (recreated below) -------------------
drop policy if exists profiles_select on public.profiles;
drop policy if exists profiles_insert on public.profiles;
drop policy if exists profiles_update on public.profiles;
drop policy if exists businesses_select_member on public.businesses;
drop policy if exists businesses_select_public on public.businesses;
drop policy if exists businesses_insert on public.businesses;
drop policy if exists businesses_update on public.businesses;
drop policy if exists businesses_delete on public.businesses;
drop policy if exists members_select on public.business_members;
drop policy if exists members_insert on public.business_members;
drop policy if exists members_update on public.business_members;
drop policy if exists members_delete on public.business_members;
drop policy if exists queues_select_member on public.queues;
drop policy if exists queues_select_public on public.queues;
drop policy if exists queues_insert on public.queues;
drop policy if exists queues_update on public.queues;
drop policy if exists queues_delete on public.queues;
drop policy if exists entries_select on public.queue_entries;
drop policy if exists entries_insert on public.queue_entries;
drop policy if exists entries_update on public.queue_entries;
drop policy if exists entries_delete on public.queue_entries;
drop policy if exists activity_select on public.activity;
drop policy if exists activity_insert on public.activity;

-- Move helpers to the private schema -----------------------------------------
drop function if exists public.is_member(uuid);
drop function if exists public.is_admin(uuid);
drop function if exists public.shares_business(text);
drop function if exists public.current_user_id();

create function private.current_user_id()
returns text language sql stable set search_path = '' as $$
  select coalesce(auth.jwt() ->> 'sub', '')::text;
$$;

create function private.is_member(p_business uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.business_members m
    where m.business_id = p_business and m.user_id = private.current_user_id()
  );
$$;

create function private.is_admin(p_business uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.business_members m
    where m.business_id = p_business
      and m.user_id = private.current_user_id()
      and m.role in ('owner', 'manager')
  );
$$;

create function private.shares_business(p_target text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.business_members me
    join public.business_members them on them.business_id = me.business_id
    where me.user_id = private.current_user_id() and them.user_id = p_target
  );
$$;

grant execute on function private.current_user_id()  to anon, authenticated, service_role;
grant execute on function private.is_member(uuid)    to anon, authenticated, service_role;
grant execute on function private.is_admin(uuid)     to anon, authenticated, service_role;
grant execute on function private.shares_business(text) to anon, authenticated, service_role;

-- Pin search_path on the remaining public functions (finding #1) --------------
alter function public.set_updated_at() set search_path = '';
alter function public.people_ahead(public.queue_entries) set search_path = public, pg_temp;

-- Trigger functions must not be callable as RPCs ------------------------------
revoke all on function public.add_owner_membership() from public, anon, authenticated;
revoke all on function public.set_updated_at() from public, anon, authenticated;

-- Recreate policies against private.* ----------------------------------------
create policy profiles_select on public.profiles
  for select using (id = private.current_user_id() or private.shares_business(id));
create policy profiles_insert on public.profiles
  for insert with check (id = private.current_user_id());
create policy profiles_update on public.profiles
  for update using (id = private.current_user_id()) with check (id = private.current_user_id());

create policy businesses_select_member on public.businesses
  for select using (private.is_member(id));
create policy businesses_select_public on public.businesses
  for select to anon using (is_active = true);
create policy businesses_insert on public.businesses
  for insert with check (owner_id = private.current_user_id());
create policy businesses_update on public.businesses
  for update using (private.is_admin(id)) with check (private.is_admin(id));
create policy businesses_delete on public.businesses
  for delete using (private.is_admin(id));

create policy members_select on public.business_members
  for select using (private.is_member(business_id));
create policy members_insert on public.business_members
  for insert with check (private.is_admin(business_id));
create policy members_update on public.business_members
  for update using (private.is_admin(business_id)) with check (private.is_admin(business_id));
create policy members_delete on public.business_members
  for delete using (private.is_admin(business_id));

create policy queues_select_member on public.queues
  for select using (private.is_member(business_id));
create policy queues_select_public on public.queues
  for select to anon using (
    exists (select 1 from public.businesses b where b.id = business_id and b.is_active)
  );
create policy queues_insert on public.queues
  for insert with check (private.is_admin(business_id));
create policy queues_update on public.queues
  for update using (private.is_member(business_id)) with check (private.is_member(business_id));
create policy queues_delete on public.queues
  for delete using (private.is_admin(business_id));

create policy entries_select on public.queue_entries
  for select using (private.is_member(business_id));
create policy entries_insert on public.queue_entries
  for insert with check (private.is_member(business_id));
create policy entries_update on public.queue_entries
  for update using (private.is_member(business_id)) with check (private.is_member(business_id));
create policy entries_delete on public.queue_entries
  for delete using (private.is_member(business_id));

create policy activity_select on public.activity
  for select using (private.is_member(business_id));
create policy activity_insert on public.activity
  for insert with check (private.is_member(business_id));
