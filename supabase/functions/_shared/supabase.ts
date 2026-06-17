// Service-role Supabase client for edge functions. The service role bypasses RLS,
// so it can call the SECURITY DEFINER customer RPCs (join/status/leave) and the
// rate limiter. SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected by the
// platform — they are NEVER exposed to the browser.
import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';

export function serviceClient(): SupabaseClient {
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) throw new Error('Missing Supabase service env');
  return createClient(url, key, { auth: { persistSession: false } });
}
