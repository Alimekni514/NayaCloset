import placeholderProductImage from '@/assets/p-casque.jpg';
import { apiClient } from '@/lib/api-client';

import * as db from './mock-data';
import type {
  AbmPosition,
  AuditLog,
  Category,
  Customer,
  Order,
  OrderStatus,
  Product,
  ShippingAddress,
  StoreSettings,
} from './types';

const LATENCY = 220;

function delay<T>(value: T, ms = LATENCY): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(structuredClone(value)), ms));
}

export interface ProductQuery {
  search?: string;
  categoryId?: string | null;
  minPrice?: number;
  maxPrice?: number;
  sort?: 'recent' | 'price-asc' | 'price-desc' | 'rating';
}

export interface OrderQuery {
  search?: string;
  status?: OrderStatus | null;
  from?: string;
  to?: string;
}

export interface AdminStats {
  totalOrders: number;
  pendingOrders: number;
  validatedOrders: number;
  shipmentsCreated: number;
  abmErrors: number;
  revenue: number;
}

type ApiProduct = {
  id: string;
  slug: string;
  name: string;
  description: string;
  priceCents: number;
  inventory: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

const storefrontCategory: Category = {
  id: 'catalogue',
  slug: 'catalogue',
  name: 'Catalogue',
  description: 'Tous les produits disponibles pour la livraison.',
};

const mapApiProduct = (product: ApiProduct): Product => ({
  id: product.id,
  slug: product.slug,
  name: product.name,
  description: product.description,
  price: product.priceCents / 100,
  categoryId: storefrontCategory.id,
  stock: product.inventory,
  images: [placeholderProductImage],
  rating: 4.5,
  featured: true,
  createdAt: product.createdAt,
});

export const catalogService = {
  listCategories: (): Promise<Category[]> => delay([storefrontCategory]),
  listProducts: async (query: ProductQuery = {}): Promise<Product[]> => {
    const response = await apiClient.get<{ items: ApiProduct[] }>('/products', {
      params: query.search?.trim() ? { search: query.search.trim() } : {},
    });

    let result = response.data.items
      .filter((product) => product.isActive)
      .map(mapApiProduct);

    if (query.minPrice != null) {
      result = result.filter((product) => product.price >= query.minPrice!);
    }

    if (query.maxPrice != null) {
      result = result.filter((product) => product.price <= query.maxPrice!);
    }

    result = [...result].sort((a, b) => {
      switch (query.sort) {
        case 'price-asc':
          return a.price - b.price;
        case 'price-desc':
          return b.price - a.price;
        case 'rating':
          return b.rating - a.rating;
        default:
          return +new Date(b.createdAt) - +new Date(a.createdAt);
      }
    });

    return result;
  },
  getProduct: async (id: string): Promise<Product> => {
    const response = await apiClient.get<{ item: ApiProduct }>(`/products/${id}`);
    return mapApiProduct(response.data.item);
  },
  getProductsByIds: async (ids: string[]): Promise<Product[]> => {
    const response = await apiClient.get<{ items: ApiProduct[] }>('/products');
    return response.data.items
      .filter((product) => product.isActive && ids.includes(product.id))
      .map(mapApiProduct);
  },
};

export const orderService = {
  listOrders: (query: OrderQuery = {}): Promise<Order[]> => {
    const term = query.search?.trim().toLowerCase() ?? '';
    const result = db.orders
      .filter((order) => {
        const subject = `${order.address.firstName} ${order.address.lastName} ${order.reference} ${order.address.phone}`;

        if (term && !subject.toLowerCase().includes(term)) {
          return false;
        }

        if (query.status && order.status !== query.status) {
          return false;
        }

        if (query.from && new Date(order.createdAt) < new Date(query.from)) {
          return false;
        }

        if (query.to && new Date(order.createdAt) > new Date(`${query.to}T23:59:59`)) {
          return false;
        }

        return true;
      })
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

    return delay(result);
  },
  listOrdersByCustomer: (customerId: string): Promise<Order[]> =>
    delay(
      db.orders
        .filter((order) => order.customerId === customerId)
        .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
    ),
  getOrder: (id: string): Promise<Order> => {
    const found = db.orders.find((order) => order.id === id || order.reference === id);

    if (!found) {
      return Promise.reject(new Error('Commande introuvable'));
    }

    return delay(found);
  },
  createOrder: (input: {
    customerId: string;
    address: ShippingAddress;
    items: Order['items'];
    shippingFee: number;
  }): Promise<Order> => {
    const subtotal = input.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const now = new Date().toISOString();
    const order: Order = {
      id: `o${Date.now()}`,
      reference: `CMD-2026-${1000 + db.orders.length + 48}`,
      customerId: input.customerId,
      address: input.address,
      items: input.items,
      subtotal,
      shippingFee: input.shippingFee,
      total: subtotal + input.shippingFee,
      status: 'PENDING',
      paymentMethod: 'COD',
      abm: {},
      timeline: [{ status: 'PENDING', label: 'Commande recue', at: now }],
      createdAt: now,
    };

    db.orders.unshift(order);
    return delay(order);
  },
};

export const customerService = {
  listCustomers: (search = ''): Promise<Customer[]> => {
    const term = search.trim().toLowerCase();

    return delay(
      db.customers.filter((customer) =>
        `${customer.firstName} ${customer.lastName} ${customer.email} ${customer.phone}`
          .toLowerCase()
          .includes(term),
      ),
    );
  },
};

export const abmService = {
  listPositions: (): Promise<AbmPosition[]> => delay(db.abmPositions),
  stats: () =>
    delay({
      shipmentsCreated: db.orders.filter((order) => order.status === 'SHIPMENT_CREATED').length,
      processing: db.orders.filter((order) => order.status === 'ABM_PROCESSING').length,
      errors: db.orders.filter((order) => order.status === 'ABM_ERROR').length,
      successRate: 0.86,
      averageDelayHours: 19.4,
      byGovernorate: [
        { governorate: 'Tunis', shipments: 42, errors: 2 },
        { governorate: 'Ariana', shipments: 31, errors: 5 },
        { governorate: 'Sousse', shipments: 26, errors: 1 },
        { governorate: 'Sfax', shipments: 18, errors: 6 },
        { governorate: 'Nabeul', shipments: 12, errors: 0 },
      ],
      weekly: [
        { week: 'S26', shipments: 22, errors: 3 },
        { week: 'S27', shipments: 28, errors: 2 },
        { week: 'S28', shipments: 34, errors: 5 },
        { week: 'S29', shipments: 31, errors: 1 },
        { week: 'S30', shipments: 39, errors: 4 },
      ],
    }),
};

export const adminService = {
  stats: (): Promise<AdminStats> =>
    delay({
      totalOrders: db.orders.length,
      pendingOrders: db.orders.filter((order) => order.status === 'PENDING').length,
      validatedOrders: db.orders.filter((order) => order.status === 'VALIDATED').length,
      shipmentsCreated: db.orders.filter((order) => order.status === 'SHIPMENT_CREATED').length,
      abmErrors: db.orders.filter((order) => order.status === 'ABM_ERROR').length,
      revenue: db.orders
        .filter((order) => !['REJECTED', 'CANCELLED'].includes(order.status))
        .reduce((sum, order) => sum + order.total, 0),
    }),
  listAuditLogs: (): Promise<AuditLog[]> =>
    delay([...db.auditLogs].sort((a, b) => +new Date(b.at) - +new Date(a.at))),
  getSettings: (): Promise<StoreSettings> => delay(db.settings),
  updateSettings: (input: Partial<StoreSettings>): Promise<StoreSettings> => {
    Object.assign(db.settings, input);
    return delay(db.settings);
  },
};
