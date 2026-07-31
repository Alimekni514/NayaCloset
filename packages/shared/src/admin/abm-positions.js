import { z } from 'zod';
export const ABM_POSITIONS_SCHEMA_VERSION = 'date-only-v3';
const getLocalIsoDate = () => {
    const now = new Date();
    const offsetMs = now.getTimezoneOffset() * 60_000;
    return new Date(now.getTime() - offsetMs).toISOString().slice(0, 10);
};
const isoDateSchema = z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}, 'Invalid calendar date');
const isoDateTimeSchema = z.string().datetime().nullable().optional();
export const abmPositionStatusCategorySchema = z.enum([
    'created',
    'progress',
    'delivered',
    'anomaly',
    'return',
    'cancelled',
    'neutral',
]);
export const abmPositionSortByValues = [
    'barcode',
    'reference',
    'createdAt',
    'pickupDate',
    'deliveryDate',
    'recipient',
    'governorate',
    'codAmount',
    'status',
];
export const abmPositionSortDirectionValues = ['asc', 'desc'];
export const abmPositionPageSizeValues = [10, 20, 50];
export const abmPositionsQuerySchema = z
    .object({
    from: isoDateSchema.optional(),
    to: isoDateSchema.optional(),
})
    .superRefine((value, ctx) => {
    if (Boolean(value.from) !== Boolean(value.to)) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['from'],
            message: 'from and to must be provided together',
        });
    }
    if (value.from && value.to && value.from > value.to) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['from'],
            message: 'from must not be after to',
        });
    }
})
    .transform((value) => {
    const today = getLocalIsoDate();
    return {
        from: value.from ?? today,
        to: value.to ?? today,
    };
});
export const abmPositionListItemSchema = z.object({
    id: z.string().trim().min(1),
    barcode: z.string().trim().min(1),
    reference: z.string().trim().min(1),
    createdAt: isoDateTimeSchema.nullable().default(null),
    pickupDate: isoDateTimeSchema.nullable().default(null),
    deliveryDate: isoDateTimeSchema.nullable().default(null),
    updatedAt: isoDateTimeSchema.nullable().default(null),
    departure: z.object({
        governorate: z.string().trim().optional(),
        city: z.string().trim().min(1),
        locality: z.string().trim().min(1),
    }),
    recipient: z.object({
        firstName: z.string().trim().optional(),
        lastName: z.string().trim().min(1),
        fullName: z.string().trim().min(1),
        phone: z.string().trim().min(1),
        email: z.string().trim().optional(),
    }),
    destination: z.object({
        governorate: z.string().trim().min(1),
        city: z.string().trim().min(1),
        locality: z.string().trim().min(1),
        postalCode: z.string().trim().min(1),
        addressLine1: z.string().trim().optional(),
        addressLine2: z.string().trim().optional(),
    }),
    service: z.string().trim().min(1),
    codAmount: z.number().finite().min(0),
    eventId: z.number().int(),
    statusLabel: z.string().trim().min(1),
    statusCategory: abmPositionStatusCategorySchema,
    deliveryAttempts: z.number().int().nonnegative(),
    pieces: z.number().int().nonnegative(),
    permissions: z.object({
        canView: z.boolean(),
        canEdit: z.boolean(),
        canDelete: z.boolean(),
    }),
});
export const abmPositionsResponseSchema = z.object({
    items: z.array(abmPositionListItemSchema),
    period: z.object({
        from: isoDateSchema,
        to: isoDateSchema,
    }),
    summary: z.object({
        total: z.number().int().nonnegative(),
        totalCod: z.number().finite().min(0),
        delivered: z.number().int().nonnegative(),
        anomalies: z.number().int().nonnegative(),
    }),
    syncedAt: z.string().datetime(),
});
export const abmPositionDeleteParamsSchema = z.object({
    positionId: z.string().trim().min(1),
});
export const abmPositionDeleteResponseSchema = z.object({
    deleted: z.literal(true),
});
