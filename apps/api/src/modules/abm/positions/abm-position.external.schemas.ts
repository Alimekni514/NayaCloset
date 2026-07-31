import { z } from 'zod';

const numericStringSchema = z
  .union([z.string(), z.number()])
  .transform((value) => String(value).trim())
  .refine((value) => value.length > 0, 'Expected non-empty string');

export const abmHtmlOptionSchema = z.object({
  id: z.string().trim().min(1),
  label: z.string().trim().min(1),
  selected: z.boolean(),
});

export const abmGovernorateItemSchema = z.object({
  IDN1: numericStringSchema,
  LIBELLEN1: z.string().trim().min(1),
});

export const abmCityItemSchema = z.object({
  IDN2: numericStringSchema,
  LIBELLEN2: z.string().trim().min(1),
});

export const abmLocalityItemSchema = z.object({
  IDN3: numericStringSchema,
  LIBELLEN3: z.string().trim().min(1),
});

export const abmPostalCodeSchema = z
  .union([
    z.string(),
    z.object({
      CP: z.union([z.string(), z.number()]).optional(),
      CODEPOSTAL: z.union([z.string(), z.number()]).optional(),
      postalCode: z.union([z.string(), z.number()]).optional(),
    }),
  ])
  .transform((value) => {
    if (typeof value === 'string') {
      return value.trim();
    }

    return String(value.CP ?? value.CODEPOSTAL ?? value.postalCode ?? '').trim();
  })
  .refine((value) => value.length > 0, 'Expected postal code');

const addressValueSchema = z.union([z.string(), z.number(), z.null(), z.undefined()]).transform((value) => {
  if (value == null) {
    return '';
  }

  return String(value).trim();
});

export const abmAddressDetailSchema = z.object({
  CONTACTNOM: addressValueSchema.optional(),
  CONTACTPRENOM: addressValueSchema.optional(),
  ADR1: addressValueSchema.optional(),
  ADR2: addressValueSchema.optional(),
  IDN1: addressValueSchema.optional(),
  IDN2: addressValueSchema.optional(),
  IDN3: addressValueSchema.optional(),
  LOCN1: addressValueSchema.optional(),
  ELOCN1: addressValueSchema.optional(),
  LOCN2: addressValueSchema.optional(),
  ELOCN2: addressValueSchema.optional(),
  LOCN3: addressValueSchema.optional(),
  ELOCN3: addressValueSchema.optional(),
  LIBELLEN1: addressValueSchema.optional(),
  LIBELLEN2: addressValueSchema.optional(),
  LIBELLEN3: addressValueSchema.optional(),
  ADRSTATE: addressValueSchema.optional(),
  ADRVILLE: addressValueSchema.optional(),
  CODEPOSTAL: addressValueSchema.optional(),
  ADRPORTABLE: addressValueSchema.optional(),
  ADRTEL: addressValueSchema.optional(),
  ADRFAX: addressValueSchema.optional(),
  ADRMAIL: addressValueSchema.optional(),
}).passthrough();
