import { z } from 'zod';
export const userRoleValues = ['CLIENT', 'ADMIN', 'SUPER_ADMIN'];
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
];
export const userRoleSchema = z.enum(userRoleValues);
export const orderStatusSchema = z.enum(orderStatusValues);
