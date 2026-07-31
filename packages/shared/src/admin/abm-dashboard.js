import { z } from 'zod';
export const abmDashboardGroupSchema = z.enum(['POSITION', 'RETOUR', 'ECHANGE']);
const isoDateSchema = z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}, 'Invalid calendar date');
export const abmDashboardQuerySchema = z
    .object({
    from: isoDateSchema.optional(),
    to: isoDateSchema.optional(),
})
    .refine((value) => {
    const bothMissing = !value.from && !value.to;
    const bothPresent = Boolean(value.from && value.to);
    return bothMissing || bothPresent;
}, {
    message: 'Both from and to must be provided together',
    path: ['from'],
})
    .refine((value) => !value.from || !value.to || new Date(`${value.from}T00:00:00.000Z`) <= new Date(`${value.to}T00:00:00.000Z`), {
    message: 'from must be before or equal to to',
    path: ['from'],
});
export const abmDashboardEventSchema = z.object({
    type: abmDashboardGroupSchema,
    eventId: z.number().int(),
    label: z.string().trim().min(1),
    count: z.number().int().nonnegative(),
    hasDate: z.boolean(),
});
export const abmDashboardTotalsSchema = z.object({
    positions: z.number().int().nonnegative(),
    returns: z.number().int().nonnegative(),
    exchanges: z.number().int().nonnegative(),
});
export const abmDashboardResponseSchema = z.object({
    totals: abmDashboardTotalsSchema,
    groups: z.object({
        POSITION: z.array(abmDashboardEventSchema),
        RETOUR: z.array(abmDashboardEventSchema),
        ECHANGE: z.array(abmDashboardEventSchema),
    }),
    period: z.object({
        from: z.string().nullable(),
        to: z.string().nullable(),
        filtered: z.boolean(),
    }),
    syncedAt: z.string(),
});
