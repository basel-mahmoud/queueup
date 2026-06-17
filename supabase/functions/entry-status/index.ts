// POST /entry-status — anonymous customer checks their live status by token.
// Higher rate limit than join (this is polled). Returns a sanitized snapshot
// (no other customers' PII) computed server-side via SECURITY DEFINER RPC.
import { handlePreflight } from '../_shared/cors.ts';
import { errorResponse, jsonResponse, log, clientIp } from '../_shared/respond.ts';
import { serviceClient } from '../_shared/supabase.ts';
import { rateLimit } from '../_shared/ratelimit.ts';
import { joinTokenSchema } from '../_shared/schemas.ts';

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');
  const preflight = handlePreflight(req);
  if (preflight) return preflight;
  if (req.method !== 'POST') return errorResponse('Method not allowed', 405, origin);

  const supabase = serviceClient();
  const ip = clientIp(req);

  const decision = await rateLimit(supabase, `status:${ip}`, 60, 60);
  if (!decision.allowed) {
    return errorResponse('Too many requests. Please slow down.', 429, origin, {
      'Retry-After': String(decision.retryAfter),
    });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorResponse('Invalid request body', 400, origin);
  }

  const parsed = joinTokenSchema.safeParse(body);
  if (!parsed.success) return errorResponse('Invalid token', 400, origin);

  const { data, error } = await supabase.rpc('entry_status', {
    p_join_token: parsed.data.join_token,
  });

  if (error) {
    if (error.message?.includes('not_found')) {
      return errorResponse('We could not find your place in line.', 404, origin);
    }
    log('error', 'status_failed', { code: error.code });
    return errorResponse('Could not load your status. Please try again.', 500, origin);
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return errorResponse('We could not find your place in line.', 404, origin);
  return jsonResponse(row, 200, origin);
});
