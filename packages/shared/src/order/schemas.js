import { z } from 'zod';
import { orderStatusSchema } from '../common/enums';
export const orderItemSchema = z.object({
    productId: z.string(),
    quantity: z.number().int().min(1).max(100),
});
export const createOrderSchema = z.object({
    items: z.array(orderItemSchema).min(1),
    notes: z.string().trim().max(500).optional(),
});
export const orderSchema = z.object({
    id: z.string(),
    userId: z.string(),
    status: orderStatusSchema,
    items: z.array(z.object({
        productId: z.string(),
        quantity: z.number().int().min(1),
        unitPriceCents: z.number().int().nonnegative(),
    })),
    totalCents: z.number().int().nonnegative(),
    notes: z.string().optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
});
