// Shared CORS handling (Section 9.3). Only approved origins receive an
// Access-Control-Allow-Origin header; everyone else is implicitly blocked by the
// browser. The allow-list comes from the ALLOWED_ORIGINS secret (comma-separated)
// merged with built-in dev origins. No wildcard is ever emitted.

const BUILT_IN_ALLOWED = [
  'http://localhost:5173',
  'http://localhost:4173',
  'https://queueup-app.vercel.app',
];

function allowList(): string[] {
  const fromEnv = (Deno.env.get('ALLOWED_ORIGINS') ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return [...new Set([...BUILT_IN_ALLOWED, ...fromEnv])];
}

/** Returns true for our own production preview/prod domains on Vercel. */
function isVercelPreview(origin: string): boolean {
  return /^https:\/\/queueup[a-z0-9-]*\.vercel\.app$/.test(origin);
}

export function corsHeaders(origin: string | null): Record<string, string> {
  const allowed = origin && (allowList().includes(origin) || isVercelPreview(origin));
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
  if (allowed && origin) headers['Access-Control-Allow-Origin'] = origin;
  return headers;
}

/** Handle an OPTIONS preflight; returns a Response or null if not a preflight. */
export function handlePreflight(req: Request): Response | null {
  if (req.method !== 'OPTIONS') return null;
  return new Response(null, { status: 204, headers: corsHeaders(req.headers.get('origin')) });
}
