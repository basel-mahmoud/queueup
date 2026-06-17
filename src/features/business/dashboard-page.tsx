import { Link } from 'react-router-dom';
import { Building2, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState, ErrorState, LoadingGrid } from '@/components/states';
import { CreateBusinessDialog } from '@/features/business/create-business-dialog';
import { useBusinesses } from '@/features/business/api';

export function DashboardPage() {
  const { data, isLoading, isError, error, refetch } = useBusinesses();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Your businesses</h1>
          <p className="text-muted-foreground">Manage queues and staff for each location.</p>
        </div>
        {data && data.length > 0 ? <CreateBusinessDialog /> : null}
      </div>

      {isLoading ? <LoadingGrid /> : null}
      {isError ? <ErrorState error={error} onRetry={() => void refetch()} /> : null}

      {data && data.length === 0 ? (
        <EmptyState
          icon={<Building2 className="size-8" />}
          title="No businesses yet"
          description="Create your first business to start running a live queue."
          action={<CreateBusinessDialog triggerLabel="Create your first business" />}
        />
      ) : null}

      {data && data.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((b) => (
            <Link key={b.id} to={`/app/b/${b.id}`} className="group">
              <Card className="group-hover:border-primary/50 h-full transition-colors">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="text-muted-foreground size-4" aria-hidden />
                      {b.name}
                    </CardTitle>
                    {b.is_active ? null : <Badge variant="secondary">Archived</Badge>}
                  </div>
                  {b.description ? (
                    <CardDescription className="line-clamp-2">{b.description}</CardDescription>
                  ) : null}
                </CardHeader>
                <CardContent className="text-muted-foreground flex items-center justify-between text-sm">
                  <span>/q/{b.slug}</span>
                  <ChevronRight
                    className="size-4 transition-transform group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
