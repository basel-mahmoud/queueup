import type { ReactNode } from 'react';
import { ClerkProvider } from '@clerk/clerk-react';
import { QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { queryClient } from '@/lib/query-client';
import { env } from '@/lib/env';
import { useTheme } from '@/components/theme-provider';
import { MissingClerkKey } from '@/features/auth/missing-clerk-key';

/** Bridges our theme into Clerk's component theming. */
function ClerkWithTheme({ children }: { children: ReactNode }) {
  const { resolvedTheme } = useTheme();
  return (
    <ClerkProvider
      publishableKey={env.VITE_CLERK_PUBLISHABLE_KEY}
      afterSignOutUrl="/"
      appearance={{
        variables: {
          colorPrimary: resolvedTheme === 'dark' ? '#818cf8' : '#4f46e5',
        },
      }}
    >
      {children}
    </ClerkProvider>
  );
}

/**
 * App-wide context providers (composition root). Theme wraps everything so both
 * the app and Clerk's hosted components follow the active theme.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  const hasClerkKey = Boolean(env.VITE_CLERK_PUBLISHABLE_KEY);
  return (
    <ThemeProvider defaultTheme="system">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider delayDuration={200}>
          {hasClerkKey ? <ClerkWithTheme>{children}</ClerkWithTheme> : <MissingClerkKey />}
          <Toaster position="top-right" richColors />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
