import { z } from 'zod';

export const userRoleValues = ['CLIENT', 'ADMIN', 'SUPER_ADMIN'] as const;
export const orderStatusValues = [
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
] as const;

export const userRoleSchema = z.enum(userRoleValues);
export const orderStatusSchema = z.enum(orderStatusValues);

export type UserRole = (typeof userRoleValues)[number];
export type OrderStatus = (typeof orderStatusValues)[number];
