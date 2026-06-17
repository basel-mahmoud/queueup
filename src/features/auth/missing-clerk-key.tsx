import { KeyRound } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Shown only in development when VITE_CLERK_PUBLISHABLE_KEY is absent. In
 * production, env validation fails the build instead (see src/lib/env.ts), so
 * this never renders for end users.
 */
export function MissingClerkKey() {
  return (
    <div className="grid min-h-dvh place-items-center p-6">
      <Card className="max-w-md">
        <CardHeader>
          <span className="bg-warning/15 text-warning grid size-10 place-items-center rounded-lg">
            <KeyRound className="size-5" aria-hidden />
          </span>
          <CardTitle>Clerk isn’t configured yet</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground space-y-2 text-sm">
          <p>
            Set <code className="text-foreground">VITE_CLERK_PUBLISHABLE_KEY</code> in your{' '}
            <code className="text-foreground">.env.local</code> to enable authentication.
          </p>
          <p>
            Create an app at{' '}
            <a className="text-primary underline" href="https://dashboard.clerk.com">
              dashboard.clerk.com
            </a>
            , then connect it to Supabase under Third-Party Auth.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
