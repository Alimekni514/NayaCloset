import { apiClient } from '@/lib/api-client';

export type AdminOrderListItem = {
  id: string;
  reference: string;
  status: string;
  customerName: string;
  mobile: string;
  destination: string;
  itemsCount: number;
  subtotalMillimes: number;
  deliveryFeeMillimes: number;
  totalMillimes: number;
  currency: 'TND';
  createdAt: string;
  abmPositionId?: string;
  abmErrorMessage?: string;
};

export type AdminOrdersResponse = {
  items: AdminOrderListItem[];
  summary: {
    pending: number;
    approving: number;
    abmCreated: number;
    abmFailed: number;
    pendingTotalMillimes: number;
  };
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
};

export type AdminOrderDetail = {
  order: {
    id: string;
    reference: string;
    status: string;
    customer: {
      userId?: string;
      contactLastName: string;
      contactFirstName?: string;
      mobile: string;
      phone?: string;
    };
    deliveryAddress: {
      addressLine1: string;
      addressLine2?: string;
      governorate: { abmId: string; label: string };
      city: { abmId: string; label: string };
      locality: { abmId: string; label: string };
      postalCode: string;
    };
    items: Array<{
      productId: string;
      productName: string;
      productImage?: string;
      unitPriceMillimes: number;
      quantity: number;
      lineTotalMillimes: number;
      selectedColor?: string;
      selectedSize?: string;
    }>;
    contentSummary: string;
    subtotalMillimes: number;
    deliveryFeeMillimes: number;
    totalMillimes: number;
    currency: 'TND';
    submittedAt: string;
    approvedAt?: string;
    abm?: {
      positionId?: string;
      barcode?: string;
      statusText?: string;
      createdAt?: string;
      lastErrorCode?: string;
      lastErrorMessage?: string;
      attemptCount: number;
    };
    abmPreview: {
      pickup: Record<string, string>;
      delivery: Record<string, string>;
      parcel: Record<string, string>;
      service: Record<string, string>;
    };
  };
};

export const adminOrdersApi = {
  async list(query: Record<string, unknown> = {}): Promise<AdminOrdersResponse> {
    const response = await apiClient.get<AdminOrdersResponse>('/admin/orders', { params: query });
    return response.data;
  },
  async detail(orderId: string): Promise<AdminOrderDetail> {
    const response = await apiClient.get<AdminOrderDetail>(`/admin/orders/${orderId}`);
    return response.data;
  },
  async approve(orderId: string) {
    const response = await apiClient.post(`/admin/orders/${orderId}/approve`);
    return response.data;
  },
  async decline(orderId: string, reason?: string) {
    const response = await apiClient.post(`/admin/orders/${orderId}/decline`, {
      ...(reason?.trim() ? { reason: reason.trim() } : {}),
    });
    return response.data;
  },
  async retry(orderId: string) {
    const response = await apiClient.post(`/admin/orders/${orderId}/retry-abm`);
    return response.data;
  },
};
