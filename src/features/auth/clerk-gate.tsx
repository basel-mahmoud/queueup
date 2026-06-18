import { ClerkProvider } from '@clerk/clerk-react';
import { Outlet } from 'react-router-dom';
import { env } from '@/lib/env';
import { useTheme } from '@/components/theme-provider';
import { MissingClerkKey } from '@/features/auth/missing-clerk-key';

/**
 * Mounts ClerkProvider around the auth + app routes only. Public routes (landing,
 * /q/*) render outside this, so they don't pull in the auth SDK. Without a key
 * (dev only — prod env validation fails the build), shows a config notice.
 */
export function ClerkGate() {
  const { resolvedTheme } = useTheme();
  if (!env.VITE_CLERK_PUBLISHABLE_KEY) return <MissingClerkKey />;
  return (
    <ClerkProvider
      publishableKey={env.VITE_CLERK_PUBLISHABLE_KEY}
      afterSignOutUrl="/"
      appearance={{
        variables: { colorPrimary: resolvedTheme === 'dark' ? '#818cf8' : '#4f46e5' },
      }}
    >
      <Outlet />
    </ClerkProvider>
  );
}
