import type { ReactNode } from 'react';
import { Navigate } from '@tanstack/react-router';

import { useCurrentUser } from '../hooks/use-current-user';

const sanitizeRedirect = (redirect: string): string => {
  if (!redirect.startsWith('/') || redirect.startsWith('//')) {
    return '/admin';
  }

  return redirect;
};

export const AdminGuard = ({
  children,
  redirect = '/admin',
}: {
  children: ReactNode;
  redirect?: string;
}) => {
  const { state, user } = useCurrentUser();

  if (state === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="space-y-2 text-center">
          <p className="font-display text-2xl font-semibold">Chargement de l&apos;administration</p>
          <p className="text-sm text-muted-foreground">
            Verification de votre session et de vos permissions...
          </p>
        </div>
      </div>
    );
  }

  if (state === 'unauthenticated') {
    return (
      <Navigate
        to="/connexion"
        search={{ redirect: sanitizeRedirect(redirect) }}
        replace
      />
    );
  }

  if (state !== 'authenticated' || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="space-y-2 text-center">
          <p className="font-display text-2xl font-semibold">Session en cours de verification</p>
          <p className="text-sm text-muted-foreground">
            Nous confirmons votre acces a l&apos;administration...
          </p>
        </div>
      </div>
    );
  }

  if (!['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
