import type { OrderStatus } from '@delivery-commerce/shared';

export type { OrderStatus } from '@delivery-commerce/shared';

export const ORDER_STATUSES: OrderStatus[] = [
  'PENDING',
  'APPROVING',
  'APPROVED',
  'ABM_CREATED',
  'ABM_FAILED',
  'VALIDATED',
  'REJECTED',
  'ABM_PROCESSING',
  'SHIPMENT_CREATED',
  'ABM_ERROR',
  'CANCELLED',
];

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: 'En attente',
  APPROVING: 'Traitement ABM',
  APPROVED: 'Approuvee',
  ABM_CREATED: 'Expedition creee',
  ABM_FAILED: 'Erreur ABM',
  VALIDATED: 'Validee',
  REJECTED: 'Rejetee',
  ABM_PROCESSING: 'Traitement ABM',
  SHIPMENT_CREATED: 'Expedition creee',
  ABM_ERROR: 'Erreur ABM',
  CANCELLED: 'Annulee',
};

export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  categoryId: string;
  stock: number;
  images: string[];
  rating: number;
  featured: boolean;
  createdAt: string;
}

export interface CartLine {
  productId: string;
  quantity: number;
}

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  governorate: string;
  city: string;
  ordersCount: number;
  totalSpent: number;
  createdAt: string;
}

export interface ShippingAddress {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  governorate: string;
  city: string;
  locality: string;
  postalCode: string;
  addressLine1: string;
  addressLine2?: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  image: string;
  unitPrice: number;
  quantity: number;
}

export interface OrderEvent {
  status: OrderStatus;
  label: string;
  at: string;
  note?: string;
}

export interface AbmShipment {
  trackingNumber?: string;
  barcode?: string;
  positionCode?: string;
  hubName?: string;
  createdAt?: string;
  lastSyncAt?: string;
  errorCode?: string;
  errorMessage?: string;
}

export interface Order {
  id: string;
  reference: string;
  customerId: string;
  address: ShippingAddress;
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  total: number;
  status: OrderStatus;
  paymentMethod: 'COD';
  rejectionReason?: string;
  abm: AbmShipment;
  timeline: OrderEvent[];
  createdAt: string;
}

export interface AbmPosition {
  id: string;
  code: string;
  name: string;
  governorate: string;
  city: string;
  capacity: number;
  used: number;
  status: 'ACTIVE' | 'SATURATED' | 'OFFLINE';
}

export interface AuditLog {
  id: string;
  at: string;
  actor: string;
  action: string;
  target: string;
  detail: string;
  level: 'INFO' | 'WARNING' | 'ERROR';
}

export interface StoreSettings {
  storeName: string;
  supportEmail: string;
  supportPhone: string;
  shippingFee: number;
  freeShippingThreshold: number;
  codEnabled: boolean;
  abmEnabled: boolean;
  abmAccountLabel: string;
  abmEnvironment: 'sandbox' | 'production';
  abmAutoCreateShipment: boolean;
}
