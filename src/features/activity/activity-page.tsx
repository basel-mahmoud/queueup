import { useParams } from 'react-router-dom';
import { Activity as ActivityIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState, ErrorState, LoadingGrid } from '@/components/states';
import { useActivity, type ActivityRow } from '@/features/activity/api';

function describe(row: ActivityRow): string {
  const actor = row.actor?.display_name ?? 'A teammate';
  const customer =
    typeof row.payload === 'object' && row.payload && 'customer' in row.payload
      ? String((row.payload as { customer: unknown }).customer)
      : 'a customer';
  switch (row.type) {
    case 'entry_joined':
      return 'Someone joined the line';
    case 'entry_left':
      return 'A customer left the line';
    case 'status_called':
      return `${actor} called ${customer}`;
    case 'status_serving':
      return `${actor} started serving ${customer}`;
    case 'status_served':
      return `${actor} marked ${customer} as served`;
    case 'status_no_show':
      return `${actor} marked ${customer} as a no-show`;
    case 'status_cancelled':
      return `${customer} cancelled`;
    default:
      return row.type.replace(/_/g, ' ');
  }
}

function timeAgo(iso: string): string {
  const secs = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 60) return 'just now';
  const mins = Math.round(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

export function ActivityPage() {
  const { businessId } = useParams<{ businessId: string }>();
  const { data, isLoading, isError, error, refetch } = useActivity(businessId);

  if (isLoading) return <LoadingGrid count={2} />;
  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;
  if (data && data.length === 0) {
    return (
      <EmptyState
        icon={<ActivityIcon className="size-8" />}
        title="No activity yet"
        description="Joins, calls, and completed visits will show up here."
      />
    );
  }

  return (
    <Card>
      <CardContent className="divide-y p-0">
        {data?.map((row) => (
          <div key={row.id} className="flex items-center justify-between gap-3 px-4 py-3">
            <span className="text-sm">{describe(row)}</span>
            <span className="text-muted-foreground shrink-0 text-xs">
              {timeAgo(row.created_at)}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
