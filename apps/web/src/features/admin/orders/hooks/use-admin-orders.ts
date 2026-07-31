import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { adminOrdersApi } from '../api/admin-orders-api';

export const useAdminOrders = (query: Record<string, unknown>) =>
  useQuery({
    queryKey: ['admin-orders', query],
    queryFn: () => adminOrdersApi.list(query),
  });

export const useAdminOrderDetail = (orderId: string | null) =>
  useQuery({
    queryKey: ['admin-order-detail', orderId],
    queryFn: () => adminOrdersApi.detail(orderId!),
    enabled: Boolean(orderId),
  });

const useRefreshOrders = () => {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
    queryClient.invalidateQueries({ queryKey: ['admin-order-detail'] });
  };
};

export const useApproveOrder = () => {
  const refresh = useRefreshOrders();

  return useMutation({
    mutationFn: (orderId: string) => adminOrdersApi.approve(orderId),
    onSuccess: refresh,
  });
};

export const useDeclineOrder = () => {
  const refresh = useRefreshOrders();

  return useMutation({
    mutationFn: ({ orderId, reason }: { orderId: string; reason?: string }) =>
      adminOrdersApi.decline(orderId, reason),
    onSuccess: refresh,
  });
};

export const useRetryOrderAbm = () => {
  const refresh = useRefreshOrders();

  return useMutation({
    mutationFn: (orderId: string) => adminOrdersApi.retry(orderId),
    onSuccess: refresh,
  });
};
