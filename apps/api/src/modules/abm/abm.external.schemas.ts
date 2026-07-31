import { z } from 'zod';

const numberLikeSchema = z
  .union([z.number(), z.string().trim()])
  .transform((value) => (typeof value === 'number' ? value : Number(value)))
  .refine((value) => Number.isFinite(value), 'Expected a finite number');

const booleanLikeSchema = z
  .union([z.boolean(), z.literal(0), z.literal(1)])
  .transform((value) => value === true || value === 1);

export const abmExternalDashboardItemSchema = z
  .object({
    TYPE: z.string().trim().min(1),
    EVENTID: numberLikeSchema.transform((value) => Math.trunc(value)),
    EVENTLIBELLE: z.string().trim().min(1),
    COUNT: numberLikeSchema.transform((value) => Math.max(0, Math.trunc(value))),
    COLOR: z.string().nullable().optional().default(null),
    ICON: z.string().nullable().optional().default(null),
    HAS_DATE: booleanLikeSchema,
  })
  .passthrough();

export const abmExternalDashboardResponseSchema = z.array(abmExternalDashboardItemSchema);
