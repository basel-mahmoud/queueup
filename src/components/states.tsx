import type { ReactNode } from 'react';
import { AlertCircle, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getErrorMessage } from '@/utils/errors';

/** Empty state with optional call-to-action. */
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-10 text-center">
      <span className="text-muted-foreground mb-3">{icon ?? <Inbox className="size-8" />}</span>
      <h3 className="font-semibold">{title}</h3>
      {description ? (
        <p className="text-muted-foreground mt-1 max-w-sm text-sm">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

/** Inline error state with retry. Shows a safe message — never a raw stack trace. */
export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <div
      role="alert"
      className="border-destructive/30 bg-destructive/5 flex flex-col items-center justify-center rounded-xl border p-10 text-center"
    >
      <AlertCircle className="text-destructive mb-3 size-8" aria-hidden />
      <h3 className="font-semibold">Couldn’t load this</h3>
      <p className="text-muted-foreground mt-1 max-w-sm text-sm">{getErrorMessage(error)}</p>
      {onRetry ? (
        <Button variant="outline" className="mt-4" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}

/** Skeleton grid placeholder for list/card views. */
export function LoadingGrid({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-32 w-full rounded-xl" />
      ))}
    </div>
  );
}
