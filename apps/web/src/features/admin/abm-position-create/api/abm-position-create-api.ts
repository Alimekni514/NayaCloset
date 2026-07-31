import {
  abmLocationOptionSchema,
  abmPositionFormOptionsSchema,
  abmPostalCodeResponseSchema,
  createAbmPositionResponseSchema,
  type AbmLocationOption,
  type AbmPositionFormOptions,
  type CreateAbmPositionRequest,
  type CreateAbmPositionResponse,
} from '@delivery-commerce/shared';
import { z } from 'zod';

import { apiClient } from '@/lib/api-client';

const wrapArray = <T>(schema: { parse: (value: unknown) => T }) => ({
  parse: (value: unknown) => schema.parse(value),
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

export type AbmAddressDetailResponse = z.infer<typeof abmAddressDetailResponseSchema>;

export const abmPositionCreateApi = {
  async getFormOptions(): Promise<AbmPositionFormOptions> {
    const response = await apiClient.get<{ options: AbmPositionFormOptions }>('/admin/abm/positions/form-options');
    return abmPositionFormOptionsSchema.parse(response.data.options);
  },
  async getGovernorates(): Promise<AbmLocationOption[]> {
    const response = await apiClient.get<{ governorates: AbmLocationOption[] }>('/admin/abm/locations/governorates');
    return wrapArray(abmLocationOptionSchema.array()).parse(response.data.governorates);
  },
  async getCities(governorateId: string): Promise<AbmLocationOption[]> {
    const response = await apiClient.get<{ cities: AbmLocationOption[] }>('/admin/abm/locations/cities', {
      params: { governorateId },
    });
    return wrapArray(abmLocationOptionSchema.array()).parse(response.data.cities);
  },
  async getLocalities(cityId: string): Promise<AbmLocationOption[]> {
    const response = await apiClient.get<{ localities: AbmLocationOption[] }>('/admin/abm/locations/localities', {
      params: { cityId },
    });
    return wrapArray(abmLocationOptionSchema.array()).parse(response.data.localities);
  },
  async getPostalCode(localityId: string) {
    const response = await apiClient.get('/admin/abm/locations/postal-code', {
      params: { localityId },
    });
    return abmPostalCodeResponseSchema.parse(response.data);
  },
  async getPickupAddress(id: string): Promise<AbmAddressDetailResponse> {
    const response = await apiClient.get<{ address: AbmAddressDetailResponse }>(`/admin/abm/positions/addresses/pickup/${id}`);
    return abmAddressDetailResponseSchema.parse(response.data.address);
  },
  async getDeliveryAddress(id: string): Promise<AbmAddressDetailResponse> {
    const response = await apiClient.get<{ address: AbmAddressDetailResponse }>(`/admin/abm/positions/addresses/delivery/${id}`);
    return abmAddressDetailResponseSchema.parse(response.data.address);
  },
  async createPosition(payload: CreateAbmPositionRequest): Promise<CreateAbmPositionResponse> {
    const response = await apiClient.post('/admin/abm/positions', payload);
    return createAbmPositionResponseSchema.parse(response.data);
  },
};
