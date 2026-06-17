import { useEffect } from 'react';
import { supabasePublic } from '@/lib/supabase';

/**
 * Anonymous customer live updates. Subscribes to the public, PII-free broadcast
 * topic `queue:<queueId>` (emitted by a DB trigger on every entry change) and
 * runs `onPing` to refetch status the moment the line moves. Polling remains as a
 * fallback, so updates are reliable even if the socket drops.
 */
export function useQueuePing(queueId: string | undefined, onPing: () => void): void {
  useEffect(() => {
    if (!queueId) return;
    const channel = supabasePublic
      .channel(`queue:${queueId}`, { config: { private: false } })
      .on('broadcast', { event: 'changed' }, () => onPing())
      .subscribe();

    return () => {
      void supabasePublic.removeChannel(channel);
    };
  }, [queueId, onPing]);
}
