import { z } from 'zod';

const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
  }, 'Invalid calendar date');

const timeSchema = z
  .string()
  .regex(/^\d{2}:\d{2}$/)
  .refine((value) => {
    const parts = value.split(':');
    const hours = Number(parts[0]);
    const minutes = Number(parts[1]);

    if (Number.isNaN(hours) || Number.isNaN(minutes)) {
      return false;
    }

    return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
  }, 'Invalid time');

const phoneSchema = z
  .string()
  .trim()
  .min(1)
  .regex(/^(\+?\d[\d\s-]*)$/u, 'Invalid phone number');

export const abmSelectOptionSchema = z.object({
  id: z.string().trim().min(1),
  label: z.string().trim().min(1),
  selected: z.boolean().default(false),
});

export const abmLocationOptionSchema = z.object({
  id: z.string().trim().min(1),
  label: z.string().trim().min(1),
});

export const abmPostalCodeResponseSchema = z.object({
  postalCode: z.string().trim().min(1),
});

export const abmPositionAddressSchema = z.object({
  id: z.string().trim().min(1).optional(),
  contactLastName: z.string().trim().min(1),
  contactFirstName: z.string().trim().optional(),
  addressLine1: z.string().trim().min(1),
  addressLine2: z.string().trim().optional(),
  governorateId: z.string().trim().min(1),
  governorateName: z.string().trim().optional(),
  cityId: z.string().trim().min(1),
  cityName: z.string().trim().optional(),
  localityId: z.string().trim().min(1),
  localityName: z.string().trim().optional(),
  postalCode: z.string().trim().min(1),
  mobile: phoneSchema,
  phone: z.string().trim().optional(),
  fax: z.string().trim().optional(),
  email: z.string().trim().email().optional().or(z.literal('')),
});

export const abmPositionPickupSchema = abmPositionAddressSchema.extend({
  addressBookId: z.string().trim().optional(),
});

export const abmPositionDeliverySchema = abmPositionAddressSchema.extend({
  addressBookId: z.string().trim().optional(),
});

export const abmPositionParcelDefaultsSchema = z.object({
  packagingId: z.string().trim().min(1),
  merchandiseTypeId: z.string().trim().min(1),
  length: z.string().trim().min(1),
  height: z.string().trim().min(1),
  width: z.string().trim().min(1),
  volume: z.string().trim().min(1),
  pickupTime: timeSchema,
});

export const abmPositionParcelSchema = z.object({
  pickupDate: isoDateSchema,
  pickupTime: timeSchema.default('14:00'),
  weight: z.number().positive(),
  pieces: z.number().int().positive(),
  reference: z.string().trim().max(255).optional(),
  declaredValue: z.number().min(0).optional(),
  contents: z.array(z.string().trim().min(1)).default([]),
});

export const abmPositionServiceSchema = z
  .object({
    serviceId: z.string().trim().min(1),
    codAmount: z.number().min(0),
    paymentModeId: z.string().trim().min(1),
    exchange: z.boolean().default(false),
    exchangeContents: z.string().trim().optional(),
    allowOpen: z.boolean(),
  })
  .refine(
    (value) => !value.exchange || Boolean(value.exchangeContents?.trim()),
    {
      message: 'exchangeContents is required when exchange is enabled',
      path: ['exchangeContents'],
    },
  );

export const abmPositionFormOptionsSchema = z.object({
  pickupAddressBook: z.array(abmSelectOptionSchema),
  deliveryAddressBook: z.array(abmSelectOptionSchema),
  governorates: z.array(abmLocationOptionSchema),
  serviceOptions: z.array(abmSelectOptionSchema),
  paymentModeOptions: z.array(abmSelectOptionSchema),
  packagingOptions: z.array(abmSelectOptionSchema),
  merchandiseTypeOptions: z.array(abmSelectOptionSchema),
  defaults: abmPositionParcelDefaultsSchema,
  preferredPickupAddressId: z.string().trim().optional(),
});

export const createAbmPositionRequestSchema = z.object({
  pickup: abmPositionPickupSchema,
  delivery: abmPositionDeliverySchema,
  parcel: abmPositionParcelSchema,
  service: abmPositionServiceSchema,
});

export const createAbmPositionResponseSchema = z.object({
  position: z.object({
    id: z.string().trim().min(1),
  }),
  message: z.string().trim().min(1),
});

export type AbmSelectOption = z.infer<typeof abmSelectOptionSchema>;
export type AbmLocationOption = z.infer<typeof abmLocationOptionSchema>;
export type AbmPostalCodeResponse = z.infer<typeof abmPostalCodeResponseSchema>;
export type AbmPositionAddress = z.infer<typeof abmPositionAddressSchema>;
export type AbmPositionPickup = z.infer<typeof abmPositionPickupSchema>;
export type AbmPositionDelivery = z.infer<typeof abmPositionDeliverySchema>;
export type AbmPositionParcelDefaults = z.infer<typeof abmPositionParcelDefaultsSchema>;
export type AbmPositionParcel = z.infer<typeof abmPositionParcelSchema>;
export type AbmPositionService = z.infer<typeof abmPositionServiceSchema>;
export type AbmPositionFormOptions = z.infer<typeof abmPositionFormOptionsSchema>;
export type CreateAbmPositionRequest = z.infer<typeof createAbmPositionRequestSchema>;
export type CreateAbmPositionResponse = z.infer<typeof createAbmPositionResponseSchema>;
