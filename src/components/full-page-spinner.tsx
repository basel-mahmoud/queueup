import { Loader2 } from 'lucide-react';

/** Centered loading state for route-level suspense / auth resolution. */
export function FullPageSpinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="grid min-h-dvh place-items-center" role="status" aria-live="polite">
      <div className="text-muted-foreground flex flex-col items-center gap-3">
        <Loader2 className="size-6 animate-spin" aria-hidden />
        <span className="text-sm">{label}</span>
      </div>
    </div>
  );
}
