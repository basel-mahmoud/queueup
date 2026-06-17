// GET /health — liveness probe for the post-deploy smoke test (Section 9.10).
// Verifies the function runtime and a trivial DB round-trip succeed.
import { handlePreflight } from '../_shared/cors.ts';
import { jsonResponse, errorResponse } from '../_shared/respond.ts';
import { serviceClient } from '../_shared/supabase.ts';

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');
  const preflight = handlePreflight(req);
  if (preflight) return preflight;

  try {
    const supabase = serviceClient();
    // Cheap round-trip: rate_limit_hit is idempotent enough for a probe.
    const { error } = await supabase.rpc('rate_limit_hit', {
      p_key: 'health:probe',
      p_limit: 1_000_000,
      p_window_seconds: 60,
    });
    if (error) throw error;
    return jsonResponse({ status: 'ok', time: new Date().toISOString() }, 200, origin);
  } catch {
    return errorResponse('unhealthy', 503, origin);
  }
});
