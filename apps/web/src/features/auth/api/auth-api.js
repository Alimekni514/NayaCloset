import { apiClient } from '@/lib/api-client';
export const authApi = {
    async getCurrentUser() {
        const response = await apiClient.get('/auth/me');
        return response.data.user;
    },
    async login(payload) {
        const response = await apiClient.post('/auth/login', payload);
        return response.data.user;
    },
    async register(payload) {
        const response = await apiClient.post('/auth/register', payload);
        return response.data.user;
    },
    async logout() {
        await apiClient.post('/auth/logout');
    },
    async refresh() {
        const response = await apiClient.post('/auth/refresh');
        return response.data.user;
    },
};
