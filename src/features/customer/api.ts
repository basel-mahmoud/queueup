import { useMutation, useQuery } from '@tanstack/react-query';
import { supabasePublic } from '@/lib/supabase';
import { env } from '@/lib/env';
import { ApiError } from '@/utils/errors';
import type { Tables } from '@/types/supabase';
import type { EntryStatus } from '@/types/domain';
import type { JoinQueueInput } from '@/lib/schemas';

export type PublicQueue = Pick<Tables<'queues'>, 'id' | 'name' | 'is_open' | 'avg_service_minutes'>;
export interface PublicBusiness {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

export interface JoinResult {
  join_token: string;
  status: EntryStatus;
  people_ahead: number;
  eta_minutes: number;
  position_in_line: number;
}

export interface EntryStatusResult {
  status: EntryStatus;
  people_ahead: number;
  eta_minutes: number;
  position_in_line: number;
  queue_id: string;
  queue_name: string;
  business_name: string;
  customer_name: string;
  created_at: string;
}

const FUNCTIONS_BASE = `${env.VITE_SUPABASE_URL.replace(/\/$/, '')}/functions/v1`;

/** Call an edge function; map non-2xx to a typed ApiError carrying status + retry. */
async function callEdge<T>(name: string, body: unknown): Promise<T> {
  const res = await fetch(`${FUNCTIONS_BASE}/${name}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const retryAfter = Number(res.headers.get('Retry-After')) || undefined;
  let payload: unknown = null;
  try {
    payload = await res.json();
  } catch {
    // non-JSON; leave null
  }
  if (!res.ok) {
    const message =
      (payload && typeof payload === 'object' && 'error' in payload
        ? String((payload as { error: unknown }).error)
        : null) ?? 'Request failed';
    throw new ApiError(message, res.status, retryAfter);
  }
  return payload as T;
}

/** Public business + its open queues, read via the anon client (RLS public policies). */
export function usePublicQueueData(slug: string | undefined) {
  return useQuery({
    queryKey: ['public-queue', slug],
    enabled: Boolean(slug),
    queryFn: async (): Promise<{ business: PublicBusiness; queues: PublicQueue[] }> => {
      const { data: business, error: bizErr } = await supabasePublic
        .from('businesses')
        .select('id, name, slug, description')
        .eq('slug', slug!)
        .eq('is_active', true)
        .maybeSingle();
      if (bizErr) throw bizErr;
      if (!business) throw new ApiError('This business was not found.', 404);

      const { data: queues, error: qErr } = await supabasePublic
        .from('queues')
        .select('id, name, is_open, avg_service_minutes')
        .eq('business_id', business.id)
        .eq('is_open', true)
        .order('position', { ascending: true });
      if (qErr) throw qErr;

      return { business, queues: queues ?? [] };
    },
  });
}

/** Retry transient edge failures (429/5xx/network) with exponential backoff.
 *  Safe only because the join is idempotent: the same key never double-joins. */
async function callEdgeWithRetry<T>(name: string, body: unknown, retries = 3): Promise<T> {
  let attempt = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      return await callEdge<T>(name, body);
    } catch (err) {
      attempt++;
      const transient = err instanceof ApiError && (err.status === 429 || err.status >= 500);
      if (attempt > retries || !transient) throw err;
      const backoff = Math.min(4000, 300 * 2 ** (attempt - 1));
      await new Promise((r) => setTimeout(r, backoff + Math.random() * backoff * 0.3));
    }
  }
}

export function useJoinQueue() {
  return useMutation({
    // One idempotency key per logical submission; reused across retries so a
    // dropped response or double-tap can never create a second queue entry.
    mutationFn: (input: JoinQueueInput) =>
      callEdgeWithRetry<JoinResult>('join-queue', {
        ...input,
        idempotency_key: crypto.randomUUID(),
      }),
  });
}

/** Polls the customer's live status. Polling is the reliable transport for the
 *  anonymous flow (entries are never anon-readable); a realtime ping refreshes
 *  it instantly when staff act (see useQueuePing). */
export function useEntryStatus(joinToken: string | undefined) {
  return useQuery({
    queryKey: ['entry-status', joinToken],
    enabled: Boolean(joinToken),
    refetchInterval: 5000,
    retry: (count, error) => !(error instanceof ApiError && error.status === 404) && count < 2,
    queryFn: () => callEdge<EntryStatusResult>('entry-status', { join_token: joinToken }),
  });
}

export function useLeaveQueue() {
  return useMutation({
    mutationFn: (joinToken: string) =>
      callEdge<{ status: EntryStatus }>('leave-queue', { join_token: joinToken }),
  });
}
