import { abmDashboardResponseSchema, } from '@delivery-commerce/shared';
import { apiClient } from '@/lib/api-client';
export const abmDashboardApi = {
    async getDashboard(query) {
        const response = await apiClient.get('/admin/abm/dashboard', {
            params: query.from && query.to ? query : {},
        });
        return abmDashboardResponseSchema.parse(response.data.dashboard);
    },
};
