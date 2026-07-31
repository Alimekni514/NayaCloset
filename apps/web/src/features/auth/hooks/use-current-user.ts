import { useQuery } from '@tanstack/react-query';

import { authApi } from '../api/auth-api';
import { authQueryKeys } from '../auth-query-keys';
import type { AuthApiError } from '../auth-types';

import { apiErrorUtils } from '@/lib/api-client';

const hasSessionHint = () => Boolean(apiErrorUtils.readCsrfToken());

export const useCurrentUser = () => {
  const query = useQuery({
    queryKey: authQueryKeys.currentUser,
    queryFn: authApi.getCurrentUser,
    enabled: hasSessionHint(),
    retry: false,
    staleTime: 60_000,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });

  const error = query.error as AuthApiError | null;
  const isUnauthenticated = error?.status === 401;
  const sessionHint = hasSessionHint();

  return {
    ...query,
    user: query.data ?? null,
    state: query.isLoading
      ? 'loading'
      : query.data
        ? 'authenticated'
        : !sessionHint || isUnauthenticated
          ? 'unauthenticated'
          : query.isError
            ? 'error'
            : 'unauthenticated',
    isAuthenticated: Boolean(query.data),
    isUnauthenticated: !sessionHint || isUnauthenticated,
  } as const;
};
