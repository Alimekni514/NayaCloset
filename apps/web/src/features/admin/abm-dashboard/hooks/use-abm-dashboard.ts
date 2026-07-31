import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { AbmDashboardQuery } from '@delivery-commerce/shared';

import { abmDashboardApi } from '../api/abm-dashboard-api';

export const useAbmDashboard = (query: AbmDashboardQuery) =>
  useQuery({
    queryKey: ['admin', 'abm', 'dashboard', { from: query.from ?? null, to: query.to ?? null }],
    queryFn: () => abmDashboardApi.getDashboard(query),
    staleTime: 45_000,
    placeholderData: keepPreviousData,
    retry: (failureCount, error) => {
      if (
        typeof error === 'object' &&
        error !== null &&
        'status' in error &&
        typeof error.status === 'number'
      ) {
        return error.status >= 500 && failureCount < 1;
      }

      return failureCount < 1;
    },
  });
