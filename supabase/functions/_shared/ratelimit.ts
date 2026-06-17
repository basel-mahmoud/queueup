// Rate-limit guard (Section 9.4). Calls the public.rate_limit_hit RPC (service
// role only) and returns the decision. The caller responds 429 + Retry-After
// when blocked.
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';

export interface RateDecision {
  allowed: boolean;
  remaining: number;
  retryAfter: number;
}

export async function rateLimit(
  supabase: SupabaseClient,
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<RateDecision> {
  const { data, error } = await supabase.rpc('rate_limit_hit', {
    p_key: key,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });
  if (error) {
    // Fail OPEN on limiter errors so a limiter outage never takes the app down,
    // but log it loudly for alerting.
    console.error(JSON.stringify({ level: 'error', message: 'rate_limit_error', code: error.code }));
    return { allowed: true, remaining: limit, retryAfter: 0 };
  }
  const row = Array.isArray(data) ? data[0] : data;
  return {
    allowed: row?.allowed ?? true,
    remaining: row?.remaining ?? 0,
    retryAfter: row?.retry_after ?? 0,
  };
}
