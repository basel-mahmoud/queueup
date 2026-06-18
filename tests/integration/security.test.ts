import { describe, expect, it } from 'vitest';
import { createClient } from '@supabase/supabase-js';

// Live integration checks against the real Supabase project. They use only the
// public anon key, so they're safe to run in CI. Skipped automatically if env
// is absent. Run explicitly with: npm run test:run -- tests/integration
const URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const ready = Boolean(URL && ANON);

describe.skipIf(!ready)('RLS authorization (Section 9.1)', () => {
  // Fallback values keep collection from throwing in CI (where env is absent);
  // these tests are skipped (skipIf) unless real env is present, so they're unused.
  const anon = createClient(URL ?? 'http://localhost:54321', ANON ?? 'test-anon-key', {
    auth: { persistSession: false },
  });

  it('blocks anonymous reads of customer PII in queue_entries', async () => {
    // Rows exist (seeded), but RLS grants anon NO access to this table.
    const { data, error } = await anon.from('queue_entries').select('*');
    expect(error).toBeNull(); // RLS returns an empty set, not an error, for SELECT
    expect(data ?? []).toHaveLength(0);
  });

  it('blocks anonymous writes to businesses', async () => {
    const { error } = await anon.from('businesses').insert({
      owner_id: 'user_attacker',
      name: 'Evil Co',
      slug: `evil-${Date.now()}`,
    });
    expect(error).not.toBeNull(); // RLS WITH CHECK denies the insert
  });

  it('exposes only active businesses publicly (storefront info only)', async () => {
    const { data, error } = await anon.from('businesses').select('id, name, is_active');
    expect(error).toBeNull();
    expect((data ?? []).every((b) => b.is_active)).toBe(true);
  });
});

describe.skipIf(!ready)('rate limiting (Section 9.4)', () => {
  it('returns 429 once the per-IP join limit is exceeded', async () => {
    const url = `${URL!.replace(/\/$/, '')}/functions/v1/join-queue`;
    const body = JSON.stringify({
      queue_id: '00000000-0000-0000-0000-0000000000c1',
      customer_name: 'RL Probe',
      party_size: 1,
    });
    const statuses: number[] = [];
    for (let i = 0; i < 8; i++) {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:5173' },
        body,
      });
      statuses.push(res.status);
    }
    expect(statuses).toContain(429);
  }, 20000);
});
