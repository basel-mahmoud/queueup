import { lazy, Suspense, type ComponentType } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { LandingPage } from '@/features/marketing/landing';
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

/**
 * App routes. The authenticated app, auth pages, and customer flow are each
 * code-split so the public landing loads a minimal bundle.
 *   /                            public landing
 *   /sign-in, /sign-up           Clerk auth
 *   /q/:slug, /q/:slug/status/:token   public customer flow (no auth)
 *   /app/*                       authenticated staff app (RLS-protected)
 */
export const router = createBrowserRouter([
  { path: '/', element: <LandingPage />, errorElement: <RouteError /> },
  { path: '/sign-in/*', element: lazyRoute(authPages, 'SignInPage') },
  { path: '/sign-up/*', element: lazyRoute(authPages, 'SignUpPage') },
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
    element: lazyRoute(() => import('@/features/auth/protected-route'), 'ProtectedRoute'),
    errorElement: <RouteError />,
    children: [
      {
        path: '/app',
        element: lazyRoute(() => import('@/components/layout/app-shell'), 'AppShell'),
        children: [
          {
            index: true,
            element: lazyRoute(() => import('@/features/business/dashboard-page'), 'DashboardPage'),
          },
          {
            path: 'b/:businessId',
            element: lazyRoute(
              () => import('@/features/business/business-layout'),
              'BusinessLayout',
            ),
            children: [
              {
                index: true,
                element: lazyRoute(
                  () => import('@/features/queues/queues-overview'),
                  'QueuesOverview',
                ),
              },
              {
                path: 'activity',
                element: lazyRoute(
                  () => import('@/features/activity/activity-page'),
                  'ActivityPage',
                ),
              },
              {
                path: 'members',
                element: lazyRoute(() => import('@/features/business/members-page'), 'MembersPage'),
              },
              {
                path: 'settings',
                element: lazyRoute(
                  () => import('@/features/business/settings-page'),
                  'SettingsPage',
                ),
              },
            ],
          },
          {
            path: 'b/:businessId/queues/:queueId',
            element: lazyRoute(() => import('@/features/board/queue-board-page'), 'QueueBoardPage'),
          },
        ],
      },
    ],
  },
  { path: '*', element: <RouteError /> },
]);
