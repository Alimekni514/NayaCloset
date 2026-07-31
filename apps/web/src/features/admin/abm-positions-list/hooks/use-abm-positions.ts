import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AbmPositionsQuery } from '@delivery-commerce/shared';

import { apiErrorUtils } from '@/lib/api-client';

import { deleteAbmPosition, listAbmPositions } from '../api/abm-positions-api';

export type AbmPositionsQueryParams = AbmPositionsQuery;

/** Build the TanStack Query key for the positions list. */
export function abmPositionsQueryKey(params: AbmPositionsQueryParams) {
  return [
    'admin',
    'abm',
    'positions',
    {
      from: params.from,
      to: params.to,
    },
  ] as const;
}

/** Determines if a query should be retried based on the error status. */
function shouldRetry(failureCount: number, error: unknown): boolean {
  if (apiErrorUtils.isApiError(error)) {
    const { status } = error;
    if (status === 400 || status === 401 || status === 403) return false;
  }
  return failureCount < 1;
}

/** Fetch and cache the complete ABM positions list for a date range. */
export function useAbmPositions(params: AbmPositionsQueryParams) {
  return useQuery({
    queryKey: abmPositionsQueryKey(params),
    queryFn: () => listAbmPositions(params),
    placeholderData: (previousData) => previousData,
    staleTime: 30_000,
    retry: shouldRetry,
  });
}

/** Delete a single ABM position and invalidate the positions query on success. */
export function useDeleteAbmPosition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (positionId: string) => deleteAbmPosition(positionId),
    onSuccess: () => {
      // Invalidate all positions queries regardless of params
      void queryClient.invalidateQueries({
        queryKey: ['admin', 'abm', 'positions'],
      });
    },
  });
}
