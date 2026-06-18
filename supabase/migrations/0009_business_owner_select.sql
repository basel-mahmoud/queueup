-- Fix: INSERT ... RETURNING on businesses failed RLS because membership is added
-- by an AFTER-INSERT trigger whose row isn't visible to the same statement's
-- SELECT policy. Allow the owner to read their own business directly (always
-- correct), so the insert's representation read-back succeeds.
drop policy if exists businesses_select_member on public.businesses;
create policy businesses_select_member on public.businesses
  for select to authenticated
  using (private.is_member(id) or owner_id = private.current_user_id());
