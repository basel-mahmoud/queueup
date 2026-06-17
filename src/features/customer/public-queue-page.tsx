import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Clock, DoorClosed } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState, ErrorState } from '@/components/states';
import { CustomerShell } from '@/features/customer/customer-shell';
import { JoinForm, tokenStorageKey } from '@/features/customer/join-form';
import { usePublicQueueData } from '@/features/customer/api';

export function PublicQueuePage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { data, isLoading, isError, error, refetch } = usePublicQueueData(slug);

  // If this device already joined this business, jump straight to their status.
  useEffect(() => {
    if (!slug) return;
    const existing = localStorage.getItem(tokenStorageKey(slug));
    if (existing) navigate(`/q/${slug}/status/${existing}`, { replace: true });
  }, [slug, navigate]);

  return (
    <CustomerShell>
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      ) : isError ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : data ? (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{data.business.name}</h1>
            {data.business.description ? (
              <p className="text-muted-foreground mt-1 text-sm">{data.business.description}</p>
            ) : null}
          </div>

          {data.queues.length === 0 ? (
            <EmptyState
              icon={<DoorClosed className="size-8" />}
              title="No open lines right now"
              description="Please check back when the business reopens its queue."
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Join the line</CardTitle>
                <CardDescription className="flex items-center gap-1">
                  <Clock className="size-3.5" aria-hidden /> Avg ~
                  {data.queues[0]?.avg_service_minutes} min per customer
                </CardDescription>
              </CardHeader>
              <CardContent>
                <JoinForm
                  slug={slug!}
                  queues={data.queues}
                  onJoined={(token) => navigate(`/q/${slug}/status/${token}`)}
                />
              </CardContent>
            </Card>
          )}
        </div>
      ) : null}
    </CustomerShell>
  );
}
