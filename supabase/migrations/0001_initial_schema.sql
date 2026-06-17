-- ============================================================================
-- QueueUp — initial schema, RLS, indexes, triggers, and RPCs
-- ----------------------------------------------------------------------------
-- Auth model: Clerk issues the JWT; Supabase verifies it (third-party auth).
-- The Clerk user id arrives in `auth.jwt() ->> 'sub'`. profiles.id == that id.
--
-- Authorization (Section 9.1) is enforced HERE, in the database, with RLS — the
-- strongest place, because it holds even if an API handler has a bug. Customer
-- (anonymous) access to PII in queue_entries is NOT granted to `anon`; it flows
-- exclusively through SECURITY DEFINER RPCs that only `service_role` may execute,
-- which the rate-limited edge functions call.
-- ============================================================================

-- Enums -----------------------------------------------------------------------
create type public.member_role as enum ('owner', 'manager', 'staff');
create type public.entry_status as enum (
  'waiting', 'called', 'serving', 'served', 'no_show', 'cancelled'
);

-- ----------------------------------------------------------------------------
-- Helper functions used by RLS policies.
-- Declared SECURITY DEFINER so they bypass RLS when reading business_members,
-- which avoids infinite policy recursion (a classic Postgres RLS pitfall).
-- ----------------------------------------------------------------------------
create or replace function public.current_user_id()
returns text
language sql
stable
as $$
  select coalesce(auth.jwt() ->> 'sub', '')::text;
$$;

create or replace function public.is_member(p_business uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.business_members m
    where m.business_id = p_business
      and m.user_id = public.current_user_id()
  );
$$;

create or replace function public.is_admin(p_business uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.business_members m
    where m.business_id = p_business
      and m.user_id = public.current_user_id()
      and m.role in ('owner', 'manager')
  );
$$;

-- True if the caller shares at least one business with the target user.
create or replace function public.shares_business(p_target text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.business_members me
    join public.business_members them on them.business_id = me.business_id
    where me.user_id = public.current_user_id()
      and them.user_id = p_target
  );
$$;

-- updated_at maintenance ------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================================
-- Tables
-- ============================================================================

