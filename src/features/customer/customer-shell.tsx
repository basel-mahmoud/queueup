import type { ReactNode } from 'react';
import { ThemeToggle } from '@/components/theme-toggle';

/** Minimal, mobile-first chrome for the public (unauthenticated) customer pages. */
export function CustomerShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex max-w-md items-center justify-between px-4 py-4">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <span className="bg-primary text-primary-foreground grid size-6 place-items-center rounded-md text-xs">
            Q
          </span>
          QueueUp
        </div>
        <ThemeToggle />
      </header>
      <main className="mx-auto max-w-md px-4 pb-16">{children}</main>
    </div>
  );
}

/** Human-friendly wait estimate from minutes. */
export function formatEta(minutes: number): string {
  if (minutes <= 0) return 'about now';
  if (minutes < 60) return `~${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `~${h} hr ${m} min` : `~${h} hr`;
}
