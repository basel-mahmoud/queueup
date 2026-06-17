import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSupabase } from '@/hooks/use-supabase';
import type { Tables, TablesUpdate } from '@/types/supabase';
import { DEFAULT_AVG_SERVICE_MINUTES } from '@/lib/constants';
import type { QueueCreateInput, QueueUpdateInput } from '@/lib/schemas';

export type Queue = Tables<'queues'>;

export const queueKeys = {
  forBusiness: (businessId: string) => ['queues', businessId] as const,
  detail: (queueId: string) => ['queue', queueId] as const,
};

export function useQueues(businessId: string | undefined) {
  const supabase = useSupabase();
  return useQuery({
    queryKey: businessId ? queueKeys.forBusiness(businessId) : ['queues', 'none'],
    enabled: Boolean(businessId),
    queryFn: async (): Promise<Queue[]> => {
      const { data, error } = await supabase
        .from('queues')
        .select('*')
        .eq('business_id', businessId!)
        .order('position', { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export function useQueue(queueId: string | undefined) {
  const supabase = useSupabase();
  return useQuery({
    queryKey: queueId ? queueKeys.detail(queueId) : ['queue', 'none'],
    enabled: Boolean(queueId),
    queryFn: async (): Promise<Queue> => {
      const { data, error } = await supabase.from('queues').select('*').eq('id', queueId!).single();
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateQueue(businessId: string) {
  const supabase = useSupabase();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: QueueCreateInput): Promise<Queue> => {
      // Append to the end: next position = current count.
      const { count } = await supabase
        .from('queues')
        .select('id', { count: 'exact', head: true })
        .eq('business_id', businessId);
      const { data, error } = await supabase
        .from('queues')
        .insert({
          business_id: businessId,
          name: input.name,
          avg_service_minutes: input.avg_service_minutes || DEFAULT_AVG_SERVICE_MINUTES,
          position: count ?? 0,
        })
        .select('*')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queueKeys.forBusiness(businessId) }),
  });
}

export function useUpdateQueue(businessId: string) {
  const supabase = useSupabase();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: QueueUpdateInput }): Promise<Queue> => {
      const patch: TablesUpdate<'queues'> = {};
      if (input.name !== undefined) patch.name = input.name;
      if (input.is_open !== undefined) patch.is_open = input.is_open;
      if (input.avg_service_minutes !== undefined)
        patch.avg_service_minutes = input.avg_service_minutes;

      const { data, error } = await supabase
        .from('queues')
        .update(patch)
        .eq('id', id)
        .select('*')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.setQueryData(queueKeys.detail(data.id), data);
      void qc.invalidateQueries({ queryKey: queueKeys.forBusiness(businessId) });
    },
  });
}

export function useDeleteQueue(businessId: string) {
  const supabase = useSupabase();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('queues').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queueKeys.forBusiness(businessId) }),
  });
}
