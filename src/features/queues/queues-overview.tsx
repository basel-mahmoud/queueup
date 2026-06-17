import { Link, useParams } from 'react-router-dom';
import { Clock, ListOrdered, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorState, LoadingGrid } from '@/components/states';
import { CreateQueueDialog } from '@/features/queues/create-queue-dialog';
import { useDeleteQueue, useQueues, useUpdateQueue } from '@/features/queues/api';
import { useMyRole } from '@/features/business/api';
import { isAdminRole } from '@/types/domain';
import { getErrorMessage } from '@/utils/errors';

export function QueuesOverview() {
  const { businessId } = useParams<{ businessId: string }>();
  const id = businessId!;
  const { data, isLoading, isError, error, refetch } = useQueues(id);
  const updateQueue = useUpdateQueue(id);
  const deleteQueue = useDeleteQueue(id);
  const role = useMyRole(id);
  const canAdmin = isAdminRole(role);

  const toggleOpen = async (queueId: string, isOpen: boolean) => {
    try {
      await updateQueue.mutateAsync({ id: queueId, input: { is_open: !isOpen } });
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const remove = async (queueId: string) => {
    if (!confirm('Delete this queue and all its entries? This cannot be undone.')) return;
    try {
      await deleteQueue.mutateAsync(queueId);
      toast.success('Queue deleted');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Queues</h2>
        {canAdmin && data && data.length > 0 ? <CreateQueueDialog businessId={id} /> : null}
      </div>

      {isLoading ? <LoadingGrid /> : null}
      {isError ? <ErrorState error={error} onRetry={() => void refetch()} /> : null}

      {data && data.length === 0 ? (
        <EmptyState
          icon={<ListOrdered className="size-8" />}
          title="No queues yet"
          description={
            canAdmin
              ? 'Create a queue (e.g. “Haircut”) so customers can join the line.'
              : 'An admin needs to create a queue first.'
          }
          action={canAdmin ? <CreateQueueDialog businessId={id} /> : undefined}
        />
      ) : null}

      {data && data.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((q) => (
            <Card key={q.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle>{q.name}</CardTitle>
                  <Badge variant={q.is_open ? 'success' : 'secondary'}>
                    {q.is_open ? 'Open' : 'Closed'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-4">
                <div className="text-muted-foreground flex items-center gap-1 text-sm">
                  <Clock className="size-4" aria-hidden /> ~{q.avg_service_minutes} min per customer
                </div>
                <div className="mt-auto flex flex-wrap gap-2">
                  <Button asChild size="sm">
                    <Link to={`queues/${q.id}`}>
                      <Users aria-hidden /> Open board
                    </Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void toggleOpen(q.id, q.is_open)}
                  >
                    {q.is_open ? 'Close' : 'Open'}
                  </Button>
                  {canAdmin ? (
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="Delete queue"
                      onClick={() => void remove(q.id)}
                    >
                      <Trash2 className="text-destructive" aria-hidden />
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}
    </div>
  );
}
