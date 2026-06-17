import { useUser } from '@clerk/clerk-react';

/**
 * Placeholder dashboard — confirms the Clerk → Supabase auth bridge is live.
 * Replaced with the real business list (CRUD) in the next milestone.
 */
export function DashboardPage() {
  const { user } = useUser();
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-bold tracking-tight">
        Welcome{user?.firstName ? `, ${user.firstName}` : ''}
      </h1>
      <p className="text-muted-foreground">
        Your businesses will appear here. Authentication is wired up — business and queue management
        land in the next milestone.
      </p>
    </div>
  );
}
