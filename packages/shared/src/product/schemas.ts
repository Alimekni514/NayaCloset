import { z } from 'zod';

export const colorVariantSchema = z.object({
  color: z.string(),
  imageUrl: z.string(),
});

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
  // Optional extended fields (backward-compatible)
  category: z.string().optional(),
  deliveryFeeCents: z.number().int().nonnegative().optional(),
  colorVariants: z.array(colorVariantSchema).optional(),
});

export const productsQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
});

export type ColorVariantDto = z.infer<typeof colorVariantSchema>;
export type ProductDto = z.infer<typeof productSchema>;
export type ProductsQuery = z.infer<typeof productsQuerySchema>;
