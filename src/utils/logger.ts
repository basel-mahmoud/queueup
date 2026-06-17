/**
 * Client-side structured, leveled logger (Section 9.8).
 *
 * - Levels: debug < info < warn < error. Threshold is DEBUG in dev, INFO in prod.
 * - Every line carries a correlationId so a user session can be traced across logs.
 * - A redaction allow-list scrubs sensitive keys (tokens, passwords, emails, etc.)
 *   from any structured context BEFORE it is emitted. We never log raw PII/secrets.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_WEIGHT: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };

const MIN_LEVEL: LogLevel = import.meta.env.PROD ? 'info' : 'debug';

/** Keys whose values are always redacted, matched case-insensitively as substrings. */
const REDACT_KEYS = [
  'password',
  'token',
  'jwt',
  'secret',
  'authorization',
  'apikey',
  'api_key',
  'email',
  'phone',
  'card',
  'cvc',
  'ssn',
];

const REDACTED = '[redacted]';

function shouldRedact(key: string): boolean {
  const k = key.toLowerCase();
  return REDACT_KEYS.some((needle) => k.includes(needle));
}

/** Recursively scrub sensitive values from a context object before emitting. */
export function redact(value: unknown, seen = new WeakSet<object>()): unknown {
  if (value === null || typeof value !== 'object') return value;
  if (seen.has(value as object)) return '[circular]';
  seen.add(value as object);

  if (Array.isArray(value)) return value.map((v) => redact(v, seen));

  const out: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    out[key] = shouldRedact(key) ? REDACTED : redact(val, seen);
  }
  return out;
}

// One correlation id per page/session load; included on every log line.
const correlationId =
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

interface LogContext {
  [key: string]: unknown;
}

function emit(level: LogLevel, message: string, context?: LogContext): void {
  if (LEVEL_WEIGHT[level] < LEVEL_WEIGHT[MIN_LEVEL]) return;

  const line = {
    level,
    time: new Date().toISOString(),
    correlationId,
    message,
    ...(context ? { context: redact(context) } : {}),
  };

  const fn =
    level === 'error'
      ? console.error
      : level === 'warn'
        ? console.warn
        : level === 'debug'
          ? console.debug
          : console.info;
  fn(JSON.stringify(line));
}

export const logger = {
  debug: (message: string, context?: LogContext) => emit('debug', message, context),
  info: (message: string, context?: LogContext) => emit('info', message, context),
  warn: (message: string, context?: LogContext) => emit('warn', message, context),
  error: (message: string, context?: LogContext) => emit('error', message, context),
  correlationId,
};
