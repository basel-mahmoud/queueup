// Server-side validation schemas (Section 9.2) — mirrors src/lib/schemas.ts so
// every input is re-validated at the edge before any DB call, independent of the
// client. Kept dependency-light with its own zod import for the Deno runtime.
import { z } from 'npm:zod@3.23.8';

const PHONE_REGEX = /^[+]?[0-9\s().-]{7,20}$/;

export const joinQueueSchema = z.object({
  queue_id: z.string().uuid(),
  customer_name: z.string().trim().min(1).max(80),
  party_size: z.coerce.number().int().min(1).max(20),
  phone: z.string().trim().regex(PHONE_REGEX).optional().or(z.literal('')),
  // Client-generated key so a retried / double-submitted join is de-duplicated.
  idempotency_key: z.string().uuid().optional(),
});

export const joinTokenSchema = z.object({
  join_token: z.string().uuid(),
});

export type JoinQueueBody = z.infer<typeof joinQueueSchema>;
export type JoinTokenBody = z.infer<typeof joinTokenSchema>;
