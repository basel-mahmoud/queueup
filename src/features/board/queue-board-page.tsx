import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, PhoneCall } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState, ErrorState } from '@/components/states';
import { AddWalkInDialog } from '@/features/board/add-walkin-dialog';
import { EntryCard } from '@/features/board/entry-card';
import { useEntries, useUpdateEntryStatus, type Entry } from '@/features/board/api';
import { useRealtimeEntries } from '@/features/board/use-realtime-entries';
import { useQueue } from '@/features/queues/api';
import type { EntryStatus } from '@/types/domain';
import { getErrorMessage } from '@/utils/errors';

const COLUMNS: { key: EntryStatus; title: string }[] = [
  { key: 'waiting', title: 'Waiting' },
  { key: 'called', title: 'Called' },
  { key: 'serving', title: 'Serving' },
];

export function QueueBoardPage() {
  const { businessId, queueId } = useParams<{ businessId: string; queueId: string }>();
  const qid = queueId!;
  const queue = useQueue(qid);
  const { data: entries, isLoading, isError, error, refetch } = useEntries(qid);
  const updateStatus = useUpdateEntryStatus(qid);
  useRealtimeEntries(qid);

  const act = async (entryId: string, status: EntryStatus) => {
    try {
      await updateStatus.mutateAsync({ entryId, status });
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const callNext = async () => {
    const next = entries?.find((e) => e.status === 'waiting');
    if (!next) return;
    await act(next.id, 'called');
    toast.success(`Called ${next.customer_name}`);
  };

  const byStatus = (s: EntryStatus): Entry[] => (entries ?? []).filter((e) => e.status === s);
  const waitingCount = byStatus('waiting').length;

  return (
    <div className="space-y-6">
      <Link
        to={`/app/b/${businessId}`}
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" aria-hidden /> Back to business
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            {queue.data?.name ?? <Skeleton className="h-7 w-32" />}
            {queue.data ? (
              <Badge variant={queue.data.is_open ? 'success' : 'secondary'}>
                {queue.data.is_open ? 'Open' : 'Closed'}
              </Badge>
            ) : null}
          </h1>
          <p className="text-muted-foreground text-sm">{waitingCount} waiting</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => void callNext()} disabled={waitingCount === 0}>
            <PhoneCall aria-hidden /> Call next
          </Button>
          {businessId ? <AddWalkInDialog queueId={qid} businessId={businessId} /> : null}
        </div>
      </div>

      {isError ? <ErrorState error={error} onRetry={() => void refetch()} /> : null}

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {COLUMNS.map((c) => (
            <Skeleton key={c.key} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {COLUMNS.map((col) => {
            const items = byStatus(col.key);
            return (
              <section key={col.key} className="space-y-3">
                <h2 className="text-muted-foreground flex items-center gap-2 text-sm font-semibold">
                  {col.title}
                  <Badge variant="outline">{items.length}</Badge>
                </h2>
                {items.length === 0 ? (
                  <p className="text-muted-foreground rounded-lg border border-dashed p-4 text-center text-sm">
                    Nobody here
                  </p>
                ) : (
                  items.map((entry) => (
                    <EntryCard
                      key={entry.id}
                      entry={entry}
                      disabled={updateStatus.isPending}
                      onAction={(status) => void act(entry.id, status)}
                    />
                  ))
                )}
              </section>
            );
          })}
        </div>
      )}

      {entries && entries.length === 0 ? (
        <EmptyState
          title="The line is empty"
          description="Add a walk-in, or share your QR code so customers can join."
        />
      ) : null}
    </div>
  );
}
