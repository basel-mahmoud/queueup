import { z } from 'zod';

/**
 * Client-side environment. Only `VITE_`-prefixed vars are exposed to the browser
 * by Vite, so no server secrets can leak here. Validated with Zod at startup so a
 * misconfigured deploy fails loud and early instead of with a cryptic runtime error.
 */
const envSchema = z.object({
  VITE_SUPABASE_URL: z.string().url('VITE_SUPABASE_URL must be a valid URL'),
  VITE_SUPABASE_ANON_KEY: z.string().min(1, 'VITE_SUPABASE_ANON_KEY is required'),
  VITE_CLERK_PUBLISHABLE_KEY: z.string().min(1, 'VITE_CLERK_PUBLISHABLE_KEY is required'),
  VITE_APP_URL: z.string().url().optional(),
  VITE_SENTRY_DSN: z.string().optional(),
  VITE_ENV: z.enum(['development', 'preview', 'production']).default('development'),
});

export type ClientEnv = z.infer<typeof envSchema>;

function parseEnv(): ClientEnv {
  const parsed = envSchema.safeParse(import.meta.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    // Surface a single, actionable message. In dev this shows in the console;
    // in prod the app shell renders a configuration error instead of a blank page.
    console.error(`[env] Invalid or missing environment variables:\n${issues}`);
    if (import.meta.env.PROD) {
      throw new Error('Missing required environment variables. See console for details.');
    }
  }
  // Fall back to raw values so tests and first-run dev don't hard-crash on import.
  return parsed.success ? parsed.data : (import.meta.env as unknown as ClientEnv);
}

export const env: ClientEnv = parseEnv();
