import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { abmService, adminService, catalogService, customerService, orderService, type OrderQuery, type ProductQuery } from './api';
import type { StoreSettings } from './types';

export const qk = {
  categories: ['categories'] as const,
  products: (query: ProductQuery) => ['products', query] as const,
  product: (id: string) => ['product', id] as const,
  productsByIds: (ids: string[]) => ['products-by-ids', ids] as const,
  orders: (query: OrderQuery) => ['orders', query] as const,
  order: (id: string) => ['order', id] as const,
  customerOrders: (id: string) => ['customer-orders', id] as const,
  customers: (search: string) => ['customers', search] as const,
  abmPositions: ['abm-positions'] as const,
  abmStats: ['abm-stats'] as const,
  adminStats: ['admin-stats'] as const,
  auditLogs: ['audit-logs'] as const,
  settings: ['settings'] as const,
};

export const categoriesQuery = () =>
  queryOptions({ queryKey: qk.categories, queryFn: () => catalogService.listCategories() });

export const productsQuery = (query: ProductQuery = {}) =>
  queryOptions({ queryKey: qk.products(query), queryFn: () => catalogService.listProducts(query) });

export const productQuery = (id: string) =>
  queryOptions({ queryKey: qk.product(id), queryFn: () => catalogService.getProduct(id) });

export const useCategories = () => useQuery(categoriesQuery());
export const useProducts = (query: ProductQuery = {}) => useQuery(productsQuery(query));
export const useProduct = (id: string) => useQuery(productQuery(id));

export const useProductsByIds = (ids: string[]) =>
  useQuery({
    queryKey: qk.productsByIds(ids),
    queryFn: () => catalogService.getProductsByIds(ids),
    enabled: ids.length > 0,
  });

export const useOrders = (query: OrderQuery = {}) =>
  useQuery({ queryKey: qk.orders(query), queryFn: () => orderService.listOrders(query) });

export const useOrder = (id: string) =>
  useQuery({ queryKey: qk.order(id), queryFn: () => orderService.getOrder(id) });

export const useCustomerOrders = (customerId: string) =>
  useQuery({
    queryKey: qk.customerOrders(customerId),
    queryFn: () => orderService.listOrdersByCustomer(customerId),
    enabled: Boolean(customerId),
  });

export const useCustomers = (search = '') =>
  useQuery({ queryKey: qk.customers(search), queryFn: () => customerService.listCustomers(search) });

export const useAbmPositions = () =>
  useQuery({ queryKey: qk.abmPositions, queryFn: () => abmService.listPositions() });

export const useAbmStats = () =>
  useQuery({ queryKey: qk.abmStats, queryFn: () => abmService.stats() });

export const useAdminStats = () =>
  useQuery({ queryKey: qk.adminStats, queryFn: () => adminService.stats() });

export const useAuditLogs = () =>
  useQuery({ queryKey: qk.auditLogs, queryFn: () => adminService.listAuditLogs() });

export const useSettings = () =>
  useQuery({ queryKey: qk.settings, queryFn: () => adminService.getSettings() });

function useInvalidateOrders() {
  const client = useQueryClient();

  return () => {
    client.invalidateQueries({ queryKey: ['orders'] });
    client.invalidateQueries({ queryKey: ['order'] });
    client.invalidateQueries({ queryKey: ['customer-orders'] });
    client.invalidateQueries({ queryKey: qk.adminStats });
  };
}

export function useCreateOrder() {
  const invalidate = useInvalidateOrders();

  return useMutation({
    mutationFn: orderService.createOrder,
    onSuccess: invalidate,
  });
}

export function useUpdateSettings() {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (input: Partial<StoreSettings>) => adminService.updateSettings(input),
    onSuccess: () => client.invalidateQueries({ queryKey: qk.settings }),
  });
}
