import { apiClient } from '@/lib/api-client';

import type { GuestCheckoutValues } from '../schemas/guest-checkout.schema';

export type CheckoutLocationOption = {
  id: string;
  label: string;
};

export type GuestOrderPayload = {
  items: Array<{ productId: string; quantity: number }>;
  delivery: GuestCheckoutValues;
  idempotencyKey: string;
};

export type GuestOrderResponse = {
  order: {
    id: string;
    reference: string;
    status: string;
    subtotalMillimes: number;
    deliveryFeeMillimes: number;
    totalMillimes: number;
    currency: 'TND';
  };
  message: string;
};

export const guestOrderApi = {
  async listGovernorates(): Promise<CheckoutLocationOption[]> {
    const response = await apiClient.get<{ governorates: CheckoutLocationOption[] }>('/orders/locations/governorates');
    return response.data.governorates;
  },
  async listCities(governorateId: string): Promise<CheckoutLocationOption[]> {
    const response = await apiClient.get<{ cities: CheckoutLocationOption[] }>('/orders/locations/cities', {
      params: { governorateId },
    });
    return response.data.cities;
  },
  async listLocalities(cityId: string): Promise<CheckoutLocationOption[]> {
    const response = await apiClient.get<{ localities: CheckoutLocationOption[] }>('/orders/locations/localities', {
      params: { cityId },
    });
    return response.data.localities;
  },
  async getPostalCode(localityId: string): Promise<string> {
    const response = await apiClient.get<{ postalCode: string }>('/orders/locations/postal-code', {
      params: { localityId },
    });
    return response.data.postalCode;
  },
  async createGuestOrder(payload: GuestOrderPayload): Promise<GuestOrderResponse> {
    const response = await apiClient.post<GuestOrderResponse>(
      '/orders/guest',
      {
        items: payload.items,
        delivery: payload.delivery,
      },
      {
        headers: {
          'Idempotency-Key': payload.idempotencyKey,
        },
      },
    );

    return response.data;
  },
};
