// Minimal circuit breaker. After `threshold` consecutive failures it opens and
// fails fast for `cooldownMs`, then allows a half-open trial before closing.

export type CircuitState = 'closed' | 'open' | 'half-open';

export class CircuitOpenError extends Error {
  constructor(name: string) {
    super(`${name} is temporarily unavailable. Please try again shortly.`);
    this.name = 'CircuitOpenError';
  }
}

export class CircuitBreaker {
  private failures = 0;
  private openedAt = 0;
  private readonly name: string;
  private readonly threshold: number;
  private readonly cooldownMs: number;
  private readonly now: () => number;

  constructor(name = 'service', threshold = 5, cooldownMs = 15_000, now: () => number = Date.now) {
    this.name = name;
    this.threshold = threshold;
    this.cooldownMs = cooldownMs;
    this.now = now;
  }

  get state(): CircuitState {
    if (this.failures < this.threshold) return 'closed';
    if (this.now() - this.openedAt >= this.cooldownMs) return 'half-open';
    return 'open';
  }

  async run<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') throw new CircuitOpenError(this.name);
    try {
      const result = await fn();
      this.reset();
      return result;
    } catch (err) {
      this.failures += 1;
      if (this.failures >= this.threshold) this.openedAt = this.now();
      throw err;
    }
  }

  reset() {
    this.failures = 0;
    this.openedAt = 0;
  }
}