-- profiles --------------------------------------------------------------------
create table public.profiles (
  id           text primary key,                       -- Clerk user id (jwt sub)
  display_name text,
  avatar_url   text,
  email        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- businesses ------------------------------------------------------------------
create table public.businesses (
  id          uuid primary key default gen_random_uuid(),
  owner_id    text not null references public.profiles(id),
  name        text not null check (char_length(name) between 2 and 80),
  slug        text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text check (description is null or char_length(description) <= 500),
  timezone    text not null default 'UTC',
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- business_members ------------------------------------------------------------
create table public.business_members (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id     text not null references public.profiles(id) on delete cascade,
  role        public.member_role not null default 'staff',
  created_at  timestamptz not null default now(),
  unique (business_id, user_id)
);

-- queues ----------------------------------------------------------------------
create table public.queues (
  id                  uuid primary key default gen_random_uuid(),
  business_id         uuid not null references public.businesses(id) on delete cascade,
  name                text not null check (char_length(name) between 1 and 60),
  is_open             boolean not null default true,
  avg_service_minutes integer not null default 10 check (avg_service_minutes between 1 and 480),
  position            integer not null default 0,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- queue_entries ---------------------------------------------------------------
create table public.queue_entries (
  id             uuid primary key default gen_random_uuid(),
  queue_id       uuid not null references public.queues(id) on delete cascade,
  business_id    uuid not null references public.businesses(id) on delete cascade,
  join_token     uuid not null default gen_random_uuid() unique,
  customer_name  text not null check (char_length(customer_name) between 1 and 80),
  customer_phone text,
  party_size     integer not null default 1 check (party_size between 1 and 20),
  status         public.entry_status not null default 'waiting',
  position       integer not null default 0,
  called_at      timestamptz,
  served_at      timestamptz,
  notified_at    timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- activity --------------------------------------------------------------------
create table public.activity (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  actor_id    text references public.profiles(id) on delete set null,
  type        text not null,
  payload     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

-- ============================================================================
-- Indexes (Section 9.7) — index the hot, RLS-checked, and ordering paths.
-- ============================================================================
create index idx_business_members_user        on public.business_members (user_id);
create index idx_business_members_business     on public.business_members (business_id);
create index idx_businesses_owner              on public.businesses (owner_id);
create index idx_queues_business               on public.queues (business_id);
create index idx_queues_business_open          on public.queues (business_id, is_open);
create index idx_entries_queue_status_pos      on public.queue_entries (queue_id, status, position);
create index idx_entries_business              on public.queue_entries (business_id);
create index idx_entries_queue_created         on public.queue_entries (queue_id, created_at);
create index idx_activity_business_created     on public.activity (business_id, created_at desc);

-- ============================================================================
-- updated_at triggers
-- ============================================================================
create trigger trg_profiles_updated   before update on public.profiles      for each row execute function public.set_updated_at();
create trigger trg_businesses_updated before update on public.businesses    for each row execute function public.set_updated_at();
create trigger trg_queues_updated     before update on public.queues        for each row execute function public.set_updated_at();
create trigger trg_entries_updated    before update on public.queue_entries for each row execute function public.set_updated_at();

-- Auto-enroll the creator as owner when a business is created -----------------
create or replace function public.add_owner_membership()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.business_members (business_id, user_id, role)
  values (new.id, new.owner_id, 'owner')
  on conflict (business_id, user_id) do nothing;
  return new;
end;
$$;

create trigger trg_business_add_owner
  after insert on public.businesses
  for each row execute function public.add_owner_membership();

-- ============================================================================
-- Row-Level Security
-- ============================================================================
alter table public.profiles         enable row level security;
alter table public.businesses       enable row level security;
alter table public.business_members enable row level security;
alter table public.queues           enable row level security;
alter table public.queue_entries    enable row level security;
alter table public.activity         enable row level security;

-- profiles: read self or co-members; write only your own row -------------------
create policy profiles_select on public.profiles
  for select using (
    id = public.current_user_id() or public.shares_business(id)
  );
create policy profiles_insert on public.profiles
  for insert with check (id = public.current_user_id());
create policy profiles_update on public.profiles
  for update using (id = public.current_user_id())
  with check (id = public.current_user_id());

-- businesses: members read all columns; the public may read ACTIVE businesses
-- (name/slug/description are public storefront info, not sensitive). Only the
-- owner may create; only admins may update/delete.
create policy businesses_select_member on public.businesses
  for select using (public.is_member(id));
create policy businesses_select_public on public.businesses
  for select to anon using (is_active = true);
create policy businesses_insert on public.businesses
  for insert with check (owner_id = public.current_user_id());
create policy businesses_update on public.businesses
  for update using (public.is_admin(id)) with check (public.is_admin(id));
create policy businesses_delete on public.businesses
  for delete using (public.is_admin(id));

-- business_members: members read; admins manage ------------------------------
create policy members_select on public.business_members
  for select using (public.is_member(business_id));
create policy members_insert on public.business_members
  for insert with check (public.is_admin(business_id));
create policy members_update on public.business_members
  for update using (public.is_admin(business_id)) with check (public.is_admin(business_id));
create policy members_delete on public.business_members
  for delete using (public.is_admin(business_id));

-- queues: members read; public reads queues of ACTIVE businesses (for the join
-- page). Admins create/delete; any member may toggle/operate a queue.
create policy queues_select_member on public.queues
  for select using (public.is_member(business_id));
create policy queues_select_public on public.queues
  for select to anon using (
    exists (select 1 from public.businesses b where b.id = business_id and b.is_active)
  );
create policy queues_insert on public.queues
  for insert with check (public.is_admin(business_id));
create policy queues_update on public.queues
  for update using (public.is_member(business_id)) with check (public.is_member(business_id));
create policy queues_delete on public.queues
  for delete using (public.is_admin(business_id));

-- queue_entries: business members ONLY. No anon access — customer reads/writes
-- go through SECURITY DEFINER RPCs (below) called by the rate-limited edge
-- functions. This is the heart of the anonymous-but-secure boundary.
create policy entries_select on public.queue_entries
  for select using (public.is_member(business_id));
create policy entries_insert on public.queue_entries
  for insert with check (public.is_member(business_id));
create policy entries_update on public.queue_entries
  for update using (public.is_member(business_id)) with check (public.is_member(business_id));
create policy entries_delete on public.queue_entries
  for delete using (public.is_member(business_id));

-- activity: members read & write ---------------------------------------------
create policy activity_select on public.activity
  for select using (public.is_member(business_id));
create policy activity_insert on public.activity
  for insert with check (public.is_member(business_id));

-- ============================================================================
-- Customer-facing RPCs (SECURITY DEFINER). Granted to service_role ONLY so all
-- anonymous traffic is forced through the rate-limited edge functions.
-- ============================================================================

-- Number of parties still ahead of an active entry (excludes itself).
create or replace function public.people_ahead(p_entry public.queue_entries)
returns integer
language sql
stable
as $$
  select count(*)::int
  from public.queue_entries e
  where e.queue_id = p_entry.queue_id
    and e.status in ('waiting', 'called', 'serving')
    and (e.created_at < p_entry.created_at
         or (e.created_at = p_entry.created_at and e.id < p_entry.id));
$$;

-- Join a queue. Validates the queue is open and the business active. Returns the
-- new entry's token + a sanitized status snapshot.
create or replace function public.join_queue(
  p_queue_id uuid,
  p_name text,
  p_party integer,
  p_phone text default null
)
returns table (
  join_token uuid,
  status public.entry_status,
  people_ahead integer,
  eta_minutes integer,
  position integer
)
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_queue public.queues;
  v_entry public.queue_entries;
  v_next_pos integer;
begin
  select * into v_queue from public.queues q
    join public.businesses b on b.id = q.business_id
    where q.id = p_queue_id and q.is_open and b.is_active
    limit 1;
  if not found then
    raise exception 'queue_unavailable' using errcode = 'P0001';
  end if;

  if p_name is null or char_length(trim(p_name)) < 1 or char_length(p_name) > 80 then
    raise exception 'invalid_name' using errcode = 'P0001';
  end if;
  if p_party < 1 or p_party > 20 then
    raise exception 'invalid_party' using errcode = 'P0001';
  end if;

  select coalesce(max(position), 0) + 1 into v_next_pos
    from public.queue_entries where queue_id = p_queue_id;

  insert into public.queue_entries (queue_id, business_id, customer_name, party_size, customer_phone, position)
  values (p_queue_id, v_queue.business_id, trim(p_name), p_party, nullif(trim(coalesce(p_phone, '')), ''), v_next_pos)
  returning * into v_entry;

  insert into public.activity (business_id, actor_id, type, payload)
  values (v_queue.business_id, null, 'entry_joined',
          jsonb_build_object('queue_id', p_queue_id, 'party_size', p_party));

  return query
  select v_entry.join_token,
         v_entry.status,
         public.people_ahead(v_entry),
         public.people_ahead(v_entry) * v_queue.avg_service_minutes,
         v_entry.position;
end;
$$;

-- Sanitized live status for a customer, looked up by their secret token.
create or replace function public.entry_status(p_join_token uuid)
returns table (
  status public.entry_status,
  people_ahead integer,
  eta_minutes integer,
  position integer,
  queue_name text,
  business_name text,
  customer_name text,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
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
  select v_entry.status,
         public.people_ahead(v_entry),
         public.people_ahead(v_entry) * v_queue.avg_service_minutes,
         v_entry.position,
         v_queue.name,
         v_biz.name,
         v_entry.customer_name,
         v_entry.created_at;
end;
$$;

-- Customer leaves the line (idempotent for terminal states).
create or replace function public.leave_queue(p_join_token uuid)
returns public.entry_status
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_entry public.queue_entries;
begin
  update public.queue_entries
     set status = 'cancelled'
   where join_token = p_join_token
     and status in ('waiting', 'called', 'serving')
  returning * into v_entry;

  if found then
    insert into public.activity (business_id, actor_id, type, payload)
    values (v_entry.business_id, null, 'entry_left', jsonb_build_object('queue_id', v_entry.queue_id));
    return 'cancelled'::public.entry_status;
  end if;

  -- already terminal or unknown token — report current state without erroring
  select status into v_entry.status from public.queue_entries where join_token = p_join_token;
  return coalesce(v_entry.status, 'cancelled');
end;
$$;

-- Lock down RPC execution: anon/authenticated cannot call these directly; only
-- the service role (used by edge functions) may. Forces all customer traffic
-- through the rate-limited, CORS-guarded edge layer.
revoke all on function public.join_queue(uuid, text, integer, text)  from public, anon, authenticated;
revoke all on function public.entry_status(uuid)                     from public, anon, authenticated;
revoke all on function public.leave_queue(uuid)                      from public, anon, authenticated;
grant execute on function public.join_queue(uuid, text, integer, text) to service_role;
grant execute on function public.entry_status(uuid)                    to service_role;
grant execute on function public.leave_queue(uuid)                     to service_role;
