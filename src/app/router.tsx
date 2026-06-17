import { createBrowserRouter } from 'react-router-dom';
import { LandingPage } from '@/features/marketing/landing';
import { SignInPage, SignUpPage } from '@/features/auth/auth-pages';
import { ProtectedRoute } from '@/features/auth/protected-route';
import { AppShell } from '@/components/layout/app-shell';
import { DashboardPage } from '@/features/business/dashboard-page';
import { BusinessLayout } from '@/features/business/business-layout';
import { QueuesOverview } from '@/features/queues/queues-overview';
import { MembersPage } from '@/features/business/members-page';
import { SettingsPage } from '@/features/business/settings-page';
import { QueueBoardPage } from '@/features/board/queue-board-page';
import { PublicQueuePage } from '@/features/customer/public-queue-page';
import { StatusPage } from '@/features/customer/status-page';
import { RouteError } from '@/components/route-error';

/**
 * App routes.
 *   /                            public landing
 *   /sign-in, /sign-up           Clerk auth
 *   /app                         dashboard (business list)
 *   /app/b/:businessId           business (overview/staff/settings tabs)
 *   /app/b/:businessId/queues/:queueId   live staff board
 *   /q/:slug, /q/:slug/status/:token     public customer flow (next milestone)
 */
export const router = createBrowserRouter([
  { path: '/', element: <LandingPage />, errorElement: <RouteError /> },
  { path: '/sign-in/*', element: <SignInPage /> },
  { path: '/sign-up/*', element: <SignUpPage /> },
  // Public customer flow (no auth) — entries are reached only via edge functions.
  { path: '/q/:slug', element: <PublicQueuePage />, errorElement: <RouteError /> },
  { path: '/q/:slug/status/:token', element: <StatusPage />, errorElement: <RouteError /> },
  {
    element: <ProtectedRoute />,
    errorElement: <RouteError />,
    children: [
      {
        path: '/app',
        element: <AppShell />,
        children: [
          { index: true, element: <DashboardPage /> },
          {
            path: 'b/:businessId',
            element: <BusinessLayout />,
            children: [
              { index: true, element: <QueuesOverview /> },
              { path: 'members', element: <MembersPage /> },
              { path: 'settings', element: <SettingsPage /> },
            ],
          },
          { path: 'b/:businessId/queues/:queueId', element: <QueueBoardPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <RouteError /> },
]);
