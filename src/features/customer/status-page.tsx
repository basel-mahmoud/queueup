import { useNavigate, useParams } from 'react-router-dom';
import { BellRing, CheckCircle2, Clock, Users, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/states';
import { CustomerShell, formatEta } from '@/features/customer/customer-shell';
import { tokenStorageKey } from '@/features/customer/join-form';
import { useEntryStatus, useLeaveQueue, type EntryStatusResult } from '@/features/customer/api';
import { getErrorMessage } from '@/utils/errors';
import { TERMINAL_STATUSES } from '@/types/domain';

function ActiveStatus({ status }: { status: EntryStatusResult }) {
  const isCalled = status.status === 'called' || status.status === 'serving';
  return (
    <Card className={isCalled ? 'border-success' : undefined}>
      <CardContent className="space-y-6 p-6 text-center">
        {isCalled ? (
          <div className="space-y-2">
            <BellRing className="text-success mx-auto size-10" aria-hidden />
            <h2 className="text-xl font-bold">You’re up!</h2>
            <p className="text-muted-foreground text-sm">Please head to the counter.</p>
          </div>
        ) : (
          <>
            <div>
              <p className="text-muted-foreground text-sm">You’re number</p>
              <p className="text-primary text-6xl font-bold tabular-nums">
                {status.people_ahead + 1}
              </p>
              <p className="text-muted-foreground text-sm">
                {status.people_ahead === 0 ? 'You’re next!' : `${status.people_ahead} ahead of you`}
              </p>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Badge variant="secondary" className="gap-1">
                <Clock className="size-3" aria-hidden /> {formatEta(status.eta_minutes)}
              </Badge>
            </div>
          </>
        )}
        <p className="text-muted-foreground text-xs">
          {status.business_name} · {status.queue_name}
        </p>
      </CardContent>
    </Card>
  );
}

export function StatusPage() {
  const { slug, token } = useParams<{ slug: string; token: string }>();
  const navigate = useNavigate();
  const { data, isLoading, isError, error, refetch } = useEntryStatus(token);
  const leave = useLeaveQueue();

  const isTerminal = data ? TERMINAL_STATUSES.includes(data.status) : false;

  const handleLeave = async () => {
    if (!token) return;
    if (!confirm('Leave the line? You’ll lose your spot.')) return;
    try {
      await leave.mutateAsync(token);
      if (slug) localStorage.removeItem(tokenStorageKey(slug));
      toast.success('You’ve left the line');
      navigate(`/q/${slug}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const joinAgain = () => {
    if (slug) localStorage.removeItem(tokenStorageKey(slug));
    navigate(`/q/${slug}`);
  };

  return (
    <CustomerShell>
      {isLoading ? (
        <Skeleton className="h-64 w-full rounded-xl" />
      ) : isError ? (
        <div className="space-y-4">
          <ErrorState error={error} onRetry={() => void refetch()} />
          <Button variant="outline" className="w-full" onClick={joinAgain}>
            Back to join page
          </Button>
        </div>
      ) : data ? (
        <div className="space-y-4">
          <h1 className="text-lg font-semibold">Hi {data.customer_name} 👋</h1>

          {isTerminal ? (
            <Card>
              <CardContent className="space-y-4 p-6 text-center">
                {data.status === 'served' ? (
                  <CheckCircle2 className="text-success mx-auto size-10" aria-hidden />
                ) : (
                  <XCircle className="text-muted-foreground mx-auto size-10" aria-hidden />
                )}
                <h2 className="text-xl font-bold">
                  {data.status === 'served'
                    ? 'All done — thanks!'
                    : data.status === 'no_show'
                      ? 'Marked as a no-show'
                      : 'You left the line'}
                </h2>
                <Button className="w-full" onClick={joinAgain}>
                  Join again
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <ActiveStatus status={data} />
              <div className="text-muted-foreground flex items-center justify-center gap-1 text-xs">
                <Users className="size-3" aria-hidden /> Updates live as the line moves
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => void handleLeave()}
                disabled={leave.isPending}
              >
                Leave the line
              </Button>
            </>
          )}
        </div>
      ) : null}
    </CustomerShell>
  );
}
