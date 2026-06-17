import { SignIn, SignUp } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';

function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh place-items-center p-6">
      <div className="flex flex-col items-center gap-6">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <span className="bg-primary text-primary-foreground grid size-8 place-items-center rounded-lg">
            Q
          </span>
          QueueUp
        </Link>
        {children}
      </div>
    </div>
  );
}

export function SignInPage() {
  return (
    <AuthLayout>
      <SignIn signUpUrl="/sign-up" forceRedirectUrl="/app" />
    </AuthLayout>
  );
}

export function SignUpPage() {
  return (
    <AuthLayout>
      <SignUp signInUrl="/sign-in" forceRedirectUrl="/app" />
    </AuthLayout>
  );
}
