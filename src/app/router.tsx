import { lazy, Suspense, type ComponentType } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { LandingPage } from '@/features/marketing/landing';
import { ClerkGate } from '@/features/auth/clerk-gate';
import { RouteError } from '@/components/route-error';
import { FullPageSpinner } from '@/components/full-page-spinner';

/** Lazy-load a named export and wrap it in a Suspense boundary (code-splitting). */
function lazyRoute(loader: () => Promise<Record<string, ComponentType>>, name: string) {
  const Comp = lazy(() => loader().then((m) => ({ default: m[name]! })));
  return (
    <Suspense fallback={<FullPageSpinner />}>
      <Comp />
    </Suspense>
  );
}

const authPages = () => import('@/features/auth/auth-pages');
const customer = () => import('@/features/customer/public-queue-page');
const status = () => import('@/features/customer/status-page');
const protectedRoute = () => import('@/features/auth/protected-route');
const appShell = () => import('@/components/layout/app-shell');
const dashboard = () => import('@/features/business/dashboard-page');
const businessLayout = () => import('@/features/business/business-layout');
const queuesOverview = () => import('@/features/queues/queues-overview');
const activityPage = () => import('@/features/activity/activity-page');
const membersPage = () => import('@/features/business/members-page');
const settingsPage = () => import('@/features/business/settings-page');
const boardPage = () => import('@/features/board/queue-board-page');

/**
 * App routes.
 *   /                                  public landing (no auth SDK)
 *   /q/:slug, /q/:slug/status/:token   public customer flow (no auth)
 *   /sign-in, /sign-up                 Clerk auth (under ClerkGate)
 *   /app/*                             authenticated staff app (RLS-protected)
 *
 * The auth/app subtree is code-split and wrapped in ClerkProvider via <ClerkGate>,
 * so public pages never load the auth SDK.
 */
export const router = createBrowserRouter([
  { path: '/', element: <LandingPage />, errorElement: <RouteError /> },
  {
    path: '/q/:slug',
    element: lazyRoute(customer, 'PublicQueuePage'),
    errorElement: <RouteError />,
  },
  {
    path: '/q/:slug/status/:token',
    element: lazyRoute(status, 'StatusPage'),
    errorElement: <RouteError />,
  },
  {
    element: <ClerkGate />,
    errorElement: <RouteError />,
    children: [
      { path: '/sign-in/*', element: lazyRoute(authPages, 'SignInPage') },
      { path: '/sign-up/*', element: lazyRoute(authPages, 'SignUpPage') },
      {
        element: lazyRoute(protectedRoute, 'ProtectedRoute'),
        children: [
          {
            path: '/app',
            element: lazyRoute(appShell, 'AppShell'),
            children: [
              { index: true, element: lazyRoute(dashboard, 'DashboardPage') },
              {
                path: 'b/:businessId',
                element: lazyRoute(businessLayout, 'BusinessLayout'),
                children: [
                  { index: true, element: lazyRoute(queuesOverview, 'QueuesOverview') },
                  { path: 'activity', element: lazyRoute(activityPage, 'ActivityPage') },
                  { path: 'members', element: lazyRoute(membersPage, 'MembersPage') },
                  { path: 'settings', element: lazyRoute(settingsPage, 'SettingsPage') },
                ],
              },
              {
                path: 'b/:businessId/queues/:queueId',
                element: lazyRoute(boardPage, 'QueueBoardPage'),
              },
            ],
          },
        ],
      },
    ],
  },
  { path: '*', element: <RouteError /> },
]);
