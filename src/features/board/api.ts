import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSupabase } from '@/hooks/use-supabase';
import type { Tables } from '@/types/supabase';
import type { EntryStatus } from '@/types/domain';
import type { AddWalkInInput } from '@/lib/schemas';

export type Entry = Tables<'queue_entries'>;

export const entryKeys = {
  forQueue: (queueId: string) => ['entries', queueId] as const,
};

/** All non-terminal-or-recent entries for a queue, ordered by position. */
export function useEntries(queueId: string | undefined) {
  const supabase = useSupabase();
  return useQuery({
    queryKey: queueId ? entryKeys.forQueue(queueId) : ['entries', 'none'],
    enabled: Boolean(queueId),
    queryFn: async (): Promise<Entry[]> => {
      const { data, error } = await supabase
        .from('queue_entries')
        .select('*')
        .eq('queue_id', queueId!)
        .order('position', { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

/** Timestamp side effects for status transitions. */
function statusPatch(status: EntryStatus): Partial<Entry> {
  const now = new Date().toISOString();
  switch (status) {
    case 'called':
      return { status, called_at: now, notified_at: now };
    case 'serving':
      return { status };
    case 'served':
      return { status, served_at: now };
    default:
      return { status };
  }
}

export function useUpdateEntryStatus(queueId: string) {
  const supabase = useSupabase();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ entryId, status }: { entryId: string; status: EntryStatus }) => {
      const { error } = await supabase
        .from('queue_entries')
        .update(statusPatch(status))
        .eq('id', entryId);
      if (error) throw error;
    },
    // Optimistic update for snappy staff UX; rolled back on error.
    onMutate: async ({ entryId, status }) => {
      await qc.cancelQueries({ queryKey: entryKeys.forQueue(queueId) });
      const previous = qc.getQueryData<Entry[]>(entryKeys.forQueue(queueId));
      qc.setQueryData<Entry[]>(entryKeys.forQueue(queueId), (old) =>
        (old ?? []).map((e) => (e.id === entryId ? { ...e, ...statusPatch(status) } : e)),
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(entryKeys.forQueue(queueId), ctx.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: entryKeys.forQueue(queueId) }),
  });
}

export function useAddWalkIn(queueId: string, businessId: string) {
  const supabase = useSupabase();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: AddWalkInInput): Promise<Entry> => {
      const { data: maxRow } = await supabase
        .from('queue_entries')
        .select('position')
        .eq('queue_id', queueId)
        .order('position', { ascending: false })
        .limit(1)
        .maybeSingle();
      const nextPos = (maxRow?.position ?? 0) + 1;

      const { data, error } = await supabase
        .from('queue_entries')
        .insert({
          queue_id: queueId,
          business_id: businessId,
          customer_name: input.customer_name,
          party_size: input.party_size,
          customer_phone: input.phone ? input.phone : null,
          position: nextPos,
        })
        .select('*')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: entryKeys.forQueue(queueId) }),
  });
}
