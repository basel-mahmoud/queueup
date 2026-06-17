import { useQuery } from '@tanstack/react-query';
import { useSupabase } from '@/hooks/use-supabase';
import type { Tables } from '@/types/supabase';

export type ActivityRow = Tables<'activity'> & {
  actor: { display_name: string | null } | null;
};

export function useActivity(businessId: string | undefined) {
  const supabase = useSupabase();
  return useQuery({
    queryKey: ['activity', businessId],
    enabled: Boolean(businessId),
    refetchInterval: 15000,
    queryFn: async (): Promise<ActivityRow[]> => {
      const { data, error } = await supabase
        .from('activity')
        .select('*, actor:profiles(display_name)')
        .eq('business_id', businessId!)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as unknown as ActivityRow[];
    },
  });
}
