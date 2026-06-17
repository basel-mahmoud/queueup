// JSON response helpers + structured, redacted logging for edge functions
// (Sections 9.6 + 9.8). Errors return safe messages; details go to logs only.
import { corsHeaders } from './cors.ts';

export function jsonResponse(
  body: unknown,
  status: number,
  origin: string | null,
  extraHeaders: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(origin),
      ...extraHeaders,
    },
  });
}

export function errorResponse(
  message: string,
  status: number,
  origin: string | null,
  extraHeaders: Record<string, string> = {},
): Response {
  return jsonResponse({ error: message }, status, origin, extraHeaders);
}

const REDACT = /(phone|email|token|authorization|name)/i;

/** Structured log line with a request id; scrubs sensitive keys. */
export function log(
  level: 'info' | 'warn' | 'error',
  message: string,
  context: Record<string, unknown> = {},
): void {
  const scrubbed: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(context)) {
    scrubbed[k] = REDACT.test(k) ? '[redacted]' : v;
  }
  console[level](
    JSON.stringify({ level, time: new Date().toISOString(), message, ...scrubbed }),
  );
}

export function clientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for');
  return fwd ? (fwd.split(',')[0]?.trim() ?? 'unknown') : 'unknown';
}
