import { useQuery } from '@tanstack/react-query';
import type { AbmPositionDetail } from '@delivery-commerce/shared';

import { apiErrorUtils } from '@/lib/api-client';

import { getAbmPositionDetail } from '../api/abm-position-detail-api';

export const abmPositionDetailQueryKey = (positionId: string) =>
  ['admin', 'abm', 'position-detail', positionId] as const;

const isValidPositionId = (positionId: string) => /^\d{1,20}$/u.test(positionId);

const shouldRetry = (failureCount: number, error: unknown): boolean => {
  if (apiErrorUtils.isApiError(error) && [400, 401, 403, 404].includes(error.status)) {
    return false;
  }

  return failureCount < 1;
};

export function useAbmPositionDetail(positionId: string) {
  return useQuery<AbmPositionDetail>({
    queryKey: abmPositionDetailQueryKey(positionId),
    queryFn: () => getAbmPositionDetail(positionId),
    enabled: isValidPositionId(positionId),
    staleTime: 30_000,
    retry: shouldRetry,
    placeholderData: (previousData) => previousData,
  });
}

export { isValidPositionId };
