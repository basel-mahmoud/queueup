import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import { useSupabase } from '@/hooks/use-supabase';
import { slugify } from '@/lib/constants';
import type { Tables, TablesUpdate } from '@/types/supabase';
import type { BusinessCreateInput, BusinessUpdateInput } from '@/lib/schemas';

export type Business = Tables<'businesses'>;
export type Member = Tables<'business_members'>;
export type Profile = Tables<'profiles'>;
export type MemberWithProfile = Member & { profile: Profile | null };

export const businessKeys = {
  all: ['businesses'] as const,
  detail: (id: string) => ['businesses', id] as const,
  members: (id: string) => ['businesses', id, 'members'] as const,
};

/** Businesses the signed-in user belongs to (RLS scopes the result). */
export function useBusinesses() {
  const supabase = useSupabase();
  return useQuery({
    queryKey: businessKeys.all,
    queryFn: async (): Promise<Business[]> => {
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export function useBusiness(id: string | undefined) {
  const supabase = useSupabase();
  return useQuery({
    queryKey: id ? businessKeys.detail(id) : ['businesses', 'none'],
    enabled: Boolean(id),
    queryFn: async (): Promise<Business> => {
      const { data, error } = await supabase.from('businesses').select('*').eq('id', id!).single();
      if (error) throw error;
      return data;
    },
  });
}

/** A short random suffix keeps slugs unique without a round-trip race. */
function uniqueSlug(name: string): string {
  const base = slugify(name) || 'business';
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base}-${suffix}`.slice(0, 40);
}

export function useCreateBusiness() {
  const supabase = useSupabase();
  const { userId } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: BusinessCreateInput): Promise<Business> => {
      if (!userId) throw new Error('Not signed in');
      const { data, error } = await supabase
        .from('businesses')
        .insert({
          owner_id: userId,
          name: input.name,
          slug: uniqueSlug(input.name),
          description: input.description ?? null,
        })
        .select('*')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: businessKeys.all }),
  });
}

export function useUpdateBusiness(id: string) {
  const supabase = useSupabase();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: BusinessUpdateInput): Promise<Business> => {
      // Build a clean patch: omit undefined keys, normalize empty description to null.
      const patch: TablesUpdate<'businesses'> = {};
      if (input.name !== undefined) patch.name = input.name;
      if (input.slug !== undefined) patch.slug = input.slug;
      if (input.description !== undefined) patch.description = input.description || null;
      if (input.is_active !== undefined) patch.is_active = input.is_active;

      const { data, error } = await supabase
        .from('businesses')
        .update(patch)
        .eq('id', id)
        .select('*')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.setQueryData(businessKeys.detail(id), data);
      void qc.invalidateQueries({ queryKey: businessKeys.all });
    },
  });
}

/** Members of a business, joined to their profile for display. Admin-only writes. */
export function useMembers(businessId: string | undefined) {
  const supabase = useSupabase();
  return useQuery({
    queryKey: businessId ? businessKeys.members(businessId) : ['members', 'none'],
    enabled: Boolean(businessId),
    queryFn: async (): Promise<MemberWithProfile[]> => {
      const { data, error } = await supabase
        .from('business_members')
        .select('*, profile:profiles(*)')
        .eq('business_id', businessId!)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as unknown as MemberWithProfile[];
    },
  });
}

export function useUpdateMemberRole(businessId: string) {
  const supabase = useSupabase();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ memberId, role }: { memberId: string; role: Member['role'] }) => {
      const { error } = await supabase.from('business_members').update({ role }).eq('id', memberId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: businessKeys.members(businessId) }),
  });
}

export function useRemoveMember(businessId: string) {
  const supabase = useSupabase();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase.from('business_members').delete().eq('id', memberId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: businessKeys.members(businessId) }),
  });
}

/** Current user's role within a business (drives admin-only UI). */
export function useMyRole(businessId: string | undefined): Member['role'] | null {
  const { userId } = useAuth();
  const { data } = useMembers(businessId);
  if (!userId || !data) return null;
  return data.find((m) => m.user_id === userId)?.role ?? null;
}
