import { useEffect, useRef } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useSupabase } from '@/hooks/use-supabase';
import { logger } from '@/utils/logger';

/**
 * Mirrors the Clerk user into our `profiles` table on sign-in. profiles.id is the
 * Clerk user id, so this is an idempotent upsert of the current user's own row
 * (allowed by the profiles_insert/update RLS policies). Runs once per user id.
 */
export function useProfileSync(): void {
  const { isSignedIn, user } = useUser();
  const supabase = useSupabase();
  const syncedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!isSignedIn || !user) return;
    if (syncedFor.current === user.id) return;
    syncedFor.current = user.id;

    const profile = {
      id: user.id,
      display_name: user.fullName ?? user.username ?? 'Member',
      avatar_url: user.imageUrl ?? null,
      email: user.primaryEmailAddress?.emailAddress ?? null,
    };

    void supabase
      .from('profiles')
      .upsert(profile, { onConflict: 'id' })
      .then(({ error }) => {
        if (error) {
          // Non-fatal: the app still works; log for diagnostics (id only, no PII).
          logger.warn('profile sync failed', { userId: user.id, code: error.code });
          syncedFor.current = null; // allow a retry on next render
        } else {
          logger.info('profile synced', { userId: user.id });
        }
      });
  }, [isSignedIn, user, supabase]);
}
