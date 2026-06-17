import { useRouteError, isRouteErrorResponse, Link, useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { logger } from '@/utils/logger';

/**
 * Router-level error element (Section 9.6). Renders a friendly fallback instead
 * of a raw stack trace; details go to logs/Sentry, never to the UI in prod.
 */
export function RouteError() {
  const error = useRouteError();
  const navigate = useNavigate();
  const is404 = isRouteErrorResponse(error) && error.status === 404;

  logger.error('route error', {
    status: isRouteErrorResponse(error) ? error.status : undefined,
    message: error instanceof Error ? error.message : String(error),
  });

  return (
    <div className="grid min-h-dvh place-items-center p-6">
      <Card className="max-w-md text-center">
        <CardHeader className="items-center">
          <span className="bg-destructive/15 text-destructive grid size-12 place-items-center rounded-full">
            <AlertTriangle className="size-6" aria-hidden />
          </span>
          <CardTitle>{is404 ? 'Page not found' : 'Something went wrong'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm">
            {is404
              ? "We couldn't find that page."
              : "We're looking into it — please try refreshing."}
          </p>
          <div className="flex justify-center gap-2">
            <Button variant="outline" onClick={() => navigate(0)}>
              Refresh
            </Button>
            <Button asChild>
              <Link to="/">Go home</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
