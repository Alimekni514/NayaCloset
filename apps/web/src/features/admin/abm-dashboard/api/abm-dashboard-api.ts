import {
  abmDashboardResponseSchema,
  type AbmDashboardQuery,
  type AbmDashboardResponse,
} from '@delivery-commerce/shared';

import { apiClient } from '@/lib/api-client';

export const abmDashboardApi = {
  async getDashboard(query: AbmDashboardQuery): Promise<AbmDashboardResponse> {
    const response = await apiClient.get<{ dashboard: AbmDashboardResponse }>('/admin/abm/dashboard', {
      params: query.from && query.to ? query : {},
    });

    return abmDashboardResponseSchema.parse(response.data.dashboard);
  },
};
