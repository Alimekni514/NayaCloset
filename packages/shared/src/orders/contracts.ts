import { z } from 'zod';

import { orderStatusSchema } from '../common/enums';

const tunisianPostalCodeSchema = z
  .string()
  .trim()
  .transform((value) => value.replace(/[^\d]/gu, '').slice(0, 4))
  .refine((value) => /^\d{4}$/u.test(value), 'Le code postal doit contenir 4 chiffres.');

const tunisianPhoneSchema = z
  .string()
  .trim()
  .transform((value) => value.replace(/[^\d]/gu, ''))
  .refine((value) => /^\d{8}$/u.test(value), 'Le numero mobile doit contenir 8 chiffres.');

const optionalTunisianPhoneSchema = z
  .string()
  .trim()
  .transform((value) => value.replace(/[^\d]/gu, ''))
  .refine(
    (value) => value === '' || /^\d{8}$/u.test(value),
    'Le numero de telephone doit contenir 8 chiffres.',
  )
  .transform((value) => value || undefined)
  .optional();

const personNameSchema = z
  .string()
  .trim()
  .min(2, 'Champ obligatoire')
  .max(80, 'Valeur trop longue')
  .regex(/^[\p{L}\p{M}][\p{L}\p{M}\s'-]*$/u, 'Format invalide');

const optionalPersonNameSchema = z
  .string()
  .trim()
  .max(80, 'Valeur trop longue')
  .regex(/^[\p{L}\p{M}][\p{L}\p{M}\s'-]*$/u, 'Format invalide')
  .or(z.literal(''))
  .transform((value) => value || undefined)
  .optional();

const addressLineSchema = z
  .string()
  .trim()
  .min(3, 'Champ obligatoire')
  .max(160, 'Valeur trop longue');

const optionalAddressLineSchema = z
  .string()
  .trim()
  .max(160, 'Valeur trop longue')
  .or(z.literal(''))
  .transform((value) => value || undefined)
  .optional();

export const guestOrderItemInputSchema = z.object({
  productId: z.string().trim().regex(/^[a-fA-F0-9]{24}$/u, 'Produit invalide'),
  quantity: z.number().int().min(1).max(20),
});

export const guestOrderDeliveryInputSchema = z.object({
  contactLastName: personNameSchema,
  contactFirstName: optionalPersonNameSchema,
  addressLine1: addressLineSchema,
  addressLine2: optionalAddressLineSchema,
  governorateId: z.string().trim().min(1, 'Champ obligatoire'),
  cityId: z.string().trim().min(1, 'Champ obligatoire'),
  localityId: z.string().trim().min(1, 'Champ obligatoire'),
  postalCode: tunisianPostalCodeSchema,
  mobile: tunisianPhoneSchema,
  phone: optionalTunisianPhoneSchema,
});

export const guestOrderCreateRequestSchema = z.object({
  items: z
    .array(guestOrderItemInputSchema)
    .min(1, 'Votre panier est vide.')
    .max(20, 'Trop d\'articles dans la commande.'),
  delivery: guestOrderDeliveryInputSchema,
});

export const orderMoneySchema = z.number().int().nonnegative();

export const orderAddressNodeSchema = z.object({
  abmId: z.string(),
  label: z.string(),
});

export const guestOrderResponseSchema = z.object({
  order: z.object({
    id: z.string(),
    reference: z.string().regex(/^[A-Z]{6}$/u),
    status: orderStatusSchema,
    subtotalMillimes: orderMoneySchema,
    deliveryFeeMillimes: orderMoneySchema,
    totalMillimes: orderMoneySchema,
    currency: z.literal('TND'),
  }),
  message: z.string(),
});

export const adminOrdersListQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  status: orderStatusSchema.optional(),
  from: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/u).optional(),
  to: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/u).optional(),
  governorateId: z.string().trim().optional(),
  sortBy: z.enum(['createdAt', 'total', 'reference', 'status']).default('createdAt'),
  sortDirection: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
});

