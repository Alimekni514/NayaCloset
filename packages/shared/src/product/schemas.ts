import { z } from 'zod';

export const productSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string(),
  priceCents: z.number().int().nonnegative(),
  isActive: z.boolean(),
  inventory: z.number().int().nonnegative(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const productsQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
});

export type ProductDto = z.infer<typeof productSchema>;
export type ProductsQuery = z.infer<typeof productsQuerySchema>;
