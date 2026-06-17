import * as Sentry from '@sentry/react';
import { env } from '@/lib/env';
import { logger } from '@/utils/logger';

let initialized = false;

/**
 * Initialize error tracking (Sentry) if a DSN is configured. No-op without one,
 * so local dev and tests don't ship errors anywhere. Also installs global
 * handlers so nothing slips through (Section 9.6).
 */
export function initMonitoring(): void {
  if (env.VITE_SENTRY_DSN) {
    Sentry.init({
      dsn: env.VITE_SENTRY_DSN,
      environment: env.VITE_ENV,
      tracesSampleRate: 0.1,
      // Scrub anything that looks like PII before an event leaves the browser.
      sendDefaultPii: false,
      beforeSend(event) {
        if (event.request?.cookies) delete event.request.cookies;
        if (event.user) delete event.user.email;
        return event;
      },
    });
    initialized = true;
  }

  window.addEventListener('unhandledrejection', (e) => {
    logger.error('unhandledrejection', { reason: String(e.reason) });
    if (initialized) Sentry.captureException(e.reason);
  });
  window.addEventListener('error', (e) => {
    logger.error('window.onerror', { message: e.message });
    if (initialized) Sentry.captureException(e.error ?? e.message);
  });
}

/** Report a handled exception with optional, already-safe context. */
export function captureException(error: unknown, context?: Record<string, unknown>): void {
  if (initialized) {
    Sentry.captureException(error, context ? { extra: context } : undefined);
  }
}
