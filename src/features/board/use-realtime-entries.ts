import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSupabase } from '@/hooks/use-supabase';
import { entryKeys } from '@/features/board/api';
import { logger } from '@/utils/logger';

/**
 * Live staff board. Subscribes to Postgres changes on this queue's entries
 * (RLS-scoped — only rows the member may read are delivered) and invalidates the
 * cached query so the board reflects joins/leaves/status changes instantly,
 * across every open staff device.
 */
export function useRealtimeEntries(queueId: string | undefined): void {
  const supabase = useSupabase();
  const qc = useQueryClient();

  useEffect(() => {
    if (!queueId) return;
    const channel = supabase
      .channel(`board:${queueId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'queue_entries',
          filter: `queue_id=eq.${queueId}`,
        },
        () => {
          void qc.invalidateQueries({ queryKey: entryKeys.forQueue(queueId) });
        },
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') logger.warn('board realtime error', { queueId });
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabase, qc, queueId]);
}
