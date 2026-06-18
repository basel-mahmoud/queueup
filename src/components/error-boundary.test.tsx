import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RootErrorBoundary } from '@/components/error-boundary';

function Boom(): never {
  throw new Error('kaboom: internal detail that must not be shown');
}

describe('RootErrorBoundary (Section 9.6)', () => {
  beforeEach(() => {
    // React logs the caught error; silence it for a clean test run.
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders a friendly fallback instead of a raw stack trace', () => {
    render(
      <RootErrorBoundary>
        <Boom />
      </RootErrorBoundary>,
    );
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument();
    // The internal error detail is never surfaced to the user.
    expect(screen.queryByText(/kaboom/i)).not.toBeInTheDocument();
  });

  it('renders children when there is no error', () => {
    render(
      <RootErrorBoundary>
        <p>all good</p>
      </RootErrorBoundary>,
    );
    expect(screen.getByText('all good')).toBeInTheDocument();
  });
});
