import { describe, it, expect } from 'vitest';
import { CircuitBreaker, CircuitOpenError } from './circuit-breaker';

describe('CircuitBreaker (fault injection)', () => {
  it('opens after the threshold and fails fast without calling through', async () => {
    let clock = 0;
    const cb = new CircuitBreaker('test', 3, 1000, () => clock);
    const boom = () => Promise.reject(new Error('boom'));
    for (let i = 0; i < 3; i++) await expect(cb.run(boom)).rejects.toThrow('boom');
    expect(cb.state).toBe('open');

    let called = false;
    await expect(
      cb.run(async () => {
        called = true;
        return 'ok';
      }),
    ).rejects.toBeInstanceOf(CircuitOpenError);
    expect(called).toBe(false);

    clock += 1000;
    expect(cb.state).toBe('half-open');
    await expect(cb.run(async () => 'recovered')).resolves.toBe('recovered');
    expect(cb.state).toBe('closed');
  });
});
