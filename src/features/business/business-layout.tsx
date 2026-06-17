import { NavLink, Outlet, useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/states';
import { useBusiness } from '@/features/business/api';

const tabs = [
  { to: '.', label: 'Overview', end: true },
  { to: 'activity', label: 'Activity', end: false },
  { to: 'members', label: 'Staff', end: false },
  { to: 'settings', label: 'Settings', end: false },
];

export function BusinessLayout() {
  const { businessId } = useParams<{ businessId: string }>();
  const { data: business, isLoading, isError, error, refetch } = useBusiness(businessId);

  return (
    <div className="space-y-6">
      <Link
        to="/app"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" aria-hidden /> All businesses
      </Link>

      {isLoading ? (
        <Skeleton className="h-9 w-64" />
      ) : isError ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : business ? (
        <>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{business.name}</h1>
            <p className="text-muted-foreground text-sm">Public link: /q/{business.slug}</p>
          </div>

          <nav className="flex gap-1 border-b">
            {tabs.map((tab) => (
              <NavLink
                key={tab.label}
                to={tab.to}
                end={tab.end}
                className={({ isActive }) =>
                  cn(
                    'border-b-2 px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'border-primary text-foreground'
                      : 'text-muted-foreground hover:text-foreground border-transparent',
                  )
                }
              >
                {tab.label}
              </NavLink>
            ))}
          </nav>

          <Outlet />
        </>
      ) : null}
    </div>
  );
}
