import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { FullPageSpinner } from '@/components/full-page-spinner';
import { useProfileSync } from '@/features/auth/use-profile-sync';

/**
 * Gates authenticated routes. While Clerk resolves, shows a spinner; if not
 * signed in, redirects to /sign-in preserving the intended destination. Note
 * this is convenience UX only — the real authorization boundary is Postgres RLS.
 */
export function ProtectedRoute() {
  const { isLoaded, isSignedIn } = useAuth();
  const location = useLocation();
  useProfileSync();

  if (!isLoaded) return <FullPageSpinner label="Checking your session…" />;
  if (!isSignedIn) {
    return <Navigate to="/sign-in" replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
}
