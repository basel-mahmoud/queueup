import { ZodError } from 'zod';

/** Friendly, generic fallback shown to users (Section 9.6 — never expose internals). */
export const GENERIC_ERROR_MESSAGE =
  "Something went wrong. We're looking into it — please try refreshing.";

/** HTTP-ish error carrying a status code, thrown by the API/edge layer. */
export class ApiError extends Error {
  readonly status: number;
  readonly retryAfter: number | undefined;

  constructor(message: string, status = 500, retryAfter?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.retryAfter = retryAfter;
  }
}

export function isRateLimitError(error: unknown): error is ApiError {
  return error instanceof ApiError && error.status === 429;
}

/**
 * Extract a safe, human-readable message from an unknown error. Zod issues are
 * surfaced (they describe user input), but arbitrary errors collapse to the generic
 * message so stack traces / internals never reach the UI.
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof ZodError) {
    return error.issues[0]?.message ?? 'Please check your input and try again.';
  }
  if (error instanceof ApiError) {
    return error.message || GENERIC_ERROR_MESSAGE;
  }
  if (error instanceof Error && error.message && import.meta.env.DEV) {
    return error.message;
  }
  return GENERIC_ERROR_MESSAGE;
}
