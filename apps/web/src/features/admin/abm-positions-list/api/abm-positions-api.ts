import type { AbmPositionsQuery, AbmPositionsResponse } from '@delivery-commerce/shared';

import { apiClient } from '@/lib/api-client';

/** List ABM positions with optional filters/pagination. */
export async function listAbmPositions(params: AbmPositionsQuery): Promise<AbmPositionsResponse> {
  const response = await apiClient.get<AbmPositionsResponse>('/admin/abm/positions', {
    params,
  });
  return response.data;
}

/** Delete a single ABM position by its internal ID. */
export async function deleteAbmPosition(positionId: string): Promise<void> {
  await apiClient.delete(`/admin/abm/positions/${positionId}`);
}
