import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import {
  ApiError,
  GENERIC_ERROR_MESSAGE,
  getErrorMessage,
  isRateLimitError,
} from '@/utils/errors';

describe('error helpers (Section 9.6)', () => {
  it('surfaces a Zod issue message', () => {
    const result = z.object({ n: z.string() }).safeParse({ n: 1 });
    if (!result.success) {
      expect(getErrorMessage(result.error)).toBeTruthy();
    }
  });

  it('returns the generic message for unknown errors (no internals leaked)', () => {
    expect(getErrorMessage({ weird: true })).toBe(GENERIC_ERROR_MESSAGE);
    expect(getErrorMessage(null)).toBe(GENERIC_ERROR_MESSAGE);
  });

  it('detects rate-limit errors', () => {
    expect(isRateLimitError(new ApiError('slow down', 429, 30))).toBe(true);
    expect(isRateLimitError(new ApiError('nope', 400))).toBe(false);
    expect(isRateLimitError(new Error('x'))).toBe(false);
  });

  it('preserves ApiError status + retryAfter', () => {
    const err = new ApiError('Too many requests', 429, 42);
    expect(err.status).toBe(429);
    expect(err.retryAfter).toBe(42);
  });
});
