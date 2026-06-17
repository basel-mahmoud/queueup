import { Outlet, Link } from 'react-router-dom';
import { UserButton } from '@clerk/clerk-react';
import { ThemeToggle } from '@/components/theme-toggle';

/** Shell for authenticated pages: sticky header + routed content. */
export function AppShell() {
  return (
    <div className="min-h-dvh">
      <header className="bg-background/80 sticky top-0 z-40 border-b backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link to="/app" className="flex items-center gap-2 font-semibold">
            <span className="bg-primary text-primary-foreground grid size-7 place-items-center rounded-lg text-sm">
              Q
            </span>
            QueueUp
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: 'size-8' } }} />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}