export const adminOrderIdParamsSchema = z.object({
  orderId: z.string().trim().regex(/^[a-fA-F0-9]{24}$/u),
});

export const declineOrderRequestSchema = z.object({
  reason: z.string().trim().max(240).optional(),
});

export const orderListItemSchema = z.object({
  id: z.string(),
  reference: z.string(),
  status: orderStatusSchema,
  customerName: z.string(),
  mobile: z.string(),
  destination: z.string(),
  itemsCount: z.number().int().nonnegative(),
  subtotalMillimes: orderMoneySchema,
  deliveryFeeMillimes: orderMoneySchema,
  totalMillimes: orderMoneySchema,
  currency: z.literal('TND'),
  createdAt: z.string(),
  abmPositionId: z.string().optional(),
  abmErrorMessage: z.string().optional(),
});

export const adminOrdersListResponseSchema = z.object({
  items: z.array(orderListItemSchema),
  summary: z.object({
    pending: z.number().int().nonnegative(),
    approving: z.number().int().nonnegative(),
    abmCreated: z.number().int().nonnegative(),
    abmFailed: z.number().int().nonnegative(),
    pendingTotalMillimes: orderMoneySchema,
  }),
  pagination: z.object({
    page: z.number().int().positive(),
    pageSize: z.number().int().positive(),
    totalItems: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
  }),
});

export const adminOrderDetailSchema = z.object({
  order: z.object({
    id: z.string(),
    reference: z.string(),
    status: orderStatusSchema,
    customer: z.object({
      userId: z.string().optional(),
      contactLastName: z.string(),
      contactFirstName: z.string().optional(),
      mobile: z.string(),
      phone: z.string().optional(),
    }),
    deliveryAddress: z.object({
      addressLine1: z.string(),
      addressLine2: z.string().optional(),
      governorate: orderAddressNodeSchema,
      city: orderAddressNodeSchema,
      locality: orderAddressNodeSchema,
      postalCode: z.string(),
    }),
    items: z.array(
      z.object({
        productId: z.string(),
        productName: z.string(),
        productImage: z.string().optional(),
        unitPriceMillimes: orderMoneySchema,
        quantity: z.number().int().positive(),
        lineTotalMillimes: orderMoneySchema,
      }),
    ),
    contentSummary: z.string(),
    subtotalMillimes: orderMoneySchema,
    deliveryFeeMillimes: orderMoneySchema,
    totalMillimes: orderMoneySchema,
    currency: z.literal('TND'),
    submittedAt: z.string(),
    approvedAt: z.string().optional(),
    abm: z
      .object({
        positionId: z.string().optional(),
        barcode: z.string().optional(),
        statusText: z.string().optional(),
        createdAt: z.string().optional(),
        lastErrorCode: z.string().optional(),
        lastErrorMessage: z.string().optional(),
        attemptCount: z.number().int().nonnegative(),
      })
      .optional(),
    abmPreview: z.object({
      pickup: z.record(z.string(), z.string()),
      delivery: z.record(z.string(), z.string()),
      parcel: z.record(z.string(), z.string()),
      service: z.record(z.string(), z.string()),
    }),
  }),
});

export const adminOrderActionResponseSchema = z.object({
  order: z.object({
    id: z.string(),
    reference: z.string(),
    status: orderStatusSchema,
    abmPositionId: z.string().optional(),
    abmErrorMessage: z.string().optional(),
  }),
  message: z.string(),
});

export type GuestOrderCreateRequest = z.infer<typeof guestOrderCreateRequestSchema>;
export type GuestOrderResponse = z.infer<typeof guestOrderResponseSchema>;
export type AdminOrdersListQuery = z.infer<typeof adminOrdersListQuerySchema>;
export type AdminOrdersListResponse = z.infer<typeof adminOrdersListResponseSchema>;
export type AdminOrderDetailResponse = z.infer<typeof adminOrderDetailSchema>;
export type AdminOrderActionResponse = z.infer<typeof adminOrderActionResponseSchema>;
