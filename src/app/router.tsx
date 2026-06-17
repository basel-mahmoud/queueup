import { createBrowserRouter } from 'react-router-dom';
import { LandingPage } from '@/features/marketing/landing';
import { SignInPage, SignUpPage } from '@/features/auth/auth-pages';
import { ProtectedRoute } from '@/features/auth/protected-route';
import { AppShell } from '@/components/layout/app-shell';
import { DashboardPage } from '@/features/business/dashboard-page';
import { RouteError } from '@/components/route-error';

/**
 * App routes.
 *   /                       public landing
 *   /sign-in, /sign-up      Clerk auth (catch-all for Clerk sub-routes)
 *   /app/*                  authenticated staff app (ProtectedRoute + AppShell)
 *   /q/:slug, /q/:slug/...  public customer flow (added in the customer milestone)
 */
export const router = createBrowserRouter([
  { path: '/', element: <LandingPage />, errorElement: <RouteError /> },
  { path: '/sign-in/*', element: <SignInPage /> },
  { path: '/sign-up/*', element: <SignUpPage /> },
  {
    element: <ProtectedRoute />,
    errorElement: <RouteError />,
    children: [
      {
        path: '/app',
        element: <AppShell />,
        children: [{ index: true, element: <DashboardPage /> }],
      },
    ],
  },
  { path: '*', element: <RouteError /> },
]);
