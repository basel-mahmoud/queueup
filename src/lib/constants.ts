/** Input bounds and app-wide constants. Mirrored by edge-function validation and DB checks. */

export const LIMITS = {
  businessName: { min: 2, max: 80 },
  businessDescription: { max: 500 },
  queueName: { min: 1, max: 60 },
  customerName: { min: 1, max: 80 },
  partySize: { min: 1, max: 20 },
  avgServiceMinutes: { min: 1, max: 480 },
  slug: { min: 3, max: 40 },
} as const;

/** URL-safe slug: lowercase letters, digits, hyphens; no leading/trailing/double hyphen. */
export const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Lenient international phone format; phone is optional throughout. */
export const PHONE_REGEX = /^[+]?[0-9\s().-]{7,20}$/;

/** Length of the human-facing join code shown on the public queue page. */
export const DEFAULT_AVG_SERVICE_MINUTES = 10;

/** Rate-limit policy advertised to clients (enforced server-side; see edge functions). */
export const RATE_LIMITS = {
  join: { points: 5, windowSeconds: 60 },
  status: { points: 60, windowSeconds: 60 },
  default: { points: 50, windowSeconds: 60 },
} as const;

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, LIMITS.slug.max);
}
