import type { ReactNode } from 'react';
import { Navigate, useLocation } from '@tanstack/react-router';

import { useCurrentUser } from '../hooks/use-current-user';

const sanitizeRedirect = (redirect: string): string => {
  if (!redirect.startsWith('/') || redirect.startsWith('//') || redirect.startsWith('/connexion')) {
    return '/compte';
  }

  return redirect;
};

export const AuthGuard = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const { state, user } = useCurrentUser();

  if (state === 'loading') {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 text-sm text-muted-foreground sm:px-6">
        Chargement du compte...
      </div>
    );
  }

  if (state !== 'authenticated') {
    return (
      <Navigate
        to="/connexion"
        search={{ redirect: sanitizeRedirect(`${location.pathname}${location.searchStr}`) }}
        replace
      />
    );
  }

  if (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
};
