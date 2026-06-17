import { useMemo } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { createAuthedClient, type AppSupabaseClient } from '@/lib/supabase';

/**
 * Returns a Supabase client whose every request carries the current Clerk
 * session token. Supabase verifies it (third-party auth) and Postgres RLS keys
 * off its `sub` claim — so the database, not the client, enforces access.
 *
 * The token is fetched fresh per request via Clerk's `getToken`, so it can't go
 * stale. The client is memoized on `getToken` identity to avoid re-creating a
 * websocket/realtime connection on every render.
 */
export function useSupabase(): AppSupabaseClient {
  const { getToken } = useAuth();
  return useMemo(() => createAuthedClient(() => getToken()), [getToken]);
}
