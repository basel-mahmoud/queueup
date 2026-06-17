-- ============================================================================
-- Seed data for local dev / demo. Safe to re-run (idempotent upserts).
-- The demo profile id mimics a Clerk user id; in production profiles are created
-- from the real Clerk session on first sign-in.
-- ============================================================================
insert into public.profiles (id, display_name, email)
values ('user_demo_owner', 'Demo Owner', 'demo@queueup.app')
on conflict (id) do nothing;

insert into public.businesses (id, owner_id, name, slug, description, timezone)
values (
  '00000000-0000-0000-0000-0000000000b1',
  'user_demo_owner',
  'Snip & Style Barbers',
  'snip-and-style',
  'Walk-in friendly neighborhood barbershop.',
  'America/New_York'
)
on conflict (id) do nothing;

insert into public.queues (id, business_id, name, avg_service_minutes, position)
values
  ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000b1', 'Haircut', 20, 0),
  ('00000000-0000-0000-0000-0000000000c2', '00000000-0000-0000-0000-0000000000b1', 'Beard trim', 10, 1)
on conflict (id) do nothing;

insert into public.queue_entries (queue_id, business_id, customer_name, party_size, position, status)
values
  ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000b1', 'Alex', 1, 1, 'waiting'),
  ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000b1', 'Sam',  2, 2, 'waiting'),
  ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000b1', 'Jordan', 1, 3, 'called')
on conflict do nothing;
