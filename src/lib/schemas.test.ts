import { describe, expect, it } from 'vitest';
import {
  joinQueueSchema,
  businessCreateSchema,
  queueCreateSchema,
  inviteMemberSchema,
} from '@/lib/schemas';
import { LIMITS } from '@/lib/constants';

// A valid RFC-4122 v4 UUID (production queue ids come from gen_random_uuid()).
const VALID_UUID = '11111111-1111-4111-8111-111111111111';

describe('input validation (Section 9.2)', () => {
  it('accepts a well-formed join payload', () => {
    const result = joinQueueSchema.safeParse({
      queue_id: VALID_UUID,
      customer_name: 'Alex',
      party_size: 2,
    });
    expect(result.success).toBe(true);
  });

  it('rejects an empty customer name', () => {
    const result = joinQueueSchema.safeParse({
      queue_id: VALID_UUID,
      customer_name: '',
      party_size: 1,
    });
    expect(result.success).toBe(false);
  });

  it('rejects an out-of-range party size (abuse prevention)', () => {
    const result = joinQueueSchema.safeParse({
      queue_id: VALID_UUID,
      customer_name: 'Sam',
      party_size: 9999,
    });
    expect(result.success).toBe(false);
  });

  it('rejects a non-uuid queue id', () => {
    const result = joinQueueSchema.safeParse({
      queue_id: 'not-a-uuid',
      customer_name: 'Sam',
      party_size: 1,
    });
    expect(result.success).toBe(false);
  });

  it('treats a SQL-injection string as plain, length-bounded data (never executed)', () => {
    const payload = "Robert'); DROP TABLE queue_entries;--";
    const result = joinQueueSchema.safeParse({
      queue_id: VALID_UUID,
      customer_name: payload,
      party_size: 1,
    });
    // It validates as a normal string (parameterized queries make it inert),
    // and it is well under the length cap.
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.customer_name.length).toBeLessThanOrEqual(LIMITS.customerName.max);
    }
  });

  it('enforces the name length cap', () => {
    const result = businessCreateSchema.safeParse({ name: 'x'.repeat(500) });
    expect(result.success).toBe(false);
  });

  it('bounds avg service minutes', () => {
    expect(queueCreateSchema.safeParse({ name: 'Cut', avg_service_minutes: 0 }).success).toBe(
      false,
    );
    expect(queueCreateSchema.safeParse({ name: 'Cut', avg_service_minutes: 20 }).success).toBe(
      true,
    );
  });

  it('validates invite email + role', () => {
    expect(inviteMemberSchema.safeParse({ email: 'nope', role: 'staff' }).success).toBe(false);
    expect(inviteMemberSchema.safeParse({ email: 'a@b.com', role: 'wizard' }).success).toBe(false);
    expect(inviteMemberSchema.safeParse({ email: 'a@b.com', role: 'manager' }).success).toBe(true);
  });
});
