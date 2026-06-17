// POST /leave-queue — anonymous customer leaves the line by token (idempotent).
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

  const decision = await rateLimit(supabase, `leave:${ip}`, 10, 60);
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

  const { data, error } = await supabase.rpc('leave_queue', {
    p_join_token: parsed.data.join_token,
  });

  if (error) {
    log('error', 'leave_failed', { code: error.code });
    return errorResponse('Could not update your status. Please try again.', 500, origin);
  }

  return jsonResponse({ status: data }, 200, origin);
});
