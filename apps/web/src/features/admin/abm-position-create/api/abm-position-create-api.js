import { abmLocationOptionSchema, abmPositionFormOptionsSchema, abmPostalCodeResponseSchema, createAbmPositionResponseSchema, } from '@delivery-commerce/shared';
import { z } from 'zod';
import { apiClient } from '@/lib/api-client';
const wrapArray = (schema) => ({
    parse: (value) => schema.parse(value),
});
const optionalText = z.string().trim().optional().or(z.literal(''));
const abmAddressDetailResponseSchema = z.object({
    id: optionalText,
    contactLastName: optionalText,
    contactFirstName: optionalText,
    addressLine1: optionalText,
    addressLine2: optionalText,
    governorateId: optionalText,
    governorateName: optionalText,
    cityId: optionalText,
    cityName: optionalText,
    localityId: optionalText,
    localityName: optionalText,
    postalCode: optionalText,
    mobile: optionalText,
    phone: optionalText,
    fax: optionalText,
    email: optionalText,
});
export const abmPositionCreateApi = {
    async getFormOptions() {
        const response = await apiClient.get('/admin/abm/positions/form-options');
        return abmPositionFormOptionsSchema.parse(response.data.options);
    },
    async getGovernorates() {
        const response = await apiClient.get('/admin/abm/locations/governorates');
        return wrapArray(abmLocationOptionSchema.array()).parse(response.data.governorates);
    },
    async getCities(governorateId) {
        const response = await apiClient.get('/admin/abm/locations/cities', {
            params: { governorateId },
        });
        return wrapArray(abmLocationOptionSchema.array()).parse(response.data.cities);
    },
    async getLocalities(cityId) {
        const response = await apiClient.get('/admin/abm/locations/localities', {
            params: { cityId },
        });
        return wrapArray(abmLocationOptionSchema.array()).parse(response.data.localities);
    },
    async getPostalCode(localityId) {
        const response = await apiClient.get('/admin/abm/locations/postal-code', {
            params: { localityId },
        });
        return abmPostalCodeResponseSchema.parse(response.data);
    },
    async getPickupAddress(id) {
        const response = await apiClient.get(`/admin/abm/positions/addresses/pickup/${id}`);
        return abmAddressDetailResponseSchema.parse(response.data.address);
    },
    async getDeliveryAddress(id) {
        const response = await apiClient.get(`/admin/abm/positions/addresses/delivery/${id}`);
        return abmAddressDetailResponseSchema.parse(response.data.address);
    },
    async createPosition(payload) {
        const response = await apiClient.post('/admin/abm/positions', payload);
        return createAbmPositionResponseSchema.parse(response.data);
    },
};
