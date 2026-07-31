import { apiClient } from '@/lib/api-client';
export const guestOrderApi = {
    async listGovernorates() {
        const response = await apiClient.get('/orders/locations/governorates');
        return response.data.governorates;
    },
    async listCities(governorateId) {
        const response = await apiClient.get('/orders/locations/cities', {
            params: { governorateId },
        });
        return response.data.cities;
    },
    async listLocalities(cityId) {
        const response = await apiClient.get('/orders/locations/localities', {
            params: { cityId },
        });
        return response.data.localities;
    },
    async getPostalCode(localityId) {
        const response = await apiClient.get('/orders/locations/postal-code', {
            params: { localityId },
        });
        return response.data.postalCode;
    },
    async createGuestOrder(payload) {
        const response = await apiClient.post('/orders/guest', {
            items: payload.items,
            delivery: payload.delivery,
        }, {
            headers: {
                'Idempotency-Key': payload.idempotencyKey,
            },
        });
        return response.data;
    },
};
