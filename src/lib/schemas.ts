import { z } from 'zod';
import { LIMITS, PHONE_REGEX, SLUG_REGEX } from '@/lib/constants';
import { ENTRY_STATUSES, ROLES } from '@/types/domain';

/**
 * Shared validation schemas (Section 9.2 — Input Validation).
 *
 * These run on the client for instant feedback AND are re-validated server-side in
 * the edge functions before any DB write, so the database never sees unvalidated
 * input. Every string is length-bounded to prevent abuse.
 */

const trimmed = (max: number) => z.string().trim().max(max);

export const businessCreateSchema = z.object({
  name: trimmed(LIMITS.businessName.max).min(LIMITS.businessName.min, 'Name is too short'),
  description: trimmed(LIMITS.businessDescription.max).optional(),
});
export type BusinessCreateInput = z.infer<typeof businessCreateSchema>;

export const businessUpdateSchema = z.object({
  name: trimmed(LIMITS.businessName.max).min(LIMITS.businessName.min).optional(),
  description: trimmed(LIMITS.businessDescription.max).optional(),
  slug: z
    .string()
    .trim()
    .min(LIMITS.slug.min)
    .max(LIMITS.slug.max)
    .regex(SLUG_REGEX, 'Use lowercase letters, numbers, and hyphens')
    .optional(),
  is_active: z.boolean().optional(),
});
export type BusinessUpdateInput = z.infer<typeof businessUpdateSchema>;

export const queueCreateSchema = z.object({
  name: trimmed(LIMITS.queueName.max).min(LIMITS.queueName.min, 'Name is required'),
  avg_service_minutes: z
    .number()
    .int()
    .min(LIMITS.avgServiceMinutes.min)
    .max(LIMITS.avgServiceMinutes.max),
});
export type QueueCreateInput = z.infer<typeof queueCreateSchema>;

export const queueUpdateSchema = z.object({
  name: trimmed(LIMITS.queueName.max).min(LIMITS.queueName.min).optional(),
  is_open: z.boolean().optional(),
  avg_service_minutes: z
    .number()
    .int()
    .min(LIMITS.avgServiceMinutes.min)
    .max(LIMITS.avgServiceMinutes.max)
    .optional(),
});
export type QueueUpdateInput = z.infer<typeof queueUpdateSchema>;

export const inviteMemberSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email').max(254),
  role: z.enum(ROLES),
});
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;

export const updateMemberRoleSchema = z.object({
  user_id: z.string().min(1),
  role: z.enum(ROLES),
});
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;

/** Public, unauthenticated customer payload — the most security-sensitive input. */
export const joinQueueSchema = z.object({
  queue_id: z.string().uuid('Invalid queue'),
  customer_name: trimmed(LIMITS.customerName.max).min(
    LIMITS.customerName.min,
    'Please enter your name',
  ),
  party_size: z
    .number()
    .int()
    .min(LIMITS.partySize.min, 'Party size must be at least 1')
    .max(LIMITS.partySize.max, `Party size can be at most ${LIMITS.partySize.max}`),
  phone: z
    .string()
    .trim()
    .regex(PHONE_REGEX, 'Enter a valid phone number')
    .optional()
    .or(z.literal('')),
});
export type JoinQueueInput = z.infer<typeof joinQueueSchema>;

/** Token-keyed lookups for the anonymous customer flow. */
export const joinTokenSchema = z.object({
  join_token: z.string().uuid('Invalid token'),
});
export type JoinTokenInput = z.infer<typeof joinTokenSchema>;

/** Staff-side manual walk-in entry. */
export const addWalkInSchema = z.object({
  queue_id: z.string().uuid(),
  customer_name: trimmed(LIMITS.customerName.max).min(LIMITS.customerName.min),
  party_size: z.number().int().min(LIMITS.partySize.min).max(LIMITS.partySize.max),
  phone: z.string().trim().regex(PHONE_REGEX).optional().or(z.literal('')),
});
export type AddWalkInInput = z.infer<typeof addWalkInSchema>;

export const updateEntryStatusSchema = z.object({
  entry_id: z.string().uuid(),
  status: z.enum(ENTRY_STATUSES),
});
export type UpdateEntryStatusInput = z.infer<typeof updateEntryStatusSchema>;
