import { Component, type ErrorInfo, type ReactNode } from 'react';
import { logger } from '@/utils/logger';
import { captureException } from '@/lib/monitoring';

interface Props {
  children: ReactNode;
}
interface State {
  hasError: boolean;
}

/**
 * Top-level React error boundary (Section 9.6). Catches render-time errors
 * anywhere below it and shows a friendly fallback instead of a white screen or a
 * raw stack trace. Details are reported to Sentry + logs, never shown to users.
 */
export class RootErrorBoundary extends Component<Props, State> {
  override state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    logger.error('react render error', { message: error.message });
    captureException(error, { componentStack: info.componentStack ?? undefined });
  }

  override render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="grid min-h-dvh place-items-center p-6 text-center">
          <div className="max-w-md space-y-4">
            <h1 className="text-2xl font-bold">Something went wrong</h1>
            <p className="text-muted-foreground">
              We’re looking into it — please try refreshing the page.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="bg-primary text-primary-foreground inline-flex h-10 items-center rounded-md px-6 text-sm font-medium"
            >
              Refresh
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
