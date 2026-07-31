import { apiClient } from '@/lib/api-client';
export const adminOrdersApi = {
    async list(query = {}) {
        const response = await apiClient.get('/admin/orders', { params: query });
        return response.data;
    },
    async detail(orderId) {
        const response = await apiClient.get(`/admin/orders/${orderId}`);
        return response.data;
    },
    async approve(orderId) {
        const response = await apiClient.post(`/admin/orders/${orderId}/approve`);
        return response.data;
    },
    async decline(orderId, reason) {
        const response = await apiClient.post(`/admin/orders/${orderId}/decline`, {
            ...(reason?.trim() ? { reason: reason.trim() } : {}),
        });
        return response.data;
    },
    async retry(orderId) {
        const response = await apiClient.post(`/admin/orders/${orderId}/retry-abm`);
        return response.data;
    },
};
