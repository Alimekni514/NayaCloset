import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { abmService, adminService, catalogService, customerService, orderService } from './api';
export const qk = {
    categories: ['categories'],
    products: (query) => ['products', query],
    product: (id) => ['product', id],
    productsByIds: (ids) => ['products-by-ids', ids],
    orders: (query) => ['orders', query],
    order: (id) => ['order', id],
    customerOrders: (id) => ['customer-orders', id],
    customers: (search) => ['customers', search],
    abmPositions: ['abm-positions'],
    abmStats: ['abm-stats'],
    adminStats: ['admin-stats'],
    auditLogs: ['audit-logs'],
    settings: ['settings'],
};
export const categoriesQuery = () => queryOptions({ queryKey: qk.categories, queryFn: () => catalogService.listCategories() });
export const productsQuery = (query = {}) => queryOptions({ queryKey: qk.products(query), queryFn: () => catalogService.listProducts(query) });
export const productQuery = (id) => queryOptions({ queryKey: qk.product(id), queryFn: () => catalogService.getProduct(id) });
export const useCategories = () => useQuery(categoriesQuery());
export const useProducts = (query = {}) => useQuery(productsQuery(query));
export const useProduct = (id) => useQuery(productQuery(id));
export const useProductsByIds = (ids) => useQuery({
    queryKey: qk.productsByIds(ids),
    queryFn: () => catalogService.getProductsByIds(ids),
    enabled: ids.length > 0,
});
export const useOrders = (query = {}) => useQuery({ queryKey: qk.orders(query), queryFn: () => orderService.listOrders(query) });
export const useOrder = (id) => useQuery({ queryKey: qk.order(id), queryFn: () => orderService.getOrder(id) });
export const useCustomerOrders = (customerId) => useQuery({
    queryKey: qk.customerOrders(customerId),
    queryFn: () => orderService.listOrdersByCustomer(customerId),
    enabled: Boolean(customerId),
});
export const useCustomers = (search = '') => useQuery({ queryKey: qk.customers(search), queryFn: () => customerService.listCustomers(search) });
export const useAbmPositions = () => useQuery({ queryKey: qk.abmPositions, queryFn: () => abmService.listPositions() });
export const useAbmStats = () => useQuery({ queryKey: qk.abmStats, queryFn: () => abmService.stats() });
export const useAdminStats = () => useQuery({ queryKey: qk.adminStats, queryFn: () => adminService.stats() });
export const useAuditLogs = () => useQuery({ queryKey: qk.auditLogs, queryFn: () => adminService.listAuditLogs() });
export const useSettings = () => useQuery({ queryKey: qk.settings, queryFn: () => adminService.getSettings() });
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
        mutationFn: (input) => adminService.updateSettings(input),
        onSuccess: () => client.invalidateQueries({ queryKey: qk.settings }),
    });
}
