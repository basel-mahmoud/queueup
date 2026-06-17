// POST /join-queue — anonymous customer joins a queue.
// Layered defense: CORS allow-list -> rate limit (5/min/IP) -> Zod validation ->
// SECURITY DEFINER RPC (which re-checks queue open + bounds). The browser never
// touches queue_entries directly.
import { handlePreflight } from '../_shared/cors.ts';
import { errorResponse, jsonResponse, log, clientIp } from '../_shared/respond.ts';
import { serviceClient } from '../_shared/supabase.ts';
import { rateLimit } from '../_shared/ratelimit.ts';
import { joinQueueSchema } from '../_shared/schemas.ts';

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');
  const preflight = handlePreflight(req);
  if (preflight) return preflight;
  if (req.method !== 'POST') return errorResponse('Method not allowed', 405, origin);

  const supabase = serviceClient();
  const ip = clientIp(req);

  const decision = await rateLimit(supabase, `join:${ip}`, 5, 60);
  if (!decision.allowed) {
    log('warn', 'rate_limited', { route: 'join', ip });
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

  const parsed = joinQueueSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(parsed.error.issues[0]?.message ?? 'Invalid input', 400, origin);
  }

  const { queue_id, customer_name, party_size, phone } = parsed.data;
  const { data, error } = await supabase.rpc('join_queue', {
    p_queue_id: queue_id,
    p_name: customer_name,
    p_party: party_size,
    p_phone: phone || null,
  });

  if (error) {
    if (error.message?.includes('queue_unavailable')) {
      return errorResponse('This queue is closed right now.', 409, origin);
    }
    log('error', 'join_failed', { code: error.code });
    return errorResponse('Could not join the queue. Please try again.', 500, origin);
  }

  const row = Array.isArray(data) ? data[0] : data;
  log('info', 'joined', { queue_id });
  return jsonResponse(row, 201, origin);
});
