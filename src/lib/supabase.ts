import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { env } from '@/lib/env';

export type AppSupabaseClient = SupabaseClient<Database>;

/**
 * Public, unauthenticated client. Used only on customer-facing pages, which never
 * read protected tables directly — all customer data flows through edge functions.
 */
export const supabasePublic: AppSupabaseClient = createClient<Database>(
  env.VITE_SUPABASE_URL,
  env.VITE_SUPABASE_ANON_KEY,
  {
    auth: { persistSession: false, autoRefreshToken: false },
  },
);

/**
 * Authenticated client factory. Clerk issues the session token; Supabase verifies
 * it (third-party auth) and Postgres RLS policies key off its `sub` claim. The
 * token is fetched fresh per request via `accessToken`, so it never goes stale.
 *
 * See `useSupabase` (auth milestone) for the React-bound, memoized instance.
 */
export function createAuthedClient(getToken: () => Promise<string | null>): AppSupabaseClient {
  return createClient<Database>(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    accessToken: async () => (await getToken()) ?? '',
  });
}
