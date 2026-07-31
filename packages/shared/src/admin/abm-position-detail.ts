import { z } from 'zod';

export const ABM_POSITION_DETAIL_SCHEMA_VERSION = '2026-07-29-v1';

export const abmPositionDetailStatusCategorySchema = z.enum([
  'created',
  'progress',
  'delivered',
  'anomaly',
  'return',
  'cancelled',
  'neutral',
]);

export const abmPositionDetailProgressStageSchema = z.enum(['pickup', 'delivery', 'delivered']);

export const abmPositionDetailParamsSchema = z.object({
  positionId: z.string().trim().regex(/^\d{1,20}$/u, 'Invalid position ID'),
});

export const abmPositionDetailEventSchema = z.object({
  id: z.string().trim().min(1),
  label: z.string().trim().min(1),
  occurredAt: z.string().datetime().nullable(),
  isCurrent: z.boolean(),
});

const optionalIsoDateTimeSchema = z.string().datetime().nullable().optional();

export const abmPositionDetailLocationSchema = z.object({
  governorate: z.string().trim().optional(),
  city: z.string().trim().optional(),
  locality: z.string().trim().optional(),
  postalCode: z.string().trim().optional(),
  address: z.string().trim().optional(),
  displayLabel: z.string().trim().min(1),
});

export const abmPositionDetailRecipientSchema = z.object({
  firstName: z.string().trim().optional(),
  lastName: z.string().trim().optional(),
  fullName: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  email: z.string().trim().optional(),
});

export const abmPositionDetailShipmentSchema = z.object({
  type: z.string().trim().optional(),
  service: z.string().trim().optional(),
  weightKg: z.number().finite().nullable().optional(),
  pieces: z.number().int().nullable().optional(),
  codAmount: z.number().finite().nullable().optional(),
  reference: z.string().trim().optional(),
  declaredValue: z.number().finite().nullable().optional(),
  contents: z.array(z.string().trim().min(1)).optional(),
  paymentMode: z.string().trim().optional(),
  exchange: z.boolean().optional(),
  allowOpen: z.boolean().optional(),
});

export const abmPositionDetailDimensionsSchema = z.object({
  lengthCm: z.number().finite().nullable().optional(),
  widthCm: z.number().finite().nullable().optional(),
  heightCm: z.number().finite().nullable().optional(),
  volume: z.number().finite().nullable().optional(),
});

export const abmPositionDetailSchema = z.object({
  id: z.string().trim().min(1),
  barcode: z.string().trim().min(1),
  reference: z.string().trim().optional(),
  status: z.object({
    eventId: z.number().int().optional(),
    label: z.string().trim().min(1),
    category: abmPositionDetailStatusCategorySchema,
  }),
  progressStage: abmPositionDetailProgressStageSchema,
  createdAt: optionalIsoDateTimeSchema,
  pickupDate: optionalIsoDateTimeSchema,
  deliveryDate: optionalIsoDateTimeSchema,
  updatedAt: optionalIsoDateTimeSchema,
  departure: abmPositionDetailLocationSchema,
  destination: abmPositionDetailLocationSchema,
  recipient: abmPositionDetailRecipientSchema.optional(),
  shipment: abmPositionDetailShipmentSchema,
  dimensions: abmPositionDetailDimensionsSchema,
  attempts: z.number().int().nullable().optional(),
  events: z.array(abmPositionDetailEventSchema),
  permissions: z.object({
    canEdit: z.boolean(),
    canDelete: z.boolean(),
    canPrintNormal: z.boolean(),
    canPrintZebra: z.boolean(),
  }),
});

export const abmPositionDetailResponseSchema = z.object({
  position: abmPositionDetailSchema,
});

const DIACRITICS_REGEX = /[\u0300-\u036f]/gu;

const normalizeForMatching = (value: string): string =>
  value
    .normalize('NFD')
    .replace(DIACRITICS_REGEX, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, ' ')
    .trim();

const includesOneOf = (value: string, patterns: string[]): boolean =>
  patterns.some((pattern) => value.includes(pattern));

export const mapAbmStatusCategory = (
  label: string | null | undefined,
): z.infer<typeof abmPositionDetailStatusCategorySchema> => {
  const normalized = normalizeForMatching(label ?? '');

  if (!normalized) {
    return 'neutral';
  }

  if (
    includesOneOf(normalized, [
      'colis livre',
      'livre',
      'livree',
      'livraison effectuee',
      'delivered',
    ])
  ) {
    return 'delivered';
  }

  if (
    includesOneOf(normalized, [
      'retour',
      'retourne',
      'retournee',
      'retour generes',
      'cloture pour retour',
    ])
  ) {
    return 'return';
  }

  if (
    includesOneOf(normalized, [
      'annule',
      'annulee',
      'cancelled',
      'supprime',
    ])
  ) {
    return 'cancelled';
  }

  if (
    includesOneOf(normalized, [
      'anomal',
      'echec',
      'erreur',
      'incident',
      'refuse',
      'rejete',
      'rejetee',
      'bloque',
      'blocked',
    ])
  ) {
    return 'anomaly';
  }

  if (
    includesOneOf(normalized, [
      'creation etiquette position',
      'creation position',
      'etiquette',
      'pickup planned',
      'waiting for pickup',
    ])
  ) {
    return 'created';
  }

  if (
    includesOneOf(normalized, [
      'tentative enlevement',
      'colis enleve',
      'reception hub',
      'colis valide',
      'planification livraison',
      'livraison planifiee en cours de tournee',
      'livraison en cours',
      'delivery',
      'hub',
      'tournee',
    ])
  ) {
    return 'progress';
  }

  return 'neutral';
};

export const mapAbmProgressStage = (
  label: string | null | undefined,
  category?: z.infer<typeof abmPositionDetailStatusCategorySchema>,
): z.infer<typeof abmPositionDetailProgressStageSchema> => {
  const normalized = normalizeForMatching(label ?? '');

  if (category === 'delivered') {
    return 'delivered';
  }

  if (
    includesOneOf(normalized, [
      'colis enleve',
      'reception hub',
      'colis valide',
      'planification livraison',
      'livraison planifiee en cours de tournee',
      'livraison en cours',
      'tournee',
    ])
  ) {
    return 'delivery';
  }

  return 'pickup';
};

export type AbmPositionDetailStatusCategory = z.infer<typeof abmPositionDetailStatusCategorySchema>;
export type AbmPositionDetailProgressStage = z.infer<typeof abmPositionDetailProgressStageSchema>;
export type AbmPositionDetailEvent = z.infer<typeof abmPositionDetailEventSchema>;
export type AbmPositionDetailLocation = z.infer<typeof abmPositionDetailLocationSchema>;
export type AbmPositionDetailRecipient = z.infer<typeof abmPositionDetailRecipientSchema>;
export type AbmPositionDetailShipment = z.infer<typeof abmPositionDetailShipmentSchema>;
export type AbmPositionDetailDimensions = z.infer<typeof abmPositionDetailDimensionsSchema>;
export type AbmPositionDetail = z.infer<typeof abmPositionDetailSchema>;
export type AbmPositionDetailResponse = z.infer<typeof abmPositionDetailResponseSchema>;
