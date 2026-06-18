import { describe, expect, it } from 'vitest';
import { redact } from '@/utils/logger';

describe('log redaction (Section 9.8)', () => {
  it('scrubs sensitive keys but keeps safe ones', () => {
    const out = redact({
      userId: 'user_123',
      password: 'hunter2',
      token: 'eyJabc',
      email: 'a@b.com',
      phone: '+15551234567',
      duration: 2100,
    }) as Record<string, unknown>;

    expect(out.userId).toBe('user_123');
    expect(out.duration).toBe(2100);
    expect(out.password).toBe('[redacted]');
    expect(out.token).toBe('[redacted]');
    expect(out.email).toBe('[redacted]');
    expect(out.phone).toBe('[redacted]');
  });

  it('redacts nested sensitive values', () => {
    const out = redact({ request: { headers: { authorization: 'Bearer x' } } }) as {
      request: { headers: { authorization: string } };
    };
    expect(out.request.headers.authorization).toBe('[redacted]');
  });

  it('handles circular references safely', () => {
    const obj: Record<string, unknown> = { a: 1 };
    obj.self = obj;
    expect(() => redact(obj)).not.toThrow();
  });
});
